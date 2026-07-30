import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Invoice } from "@/models/Invoice";
import { Contract } from "@/models/Contract";
import { markInvoicePaid } from "@/lib/billing/invoice-pay";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["paga", "pendente", "cancelada"]),
});

/**
 * PATCH /api/invoices/[id] — baixa manual (ou estorno/cancelamento).
 * Parcela de contrato sincronizada (PRD 6.5).
 */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const { status } = await parseBody(req, updateSchema);
    const oid = toObjectId(id);
    if (!oid) return jsonError("Cobrança inválida", 400);

    if (status === "paga") {
      const result = await markInvoicePaid({
        invoiceId: oid,
        tenantId: session.tenantId,
        source: "manual",
      });
      if (!result.ok) return jsonError(result.error, 404);
      return NextResponse.json({ ok: true });
    }

    const invoice = await Invoice.findOne({ _id: oid, tenantId: session.tenantId });
    if (!invoice) return jsonError("Cobrança não encontrada", 404);

    invoice.status = status;
    invoice.paidAt = undefined;
    await invoice.save();

    if (invoice.contractId && invoice.installmentNumber && status === "pendente") {
      const contract = await Contract.findOne({
        _id: invoice.contractId,
        tenantId: session.tenantId,
      });
      if (contract) {
        const installment = contract.installments.find(
          (i: { number: number }) => i.number === invoice.installmentNumber
        );
        if (installment) {
          installment.status = "pendente";
          installment.paidAt = undefined;
          if (contract.status === "quitado") contract.status = "ativo";
          await contract.save();
        }
      }
    }

    return NextResponse.json({ ok: true });
  },
  { roles: ["financeiro"], feature: "faturamento" }
);
