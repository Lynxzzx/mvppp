import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/entitlements";
import { planAllows } from "@/lib/plans";
import { UpgradeGate } from "@/components/upgrade-gate";
import { PageHeader } from "@/components/page-header";
import { CollectorsClient } from "./collectors-client";

export const metadata = { title: "Cobradores" };

export default async function CobradoresPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "financeiro") {
    redirect("/dashboard");
  }

  const plan = await getEffectivePlan(session.tenantId);
  if (!planAllows(plan, "contratos")) return <UpgradeGate feature="contratos" />;

  return (
    <div className="animate-enter">
      <PageHeader
        title="Cobradores externos"
        description="Gere um link para o cobrador registrar pagamentos de parcelas em campo — no celular, sem instalar app."
      />
      <CollectorsClient canCreate={session.role === "admin"} />
    </div>
  );
}
