import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Contract } from "@/models/Contract";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["ativo", "cancelado"]).optional(),
  planName: z.string().min(2).optional(),
  adjustmentRule: z.string().optional(),
  caseId: z.string().optional(), // vincular contrato a um caso (PRD 6.4)
});

/** GET /api/contracts/[id] */
export const GET = withAuth<Ctx>(async (_req, session, ctx) => {
  const { id } = await ctx.params;
  const contract = await Contract.findOne({
    _id: toObjectId(id),
    tenantId: session.tenantId,
  }).lean();
  if (!contract) return jsonError("Contrato não encontrado", 404);
  return NextResponse.json({ contract });
});

/** PATCH /api/contracts/[id] — alteração de contrato com auditoria (PRD §7). */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const data = await parseBody(req, updateSchema);

    const contract = await Contract.findOne({ _id: toObjectId(id), tenantId: session.tenantId });
    if (!contract) return jsonError("Contrato não encontrado", 404);

    const changes: Record<string, unknown> = {};
    if (data.status && data.status !== contract.status) {
      changes.status = { from: contract.status, to: data.status };
      contract.status = data.status;
    }
    if (data.planName && data.planName !== contract.planName) {
      changes.planName = { from: contract.planName, to: data.planName };
      contract.planName = data.planName;
    }
    if (data.adjustmentRule !== undefined && data.adjustmentRule !== contract.adjustmentRule) {
      changes.adjustmentRule = { from: contract.adjustmentRule, to: data.adjustmentRule };
      contract.adjustmentRule = data.adjustmentRule;
    }
    if (data.caseId) {
      const parentCase = await Case.findOne({
        _id: toObjectId(data.caseId),
        tenantId: session.tenantId,
      });
      if (!parentCase) return jsonError("Caso não encontrado", 404);
      changes.caseId = { to: parentCase.code };
      contract.caseId = parentCase._id;
      contract.caseCode = parentCase.code;
      parentCase.timeline.push({
        kind: "sistema",
        text: `Contrato ${contract.code} vinculado ao caso`,
        userId: session.userId,
        userName: session.name,
      });
      await parentCase.save();
    }

    if (Object.keys(changes).length > 0) {
      await contract.save();
      await audit(session, "contract.update", "Contract", id, {
        code: contract.code,
        changes,
      });
    }
    return NextResponse.json({ ok: true });
  },
  { roles: ["financeiro"], feature: "contratos" }
);
