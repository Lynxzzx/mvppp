import { NextRequest, NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { Invoice } from "@/models/Invoice";
import { parseRetornoCnab400 } from "@/lib/billing/cnab400";
import { markInvoicePaid } from "@/lib/billing/invoice-pay";
import { audit } from "@/lib/audit";

/**
 * POST /api/invoices/retorno — upload do arquivo retorno CNAB; baixa automática.
 * Body: multipart file OU JSON { content: string }
 */
export const POST = withAuth(async (req: NextRequest, session) => {
  let content = "";
  const ctype = req.headers.get("content-type") || "";

  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Envie o arquivo de retorno", 400);
    content = await file.text();
  } else {
    const body = (await req.json().catch(() => null)) as { content?: string } | null;
    content = body?.content ?? "";
  }

  if (!content.trim()) return jsonError("Arquivo de retorno vazio", 400);

  const payments = parseRetornoCnab400(content);
  if (payments.length === 0) {
    return jsonError(
      "Nenhum pagamento reconhecido no arquivo. Verifique se é um retorno CNAB 400.",
      400
    );
  }

  let matched = 0;
  let alreadyPaid = 0;
  let unmatched = 0;
  const details: { nossoNumero: string; status: string; invoice?: string }[] = [];

  for (const p of payments) {
    const invoice = await Invoice.findOne({
      tenantId: session.tenantId,
      $or: [
        { nossoNumero: p.nossoNumero },
        { nossoNumero: p.nossoNumero.padStart(11, "0") },
        { number: new RegExp(`${p.nossoNumero}$`) },
      ],
    }).lean<{ _id: unknown; status: string; number: string; amountCents: number }>();

    if (!invoice) {
      unmatched++;
      details.push({ nossoNumero: p.nossoNumero, status: "nao_encontrada" });
      continue;
    }

    // Tolerância de 1 real na conciliação de valor
    if (Math.abs(invoice.amountCents - p.amountCents) > 100) {
      unmatched++;
      details.push({
        nossoNumero: p.nossoNumero,
        status: "valor_divergente",
        invoice: invoice.number,
      });
      continue;
    }

    if (invoice.status === "paga") {
      alreadyPaid++;
      details.push({
        nossoNumero: p.nossoNumero,
        status: "ja_paga",
        invoice: invoice.number,
      });
      continue;
    }

    const result = await markInvoicePaid({
      invoiceId: String(invoice._id),
      tenantId: session.tenantId,
      paidAt: p.paidAt,
      source: "cnab-retorno",
    });

    if (result.ok) {
      matched++;
      details.push({
        nossoNumero: p.nossoNumero,
        status: "baixada",
        invoice: invoice.number,
      });
    } else {
      unmatched++;
      details.push({
        nossoNumero: p.nossoNumero,
        status: result.error,
        invoice: invoice.number,
      });
    }
  }

  await audit(session, "billing.retorno", "Invoice", undefined, {
    matched,
    alreadyPaid,
    unmatched,
    total: payments.length,
  });

  return NextResponse.json({
    ok: true,
    paymentsFound: payments.length,
    matched,
    alreadyPaid,
    unmatched,
    details,
  });
}, { roles: ["financeiro"], feature: "faturamento" });
