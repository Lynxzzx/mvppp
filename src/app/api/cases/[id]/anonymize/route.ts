import { NextResponse } from "next/server";
import { withAuth, jsonError, toObjectId } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/cases/[id]/anonymize — anonimização LGPD (somente admin).
 * Substitui dados pessoais de família/falecido e remove documentos.
 */
export const POST = withAuth<Ctx>(
  async (_req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);

    const doc = await Case.findOne({ _id: objectId, tenantId: session.tenantId });
    if (!doc) return jsonError("Caso não encontrado", 404);
    if (doc.status !== "encerrado") {
      return jsonError("Apenas casos encerrados podem ser anonimizados", 409);
    }

    doc.family = { name: "[anonimizado]" };
    doc.deceased = { name: "[anonimizado]" };
    doc.documents = [];
    doc.timeline.push({
      kind: "sistema",
      text: "Dados pessoais anonimizados (LGPD)",
      userId: session.userId,
      userName: session.name,
    });
    doc.anonymizedAt = new Date();
    await doc.save();

    await audit(session, "case.anonymize", "Case", id, { code: doc.code });
    return NextResponse.json({ ok: true });
  },
  { roles: [] } // somente admin
);
