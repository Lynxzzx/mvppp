import { Tenant } from "@/models/Tenant";
import { PlanPayment } from "@/models/PlanPayment";
import { AuditLog } from "@/models/AuditLog";

/**
 * Marca um pagamento de plano como completo e ativa o plano no tenant
 * por 30 dias. Idempotente: pagamentos já completos são ignorados.
 */
export async function completePlanPayment(paymentId: unknown): Promise<boolean> {
  const payment = await PlanPayment.findOne({ _id: paymentId, status: "pendente" });
  if (!payment) return false;

  payment.status = "completo";
  payment.paidAt = new Date();
  await payment.save();

  await Tenant.findByIdAndUpdate(payment.tenantId, {
    $set: {
      subscriptionPlan: payment.plan,
      planPaidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await AuditLog.create({
    tenantId: payment.tenantId,
    userId: payment.tenantId, // ação de sistema (webhook/verificação)
    userName: "sistema (MisticPay)",
    action: "subscription.activate",
    entity: "Tenant",
    entityId: payment.tenantId,
    meta: { plan: payment.plan, amountCents: payment.amountCents },
  });

  return true;
}
