import Link from "next/link";
import { getSession } from "@/lib/auth";
import { WHATSAPP_SALES_URL } from "@/lib/plans";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Veluxa — ERP para funerárias",
  description:
    "Atendimento, agenda, estoque, contratos e faturamento em um único sistema. Feito para funerárias que cuidam de famílias.",
};

const MODULES = [
  {
    title: "Atendimento & casos",
    text: "Do primeiro contato ao encerramento, com checklist por tipo de serviço e documentos no mesmo lugar.",
  },
  {
    title: "Agenda de cerimônias",
    text: "Velórios, sepultamentos e cremações com bloqueio automático de sala e veículo.",
  },
  {
    title: "Estoque & fornecedores",
    text: "Urnas, flores e paramentação com alerta de mínimo e saídas vinculadas ao caso.",
  },
  {
    title: "Contratos & faturamento",
    text: "Planos pré-pagos, parcelas e cobranças geradas a partir do atendimento.",
  },
  {
    title: "Portal da família",
    text: "Link seguro, sem senha: a família acompanha etapas e documentos no celular.",
  },
  {
    title: "Relatórios",
    text: "Casos, receita e giro de estoque por período — visão clara para a gestão.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  const appHref = session ? "/dashboard" : "/registrar";

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(201,164,104,0.14),transparent_55%)]"
          aria-hidden
        />

        <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <BrandLogo forceTheme="dark" size={32} className="text-xl" />
          <nav
            className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
            aria-label="Navegação"
          >
            <a href="#modulos" className="transition-colors hover:text-foreground">
              Módulos
            </a>
            <a href="#portal" className="transition-colors hover:text-foreground">
              Portal
            </a>
            <a href="#planos" className="transition-colors hover:text-foreground">
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Button nativeButton={false} render={<Link href="/dashboard" />}>
                Acessar painel
              </Button>
            ) : (
              <>
                <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
                  Entrar
                </Button>
                <Button nativeButton={false} render={<Link href="/registrar" />}>
                  Criar conta
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="animate-enter flex items-center gap-4 md:gap-5">
            <BrandLogo variant="mark" forceTheme="dark" size={80} />
            <p className="font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-none tracking-wide text-foreground">
              Veluxa
            </p>
          </div>
          <h1 className="animate-enter mt-6 max-w-2xl font-display text-2xl font-medium leading-snug text-gold-bright md:text-3xl">
            A operação da funerária, organizada do atendimento ao encerramento.
          </h1>
          <p className="animate-enter mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Casos, agenda, estoque e cobrança em um único fluxo — sem planilhas
            paralelas e sem perder o cuidado com a família.
          </p>
          <div className="animate-enter mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href={appHref} />}>
              Começar gratuitamente
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href="#planos" />}
            >
              Ver planos
            </Button>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_1.5fr] md:gap-16">
          <h2 className="font-display text-2xl text-foreground md:text-3xl">
            O que costuma travar o dia a dia
          </h2>
          <ul className="space-y-8">
            {[
              {
                title: "Informação espalhada",
                text: "O mesmo caso vive em planilha, papel e conversas. Ninguém tem o histórico completo na hora da decisão.",
              },
              {
                title: "Agenda sem trava",
                text: "Sala ou veículo marcado duas vezes — o conflito aparece quando a família já está a caminho.",
              },
              {
                title: "Família sem resposta",
                text: "Cada etapa vira ligação. A equipe se sobrecarrega; quem está em luto fica no escuro.",
              },
            ].map((item) => (
              <li key={item.title} className="border-t border-border pt-5">
                <h3 className="font-display text-lg text-gold-bright">{item.title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="scroll-mt-16">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl">Tudo o que a operação precisa</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Módulos integrados para o ritmo real da funerária — do balcão ao
            financeiro.
          </p>
          <ol className="mt-12 divide-y divide-border border-y border-border">
            {MODULES.map((m, i) => (
              <li
                key={m.title}
                className="grid gap-2 py-6 md:grid-cols-[3.5rem_14rem_1fr] md:items-baseline md:gap-8"
              >
                <span className="font-mono text-xs text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg">{m.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Portal */}
      <section id="portal" className="scroll-mt-16 border-y border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">
              A família acompanha tudo{" "}
              <em className="text-gold-bright">sem precisar ligar.</em>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Um link único e seguro, sem senha e sem aplicativo, mostra a etapa
              atual, a próxima cerimônia e os documentos liberados pela
              funerária. Expira após o encerramento.
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-6">
            <div className="flex items-center gap-2">
              <BrandLogo variant="mark" forceTheme="dark" size={20} />
              <span className="font-display text-sm">Acompanhamento</span>
            </div>
            <ol className="mt-5 space-y-3 text-sm">
              {[
                ["Atendimento recebido", true],
                ["Em andamento", true],
                ["Concluído", false],
              ].map(([label, done], idx) => (
                <li key={String(label)} className="flex items-center gap-3">
                  <span
                    className={
                      done
                        ? "flex size-6 items-center justify-center rounded-full border border-sage bg-sage/20 text-xs text-sage"
                        : "flex size-6 items-center justify-center rounded-full border text-xs text-muted-foreground"
                    }
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <span className={done ? "" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              veluxa.app/portal/…
            </p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="scroll-mt-16">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl">Planos para cada fase</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Comece no gratuito. Escalone quando a operação pedir.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <PlanCard
              name="Essencial"
              audience="Unidade única, equipe enxuta"
              price="R$ 297"
              period="/mês"
              features={[
                "Atendimento & casos",
                "Agenda de cerimônias",
                "Estoque básico",
                "Portal da família",
                "Até 2 usuários",
              ]}
              href="/registrar"
              cta="Começar"
            />
            <PlanCard
              name="Profissional"
              audience="Contratos e faturamento recorrente"
              price="R$ 697"
              period="/mês"
              features={[
                "Tudo do Essencial",
                "Contratos & planos pré-pagos",
                "Faturamento",
                "Relatórios",
                "Até 10 usuários",
              ]}
              href="/registrar"
              cta="Começar"
              highlighted
            />
            <PlanCard
              name="Rede"
              audience="Múltiplas unidades"
              price="Sob consulta"
              features={[
                "Tudo do Profissional",
                "Gestão multiunidade",
                "Relatórios consolidados",
                "Usuários ilimitados",
              ]}
              href={WHATSAPP_SALES_URL}
              cta="Falar no WhatsApp"
              external
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <BrandLogo variant="wordmark" forceTheme="dark" size={48} />
            <h2 className="mt-4 max-w-xl font-display text-2xl md:text-3xl">
              Organização por dentro,{" "}
              <em className="text-gold-bright">acolhimento por fora.</em>
            </h2>
          </div>
          <Button size="lg" nativeButton={false} render={<Link href={appHref} />}>
            Criar conta da funerária
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
        <BrandLogo forceTheme="dark" size={22} className="text-sm" />
        <p>© {new Date().getFullYear()} Veluxa · ERP para funerárias</p>
      </footer>
    </div>
  );
}

function PlanCard({
  name,
  audience,
  price,
  period,
  features,
  href,
  cta,
  highlighted,
  external,
}: {
  name: string;
  audience: string;
  price: string;
  period?: string;
  features: string[];
  href: string;
  cta: string;
  highlighted?: boolean;
  external?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "flex flex-col rounded-lg border border-gold/40 bg-card p-6"
          : "flex flex-col rounded-lg border border-border bg-card p-6"
      }
    >
      <h3 className="font-display text-xl">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{audience}</p>
      <p className="mt-4">
        <span
          className={
            price.startsWith("R$") ? "font-mono text-2xl" : "font-display text-2xl"
          }
        >
          {price}
        </span>
        {period && <span className="text-sm text-muted-foreground">{period}</span>}
      </p>
      <ul className="mt-5 mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-sage" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className="w-full"
        variant={highlighted ? "default" : "outline"}
        nativeButton={false}
        render={
          external ? (
            <a href={href} target="_blank" rel="noopener noreferrer" />
          ) : (
            <Link href={href} />
          )
        }
      >
        {cta}
      </Button>
    </div>
  );
}
