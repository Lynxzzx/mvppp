import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

const updateCaseSchema = z.object({
  family: z
    .object({
      name: z.string().min(2),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      relationship: z.string().optional(),
      document: z.string().optional(),
    })
    .optional(),
  deceased: z
    .object({
      name: z.string().min(2),
      dateOfBirth: z.string().optional(),
      dateOfDeath: z.string().optional(),
      placeOfDeath: z.string().optional(),
    })
    .optional(),
  serviceType: z.enum(["velorio", "sepultamento", "cremacao"]).optional(),
  status: z.enum(["novo", "em_andamento", "encerrado"]).optional(),
});

/** GET /api/cases/[id] */
export const GET = withAuth<Ctx>(async (_req, session, ctx) => {
  const { id } = await ctx.params;
  const objectId = toObjectId(id);
  if (!objectId) return jsonError("Caso não encontrado", 404);
  const found = await Case.findOne({ _id: objectId, tenantId: session.tenantId }).lean();
  if (!found) return jsonError("Caso não encontrado", 404);
  return NextResponse.json({ case: found });
});

/** PATCH /api/cases/[id] — atualiza dados e/ou status. */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const data = await parseBody(req, updateCaseSchema);

    const doc = await Case.findOne({ _id: objectId, tenantId: session.tenantId });
    if (!doc) return jsonError("Caso não encontrado", 404);
    if (doc.anonymizedAt) return jsonError("Caso anonimizado não pode ser alterado", 409);

    if (data.family) {
      doc.family = { ...data.family, email: data.family.email || undefined };
    }
    if (data.deceased) {
      doc.deceased = {
        ...data.deceased,
        dateOfBirth: data.deceased.dateOfBirth ? new Date(data.deceased.dateOfBirth) : undefined,
        dateOfDeath: data.deceased.dateOfDeath ? new Date(data.deceased.dateOfDeath) : undefined,
      };
    }
    if (data.serviceType) doc.serviceType = data.serviceType;

    if (data.status && data.status !== doc.status) {
      doc.timeline.push({
        kind: "status",
        text: `Status alterado de "${STATUS_LABEL[doc.status]}" para "${STATUS_LABEL[data.status]}"`,
        userId: session.userId,
        userName: session.name,
      });
      doc.status = data.status;
      doc.closedAt = data.status === "encerrado" ? new Date() : undefined;
    }

    await doc.save();
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"] }
);

/** DELETE /api/cases/[id] — exclusão (somente admin) com auditoria (PRD §7). */
export const DELETE = withAuth<Ctx>(
  async (_req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);

    const doc = await Case.findOneAndDelete({ _id: objectId, tenantId: session.tenantId });
    if (!doc) return jsonError("Caso não encontrado", 404);

    await audit(session, "case.delete", "Case", id, {
      code: doc.code,
      deceasedName: doc.deceased?.name,
      status: doc.status,
    });
    return NextResponse.json({ ok: true });
  },
  { roles: [] } // somente admin (withAuth libera admin sempre)
);
