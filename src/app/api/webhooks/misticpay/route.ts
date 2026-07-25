import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { checkTransaction } from "@/lib/misticpay";
import { completePlanPayment } from "@/lib/subscription";
import { PlanPayment } from "@/models/PlanPayment";

/**
 * POST /api/webhooks/misticpay — notificação de mudança de status.
 * A MisticPay não assina o payload, então NUNCA confiamos no corpo:
 * sempre reconsultamos o status real via /transactions/check antes de ativar.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const transactionId = body?.transactionId;
    if (!transactionId) return NextResponse.json({ ok: true });

    await dbConnect();
    const payment = await PlanPayment.findOne({
      misticTransactionId: String(transactionId),
      status: "pendente",
    });
    if (!payment) return NextResponse.json({ ok: true });

    const state = await checkTransaction(payment.misticTransactionId);
    if (state === "COMPLETO") {
      await completePlanPayment(payment._id);
    } else if (state === "FALHA" || state === "CANCELADO") {
      payment.status = "falha";
      await payment.save();
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/misticpay]", err);
    // 200 para evitar redelivery em loop; o botão "já paguei" cobre o fallback
    return NextResponse.json({ ok: true });
  }
}
