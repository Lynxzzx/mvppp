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
    <div className="min-h-dvh bg-background text-foreground">
      {/* Hero — full-bleed stone plane */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#f5f0e6_0%,#fafaf9_42%,#fafaf9_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <BrandLogo forceTheme="light" size={30} className="text-xl" />
          <nav
            className="hidden items-center gap-7 text-[13.5px] text-muted-foreground md:flex"
            aria-label="Navegação"
          >
            <a href="#modulos" className="transition-colors duration-200 hover:text-foreground">
              Módulos
            </a>
            <a href="#portal" className="transition-colors duration-200 hover:text-foreground">
              Portal
            </a>
            <a href="#planos" className="transition-colors duration-200 hover:text-foreground">
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

        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="animate-enter flex items-center gap-4 md:gap-5">
            <BrandLogo variant="mark" forceTheme="light" size={72} />
            <p className="font-display text-[clamp(2.75rem,9vw,5.25rem)] leading-none tracking-wide text-foreground">
              Veluxa
            </p>
          </div>
          <h1 className="animate-enter mt-7 max-w-2xl font-display text-[1.65rem] font-medium leading-snug tracking-tight text-foreground md:text-[2rem]">
            A operação da funerária, organizada do atendimento ao encerramento.
          </h1>
          <p className="animate-enter mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Casos, agenda, estoque e cobrança em um único fluxo — sem planilhas
            paralelas e sem perder o cuidado com a família.
          </p>
          <div className="animate-enter mt-9 flex flex-wrap items-center gap-3">
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
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-20">
          <h2 className="font-display text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">
            O que costuma travar o dia a dia
          </h2>
          <ul className="space-y-0">
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
              <li key={item.title} className="border-t border-border py-6 first:border-t-0 first:pt-0">
                <h3 className="font-display text-lg text-gold-bright">{item.title}</h3>
                <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="scroll-mt-16 border-b border-border bg-[#f5f5f4]/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-display text-[1.75rem] tracking-tight md:text-[2rem]">
            Tudo o que a operação precisa
          </h2>
          <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">
            Módulos integrados para o ritmo real da funerária — do balcão ao
            financeiro.
          </p>
          <ol className="mt-14 divide-y divide-border border-y border-border">
            {MODULES.map((m, i) => (
              <li
                key={m.title}
                className="grid gap-2 py-7 md:grid-cols-[3rem_13rem_1fr] md:items-baseline md:gap-10"
              >
                <span className="font-mono text-[11px] tracking-wider text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg">{m.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Portal */}
      <section id="portal" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">
              A família acompanha tudo{" "}
              <em className="not-italic text-gold-bright">sem precisar ligar.</em>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Um link único e seguro, sem senha e sem aplicativo, mostra a etapa
              atual, a próxima cerimônia e os documentos liberados pela
              funerária. Expira após o encerramento.
            </p>
          </div>
          <div className="border border-border bg-card p-7 shadow-[0_1px_2px_rgba(12,10,9,0.04)]">
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="mark" forceTheme="light" size={22} />
              <span className="font-display text-[15px]">Acompanhamento</span>
            </div>
            <ol className="mt-6 space-y-3.5 text-[15px]">
              {[
                ["Atendimento recebido", true],
                ["Em andamento", true],
                ["Concluído", false],
              ].map(([label, done], idx) => (
                <li key={String(label)} className="flex items-center gap-3">
                  <span
                    className={
                      done
                        ? "flex size-7 items-center justify-center rounded-full border border-sage/40 bg-sage/10 text-xs font-medium text-sage"
                        : "flex size-7 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                    }
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 border border-border bg-muted/60 px-3 py-2.5 font-mono text-xs text-muted-foreground">
              veluxa.app/portal/…
            </p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-display text-[1.75rem] tracking-tight md:text-[2rem]">
            Planos para cada fase
          </h2>
          <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">
            Comece no gratuito. Escalone quando a operação pedir.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
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
      <section className="bg-[#1c1917] text-[#fafaf9]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <BrandLogo variant="wordmark" forceTheme="dark" size={44} />
            <h2 className="mt-5 max-w-xl font-display text-[1.65rem] leading-snug tracking-tight md:text-[1.85rem]">
              Organização por dentro,{" "}
              <em className="text-[#e7c27a] not-italic">acolhimento por fora.</em>
            </h2>
          </div>
          <Button
            size="lg"
            className="bg-[#e7c27a] text-[#0c0a09] hover:bg-[#f0d9a0]"
            nativeButton={false}
            render={<Link href={appHref} />}
          >
            Criar conta da funerária
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
        <BrandLogo forceTheme="light" size={22} className="text-sm" />
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
          ? "flex flex-col bg-[#f5f0e6] p-7"
          : "flex flex-col bg-card p-7"
      }
    >
      <h3 className="font-display text-xl tracking-tight">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{audience}</p>
      <p className="mt-5">
        <span
          className={
            price.startsWith("R$")
              ? "font-mono text-[1.65rem] tracking-tight"
              : "font-display text-[1.65rem]"
          }
        >
          {price}
        </span>
        {period && <span className="ml-1 text-sm text-muted-foreground">{period}</span>}
      </p>
      <ul className="mt-6 mb-8 flex-1 space-y-2.5 text-sm text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-gold" aria-hidden />
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
