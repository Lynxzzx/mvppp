import { NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { Invoice } from "@/models/Invoice";
import { Tenant } from "@/models/Tenant";
import { buildRemessaCnab400 } from "@/lib/billing/cnab400";
import { audit } from "@/lib/audit";

/**
 * GET /api/invoices/remessa — gera arquivo CNAB 400 das cobranças pendentes
 * ainda não enviadas (ou todas pendentes se ?todas=1).
 */
export const GET = withAuth(async (req, session) => {
  const todas = new URL(req.url).searchParams.get("todas") === "1";

  const tenant = await Tenant.findById(session.tenantId).lean<{
    name: string;
    cnpj?: string;
    bankSettings?: {
      bankCode?: string;
      agency?: string;
      account?: string;
      wallet?: string;
      beneficiaryName?: string;
      beneficiaryDocument?: string;
      remessaSeq?: number;
    };
  }>();
  if (!tenant) return jsonError("Funerária não encontrada", 404);

  const bank = tenant.bankSettings ?? {};
  if (!bank.agency || !bank.account) {
    return jsonError(
      "Configure agência e conta em Faturamento → Dados bancários antes de gerar a remessa.",
      400
    );
  }

  const filter: Record<string, unknown> = {
    tenantId: session.tenantId,
    status: "pendente",
  };
  if (!todas) filter.remessaAt = { $exists: false };

  const invoices = await Invoice.find(filter)
    .sort({ dueDate: 1 })
    .limit(500)
    .lean<
      {
        _id: unknown;
        number: string;
        amountCents: number;
        dueDate: Date;
        payerName?: string;
        payerDocument?: string;
        nossoNumero?: string;
        description: string;
      }[]
    >();

  if (invoices.length === 0) {
    return jsonError(
      todas
        ? "Nenhuma cobrança pendente para remessa."
        : "Nenhuma cobrança pendente nova. Use ?todas=1 para reenviar todas as pendentes.",
      404
    );
  }

  const seqFile = bank.remessaSeq ?? 1;
  const content = buildRemessaCnab400(
    {
      bankCode: bank.bankCode || "237",
      agency: bank.agency,
      account: bank.account,
      wallet: bank.wallet || "09",
      beneficiaryName: bank.beneficiaryName || tenant.name,
      beneficiaryDocument: bank.beneficiaryDocument || tenant.cnpj || "",
    },
    invoices.map((inv) => ({
      nossoNumero: inv.nossoNumero || inv.number.replace(/\D/g, ""),
      amountCents: inv.amountCents,
      dueDate: new Date(inv.dueDate),
      payerName: inv.payerName || inv.description,
      payerDocument: inv.payerDocument,
      invoiceNumber: inv.number,
    })),
    seqFile
  );

  const ids = invoices.map((i) => i._id);
  await Invoice.updateMany(
    { _id: { $in: ids } },
    { $set: { remessaAt: new Date(), remessaFileSeq: seqFile } }
  );
  await Tenant.updateOne(
    { _id: session.tenantId },
    { $set: { "bankSettings.remessaSeq": seqFile + 1 } }
  );

  await audit(session, "billing.remessa", "Invoice", undefined, {
    count: invoices.length,
    seqFile,
  });

  const filename = `remessa-${seqFile.toString().padStart(7, "0")}.rem`;
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}, { roles: ["financeiro"], feature: "faturamento" });
