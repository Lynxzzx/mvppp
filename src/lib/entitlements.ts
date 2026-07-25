import { NextResponse } from "next/server";
import { Tenant } from "@/models/Tenant";
import { Feature, FEATURE_LABEL, Plan, planAllows, PLAN_LABEL, minPlanFor } from "@/lib/plans";

/**
 * Plano efetivo do tenant: o plano contratado só vale enquanto
 * `planPaidUntil` estiver no futuro (Rede é ativado manualmente pelo
 * comercial e não expira). Fora disso, cai para o plano gratuito.
 */
export async function getEffectivePlan(tenantId: unknown): Promise<Plan> {
  const tenant = await Tenant.findById(tenantId)
    .select("subscriptionPlan planPaidUntil")
    .lean<{ subscriptionPlan?: Plan; planPaidUntil?: Date }>();
  if (!tenant) return "free";
  if (tenant.subscriptionPlan === "rede") return "rede";
  if (
    tenant.subscriptionPlan &&
    tenant.subscriptionPlan !== "free" &&
    tenant.planPaidUntil &&
    new Date(tenant.planPaidUntil) > new Date()
  ) {
    return tenant.subscriptionPlan;
  }
  return "free";
}

/**
 * Gate de API por módulo. Retorna uma resposta 402 se o plano do tenant
 * não libera o módulo; null se está liberado.
 */
export async function requireFeature(
  tenantId: unknown,
  feature: Feature
): Promise<NextResponse | null> {
  const plan = await getEffectivePlan(tenantId);
  if (planAllows(plan, feature)) return null;
  const needed = minPlanFor(feature);
  return NextResponse.json(
    {
      error: `O módulo "${FEATURE_LABEL[feature]}" está disponível a partir do plano ${PLAN_LABEL[needed]}. Acesse Assinatura para contratar.`,
      code: "upgrade_required",
      feature,
      requiredPlan: needed,
    },
    { status: 402 }
  );
}

/** Resposta 402 para limites do plano gratuito atingidos. */
export function freeLimitResponse(what: string, limit: number): NextResponse {
  return NextResponse.json(
    {
      error: `O plano gratuito permite até ${limit} ${what}. Contrate um plano em Assinatura para continuar.`,
      code: "upgrade_required",
    },
    { status: 402 }
  );
}
