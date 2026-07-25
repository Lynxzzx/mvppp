import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const noteSchema = z.object({
  text: z.string().min(1, "Escreva a interação").max(2000),
});

/** POST /api/cases/[id]/notes — registra interação no histórico (PRD 6.1). */
export const POST = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const { text } = await parseBody(req, noteSchema);

    const updated = await Case.findOneAndUpdate(
      { _id: objectId, tenantId: session.tenantId },
      {
        $push: {
          timeline: { kind: "nota", text, userId: session.userId, userName: session.name },
        },
      }
    );
    if (!updated) return jsonError("Caso não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente", "financeiro"] }
);
