import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/entitlements";
import { IMPORT_ENTITIES, type ImportEntity } from "@/lib/import/schema";
import { runImport } from "@/lib/import/run";

const BodySchema = z.object({
  entity: z.enum(["casos", "estoque", "contratos"]),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.string())).min(1).max(500),
});

/** POST /api/import — importa linhas já mapeadas (CSV parseado no cliente). */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await parseBody(req, BodySchema);
    const def = IMPORT_ENTITIES.find((e) => e.id === body.entity);
    if (!def) return jsonError("Tipo de importação inválido", 400);

    if (def.feature) {
      const blocked = await requireFeature(session.tenantId, def.feature);
      if (blocked) return blocked;
    }

    const mappedFields = new Set(Object.values(body.mapping).filter(Boolean));
    for (const field of def.fields.filter((f) => f.required)) {
      if (!mappedFields.has(field.key)) {
        return jsonError(`Mapeie a coluna obrigatória: ${field.label}`, 400);
      }
    }

    const result = await runImport({
      entity: body.entity as ImportEntity,
      rows: body.rows,
      mapping: body.mapping,
      session,
    });

    return NextResponse.json(result);
  },
  { roles: ["admin", "atendente", "financeiro"] }
);
