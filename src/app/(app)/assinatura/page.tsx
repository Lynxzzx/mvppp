import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Tenant } from "@/models/Tenant";
import { PlanPayment } from "@/models/PlanPayment";
import { PLAN_INFO } from "@/lib/plans";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SubscribeButton, WhatsAppButton } from "./subscribe-widgets";

export const metadata = { title: "Assinatura" };
export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = {
  essencial: "Essencial",
  profissional: "Profissional",
  rede: "Rede",
};

export default async function AssinaturaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  await dbConnect();
  const [tenant, payments] = await Promise.all([
    Tenant.findById(session.tenantId).lean<{
      name: string;
      subscriptionPlan: string;
      planPaidUntil?: Date;
    }>(),
    PlanPayment.find({ tenantId: session.tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<{ _id: unknown; plan: string; amountCents: number; status: string; createdAt: Date; paidAt?: Date }[]>(),
  ]);

  const currentPlan = tenant?.subscriptionPlan ?? "essencial";
  const paidUntil = tenant?.planPaidUntil;
  const active = paidUntil && new Date(paidUntil) > new Date();

  return (
    <div className="animate-enter">
      <PageHeader
        title="Assinatura"
        description={`Plano atual: ${PLAN_LABEL[currentPlan]}${
          active ? ` · pago até ${formatDate(paidUntil)}` : " · sem pagamento ativo"
        }`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Essencial */}
        <Card className={cn(currentPlan === "essencial" && active && "border-sage/50")}>
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium">Essencial</CardTitle>
            <p className="text-sm text-muted-foreground">Unidade única, equipe enxuta</p>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <p className="font-mono text-2xl">
              {formatBRL(PLAN_INFO.essencial.priceCents)}
              <span className="text-sm text-muted-foreground">/mês</span>
            </p>
            <ul className="flex-1 space-y-2 text-sm">
              {PLAN_INFO.essencial.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            {currentPlan === "essencial" && active ? (
              <p className="rounded-md border border-sage/40 bg-sage/15 px-3 py-2 text-center text-sm text-sage">
                Plano atual
              </p>
            ) : (
              <SubscribeButton plan="essencial" planLabel="Essencial" />
            )}
          </CardContent>
        </Card>

        {/* Profissional */}
        <Card
          className={cn(
            "border-gold/50",
            currentPlan === "profissional" && active && "border-sage/50"
          )}
        >
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium">
              Profissional{" "}
              <span className="ml-1 rounded-md bg-accent px-2 py-0.5 text-xs font-normal text-gold">
                Mais escolhido
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Contratos e faturamento recorrente</p>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <p className="font-mono text-2xl">
              {formatBRL(PLAN_INFO.profissional.priceCents)}
              <span className="text-sm text-muted-foreground">/mês</span>
            </p>
            <ul className="flex-1 space-y-2 text-sm">
              {PLAN_INFO.profissional.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            {currentPlan === "profissional" && active ? (
              <p className="rounded-md border border-sage/40 bg-sage/15 px-3 py-2 text-center text-sm text-sage">
                Plano atual
              </p>
            ) : (
              <SubscribeButton plan="profissional" planLabel="Profissional" />
            )}
          </CardContent>
        </Card>

        {/* Rede */}
        <Card className={cn(currentPlan === "rede" && "border-sage/50")}>
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium">Rede</CardTitle>
            <p className="text-sm text-muted-foreground">Múltiplas unidades</p>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <p className="font-display text-2xl">Sob consulta</p>
            <ul className="flex-1 space-y-2 text-sm">
              {["Tudo do Profissional", "Gestão multiunidade", "Relatórios consolidados", "Usuários ilimitados"].map(
                (f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden /> {f}
                  </li>
                )
              )}
            </ul>
            <WhatsAppButton />
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Histórico de pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {payments.map((p) => (
                <li
                  key={String(p._id)}
                  className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{PLAN_LABEL[p.plan]}</span>
                  <span className="font-mono text-xs">{formatBRL(p.amountCents)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(p.paidAt ?? p.createdAt)}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge
                      status={p.status === "completo" ? "pago" : p.status === "falha" ? "cancelada" : "pendente"}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
