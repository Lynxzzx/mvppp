import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError } from "@/lib/api";
import { createPixTransaction, misticPayConfigured } from "@/lib/misticpay";
import { PLAN_INFO } from "@/lib/plans";
import { PlanPayment } from "@/models/PlanPayment";

const checkoutSchema = z.object({
  plan: z.enum(["essencial", "profissional"]),
  payerDocument: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11 || v.length === 14, "Informe um CPF ou CNPJ válido"),
});

/**
 * POST /api/subscription/checkout — cria cobrança PIX na MisticPay para
 * assinatura do plano (somente admin). Retorna QR Code + copia-e-cola.
 */
export const POST = withAuth(
  async (req, session) => {
    if (!misticPayConfigured()) {
      return jsonError(
        "Pagamento indisponível: credenciais da MisticPay não configuradas no servidor",
        503
      );
    }
    const { plan, payerDocument } = await parseBody(req, checkoutSchema);
    const info = PLAN_INFO[plan];

    // Reaproveita cobrança pendente recente do mesmo plano (evita duplicar PIX)
    const existing = await PlanPayment.findOne({
      tenantId: session.tenantId,
      plan,
      status: "pendente",
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    }).select("+qrCodeBase64");
    if (existing?.qrCodeBase64) {
      return NextResponse.json({
        paymentId: existing._id.toString(),
        qrCodeBase64: existing.qrCodeBase64,
        copyPaste: existing.copyPaste,
        amountCents: existing.amountCents,
      });
    }

    const ourTransactionId = `veluxa-sub-${session.tenantId}-${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let pix;
    try {
      pix = await createPixTransaction({
        amount: info.priceCents / 100,
        payerName: session.name,
        payerDocument,
        transactionId: ourTransactionId,
        description: `Assinatura Veluxa — Plano ${info.label} (mensal)`,
        projectWebhook: `${baseUrl}/api/webhooks/misticpay`,
      });
    } catch (err) {
      console.error("[subscription/checkout]", err);
      return jsonError("Falha ao gerar cobrança PIX na MisticPay", 502);
    }

    const payment = await PlanPayment.create({
      tenantId: session.tenantId,
      plan,
      amountCents: info.priceCents,
      ourTransactionId,
      misticTransactionId: String(pix.transactionId),
      qrCodeBase64: pix.qrCodeBase64,
      copyPaste: pix.copyPaste,
      createdBy: session.name,
    });

    return NextResponse.json(
      {
        paymentId: payment._id.toString(),
        qrCodeBase64: pix.qrCodeBase64,
        copyPaste: pix.copyPaste,
        amountCents: info.priceCents,
      },
      { status: 201 }
    );
  },
  { roles: [] } // somente admin
);
