import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { checkTransaction } from "@/lib/misticpay";
import { completePlanPayment } from "@/lib/subscription";
import { PlanPayment } from "@/models/PlanPayment";

const statusSchema = z.object({ paymentId: z.string().min(1) });

/**
 * POST /api/subscription/status — verifica na MisticPay se o PIX foi pago
 * ("já paguei"). Se COMPLETO, ativa o plano imediatamente.
 */
export const POST = withAuth(
  async (req, session) => {
    const { paymentId } = await parseBody(req, statusSchema);
    const id = toObjectId(paymentId);
    if (!id) return jsonError("Pagamento não encontrado", 404);
    const payment = await PlanPayment.findOne({ _id: id, tenantId: session.tenantId });
    if (!payment) return jsonError("Pagamento não encontrado", 404);

    if (payment.status === "completo") {
      return NextResponse.json({ status: "completo" });
    }

    let state;
    try {
      state = await checkTransaction(payment.misticTransactionId);
    } catch (err) {
      console.error("[subscription/status]", err);
      return jsonError("Falha ao consultar a MisticPay", 502);
    }

    if (state === "COMPLETO") {
      await completePlanPayment(payment._id);
      return NextResponse.json({ status: "completo" });
    }
    if (state === "FALHA" || state === "CANCELADO") {
      payment.status = "falha";
      await payment.save();
      return NextResponse.json({ status: "falha" });
    }
    return NextResponse.json({ status: "pendente" });
  },
  { roles: [] } // somente admin
);
