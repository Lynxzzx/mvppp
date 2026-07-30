import { Invoice } from "@/models/Invoice";
import { Contract } from "@/models/Contract";
import type mongoose from "mongoose";

/** Baixa cobrança e sincroniza parcela de contrato (usada por remessa e cobrador). */
export async function markInvoicePaid(opts: {
  invoiceId: mongoose.Types.ObjectId | string;
  tenantId: string;
  paidAt?: Date;
  source?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const invoice = await Invoice.findOne({
    _id: opts.invoiceId,
    tenantId: opts.tenantId,
  });
  if (!invoice) return { ok: false, error: "Cobrança não encontrada" };
  if (invoice.status === "cancelada") return { ok: false, error: "Cobrança cancelada" };

  const paidAt = opts.paidAt ?? new Date();
  if (invoice.status !== "paga") {
    invoice.status = "paga";
    invoice.paidAt = paidAt;
    if (opts.source) invoice.gateway = opts.source;
    await invoice.save();
  }

  if (invoice.contractId && invoice.installmentNumber) {
    const contract = await Contract.findOne({
      _id: invoice.contractId,
      tenantId: opts.tenantId,
    });
    if (contract) {
      const installment = contract.installments.find(
        (i: { number: number }) => i.number === invoice.installmentNumber
      );
      if (installment) {
        installment.status = "pago";
        installment.paidAt = paidAt;
        const allPaid = contract.installments.every(
          (i: { status: string }) => i.status === "pago"
        );
        if (allPaid) contract.status = "quitado";
        await contract.save();
      }
    }
  }

  return { ok: true };
}

/** Baixa parcela de contrato sem invoice (pagamento em campo pelo cobrador). */
export async function markInstallmentPaid(opts: {
  contractId: mongoose.Types.ObjectId | string;
  installmentNumber: number;
  tenantId: string;
  paidAt?: Date;
}): Promise<{ ok: true; invoiceId?: string } | { ok: false; error: string }> {
  const contract = await Contract.findOne({
    _id: opts.contractId,
    tenantId: opts.tenantId,
  });
  if (!contract) return { ok: false, error: "Contrato não encontrado" };

  const installment = contract.installments.find(
    (i: { number: number }) => i.number === opts.installmentNumber
  );
  if (!installment) return { ok: false, error: "Parcela não encontrada" };
  if (installment.status === "pago") return { ok: false, error: "Parcela já paga" };

  const paidAt = opts.paidAt ?? new Date();
  installment.status = "pago";
  installment.paidAt = paidAt;

  const allPaid = contract.installments.every(
    (i: { status: string }) => i.status === "pago"
  );
  if (allPaid) contract.status = "quitado";
  await contract.save();

  // Marca invoice pendente vinculada, se houver
  const invoice = await Invoice.findOne({
    tenantId: opts.tenantId,
    contractId: contract._id,
    installmentNumber: opts.installmentNumber,
    status: "pendente",
  });
  if (invoice) {
    invoice.status = "paga";
    invoice.paidAt = paidAt;
    invoice.gateway = "cobrador";
    await invoice.save();
    return { ok: true, invoiceId: invoice._id.toString() };
  }

  return { ok: true };
}
