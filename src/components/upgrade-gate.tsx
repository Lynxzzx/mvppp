import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURE_LABEL, PLAN_INFO, minPlanFor, type Feature } from "@/lib/plans";
import { formatBRL } from "@/lib/format";

/** Tela exibida quando o plano atual não libera o módulo. */
export function UpgradeGate({ feature }: { feature: Feature }) {
  const plan = minPlanFor(feature);
  const info = PLAN_INFO[plan];

  return (
    <div className="animate-enter flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md border border-border bg-card p-8 text-center shadow-[0_1px_2px_rgba(12,10,9,0.03)]">
        <div className="mx-auto mb-5 flex size-11 items-center justify-center rounded-md bg-accent">
          <Lock className="size-5 text-gold" aria-hidden />
        </div>
        <h1 className="font-display text-2xl tracking-tight">{FEATURE_LABEL[feature]}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Este módulo está disponível a partir do plano{" "}
          <span className="text-foreground">{info.label}</span> (
          {formatBRL(info.priceCents)}/mês). Contrate em poucos minutos com
          pagamento via PIX.
        </p>
        <Button className="mt-7" nativeButton={false} render={<Link href="/assinatura" />}>
          Ver planos e assinar
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
