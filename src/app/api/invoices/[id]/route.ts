import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Invoice } from "@/models/Invoice";
import { Contract } from "@/models/Contract";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["paga", "pendente", "cancelada"]),
});

/**
 * PATCH /api/invoices/[id] — baixa manual (ou estorno/cancelamento).
 * Se a cobrança vier de parcela de contrato, a parcela é sincronizada
 * (conciliação simples — PRD 6.5).
 */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const { status } = await parseBody(req, updateSchema);

    const invoice = await Invoice.findOne({ _id: toObjectId(id), tenantId: session.tenantId });
    if (!invoice) return jsonError("Cobrança não encontrada", 404);

    invoice.status = status;
    invoice.paidAt = status === "paga" ? new Date() : undefined;
    await invoice.save();

    // Sincroniza parcela do contrato de origem
    if (invoice.contractId && invoice.installmentNumber) {
      const contract = await Contract.findOne({
        _id: invoice.contractId,
        tenantId: session.tenantId,
      });
      if (contract) {
        const installment = contract.installments.find(
          (i: { number: number }) => i.number === invoice.installmentNumber
        );
        if (installment && status !== "cancelada") {
          installment.status = status === "paga" ? "pago" : "pendente";
          installment.paidAt = status === "paga" ? new Date() : undefined;
          const allPaid = contract.installments.every(
            (i: { status: string }) => i.status === "pago"
          );
          contract.status = allPaid ? "quitado" : contract.status === "quitado" ? "ativo" : contract.status;
          await contract.save();
        }
      }
    }

    return NextResponse.json({ ok: true });
  },
  { roles: ["financeiro"], feature: "faturamento" }
);
