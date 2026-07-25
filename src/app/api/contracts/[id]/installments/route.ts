import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Contract } from "@/models/Contract";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  installmentId: z.string().min(1),
  status: z.enum(["pendente", "pago"]),
});

/**
 * PATCH /api/contracts/[id]/installments — marca parcela como paga/pendente
 * (PRD 6.4). Quando todas ficam pagas, o contrato vira "quitado".
 */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const { installmentId, status } = await parseBody(req, updateSchema);

    const contract = await Contract.findOne({ _id: toObjectId(id), tenantId: session.tenantId });
    if (!contract) return jsonError("Contrato não encontrado", 404);

    const installment = contract.installments.id(toObjectId(installmentId));
    if (!installment) return jsonError("Parcela não encontrada", 404);

    installment.status = status;
    installment.paidAt = status === "pago" ? new Date() : undefined;

    const allPaid = contract.installments.every(
      (i: { status: string }) => i.status === "pago"
    );
    if (allPaid && contract.status === "ativo") contract.status = "quitado";
    if (!allPaid && contract.status === "quitado") contract.status = "ativo";

    await contract.save();
    await audit(session, "contract.installment.update", "Contract", id, {
      code: contract.code,
      installmentNumber: installment.number,
      status,
    });

    return NextResponse.json({ ok: true, contractStatus: contract.status });
  },
  { roles: ["financeiro"], feature: "contratos" }
);
