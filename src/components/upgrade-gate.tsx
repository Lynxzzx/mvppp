import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURE_LABEL, PLAN_INFO, minPlanFor, type Feature } from "@/lib/plans";
import { formatBRL } from "@/lib/format";

/** Tela exibida quando o plano atual não libera o módulo. */
export function UpgradeGate({ feature }: { feature: Feature }) {
  const plan = minPlanFor(feature);
  const info = PLAN_INFO[plan];

  return (
    <div className="animate-enter flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md rounded-lg border border-gold/30 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gold/15">
          <Lock className="size-5 text-gold" aria-hidden />
        </div>
        <h1 className="font-display text-2xl">{FEATURE_LABEL[feature]}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este módulo está disponível a partir do plano{" "}
          <span className="text-foreground">{info.label}</span> (
          {formatBRL(info.priceCents)}/mês). Contrate em poucos minutos com
          pagamento via PIX.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/assinatura" />}>
          <Sparkles data-icon="inline-start" /> Ver planos e assinar
        </Button>
      </div>
    </div>
  );
}
