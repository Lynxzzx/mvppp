import Link from "next/link";
import { getSession } from "@/lib/auth";
import { WHATSAPP_SALES_URL } from "@/lib/plans";
import { BrandLogo } from "@/components/brand-logo";
import { FlameMark, type FlameVariant } from "@/components/landing/flame-mark";
import { HeroCasePanel } from "@/components/landing/hero-case-panel";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { SiteFooter } from "@/components/landing/site-footer";
import { WhatsappFloat } from "@/components/landing/whatsapp-float";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "Preciso migrar tudo de uma vez?",
    answer:
      "Não. Você pode começar pelo essencial e importar planilhas quando quiser, com mapeamento guiado. Muitos clientes operam em paralelo por alguns dias e só depois desligam o processo antigo.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. Cada funerária fica isolada (multi-tenant), o acesso é autenticado e o tráfego usa HTTPS. Tratamos dados conforme a LGPD — veja a Política de Privacidade. Não vendemos sua base.",
  },
  {
    question: "E se eu não gostar depois de começar?",
    answer:
      "Há plano gratuito para experimentar sem cartão. Nos planos pagos, você pode encerrar quando quiser pelas regras do período contratado — sem fidelidade longa escondida na letra miúda.",
  },
  {
    question: "A família precisa baixar um aplicativo?",
    answer:
      "Não. O portal da família abre por link no navegador do celular — sem instalação e sem criar senha. Ideal para quem está em luto e não quer mais um app.",
  },
  {
    question: "Quanto tempo leva para implantar?",
    answer:
      "Minutos para criar a conta e começar a registrar casos. A importação da planilha antiga costuma ser o passo mais longo — e ainda assim é guiada, não um projeto de meses.",
  },
  {
    question: "A IA inventa informações sobre a funerária?",
    answer:
      "No chat público, a IA só responde com o que você cadastrou (FAQ, preços, políticas, documentos). Se não souber, ela admite e manda para o WhatsApp. Saídas internas (necrológio) devem ser revisadas pela equipe.",
  },
];

export const metadata = {
  title: "Veluxa — ERP para funerárias",
  description:
    "Atendimento, agenda, estoque, contratos e faturamento em um único sistema. Feito para funerárias que cuidam de famílias.",
};

const MODULES: {
  code: string;
  title: string;
  text: string;
  flame: FlameVariant;
  mock: string;
}[] = [
  {
    code: "MOD.CASOS",
    title: "Atendimento & casos",
    text: "Do primeiro contato ao encerramento, com checklist por tipo de serviço e documentos no mesmo lugar.",
    flame: "cases",
    mock: "CAS-1042 · checklist 6/8",
  },
  {
    code: "MOD.AGENDA",
    title: "Agenda de cerimônias",
    text: "Velórios, sepultamentos e cremações com bloqueio automático de sala e veículo.",
    flame: "agenda",
    mock: "Sala A · 14:00 · bloqueada",
  },
  {
    code: "MOD.ESTOQUE",
    title: "Estoque & fornecedores",
    text: "Urnas, flores e paramentação com alerta de mínimo e saídas vinculadas ao caso.",
    flame: "stock",
    mock: "Urna urna-02 · mín. 3",
  },
  {
    code: "MOD.CONTRATOS",
    title: "Contratos & faturamento",
    text: "Planos pré-pagos, parcelas e cobranças geradas a partir do atendimento.",
    flame: "contracts",
    mock: "CTR-088 · 3/12 quitadas",
  },
  {
    code: "MOD.PORTAL",
    title: "Portal da família",
    text: "Link seguro no navegador — sem app para baixar, sem senha. A família acompanha etapas e documentos no celular.",
    flame: "portal",
    mock: "veluxa.app/portal/…",
  },
  {
    code: "MOD.IA",
    title: "Importação e IA",
    text: "Suba a planilha antiga com mapeamento guiado. Use IA sobre o caso real (necrológio e resumo) — configurável pelo administrador.",
    flame: "ai",
    mock: "necrológio · rascunho ok",
  },
];

/** Paleta da landing (independente do tema do app). */
const L = {
  ink: "#0c0a09",
  inkElevated: "#141210",
  inkSoft: "#1c1917",
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  gold: "#e7c27a",
  goldDeep: "#c4a574",
} as const;

export default async function LandingPage() {
  const session = await getSession();
  const appHref = session ? "/dashboard" : "/registrar";

  return (
    <div
      className="relative min-h-dvh text-[15px] antialiased"
      style={{ background: L.ink, color: L.cream }}
    >
      {/* Grão global — tira o “chapado” sem competir com o conteúdo */}
      <div
        className="landing-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
        aria-hidden
      />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative z-[2] min-h-[100dvh] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(70% 55% at 70% 35%, rgba(231,194,122,0.11) 0%, transparent 55%),
              linear-gradient(180deg, ${L.inkSoft} 0%, ${L.ink} 42%, ${L.ink} 100%)
            `,
          }}
          aria-hidden
        />

        <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:h-20">
          <BrandLogo forceTheme="dark" size={28} className="text-lg text-[#fafaf9]" />
          <nav
            className="hidden items-center gap-8 text-[13px] md:flex"
            style={{ color: L.mute }}
            aria-label="Navegação"
          >
            {[
              ["#modulos", "Módulos"],
              ["#portal", "Portal"],
              ["#planos", "Planos"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="transition-colors duration-200 hover:text-[#fafaf9]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <LandingBtn href="/dashboard">Acessar painel</LandingBtn>
            ) : (
              <>
                <LandingBtn href="/login" variant="ghost">
                  Entrar
                </LandingBtn>
                <LandingBtn href="/registrar">Criar conta</LandingBtn>
              </>
            )}
          </div>
        </header>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-20 pt-8 md:min-h-[calc(100dvh-5rem)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-16 md:pb-24 md:pt-4">
          <div className="landing-enter flex flex-col items-start">
            <BrandLogo variant="mark" forceTheme="dark" size={72} />
            <p
              className="landing-enter landing-enter-d1 mt-6 font-display font-semibold leading-[0.88] tracking-[-0.02em] md:mt-8"
              style={{
                fontSize: "clamp(3.75rem, 12.5vw, 8rem)",
                color: L.cream,
              }}
            >
              Veluxa
            </p>
            <h1
              className="landing-enter landing-enter-d2 mt-6 max-w-xl font-display font-semibold leading-[1.22] tracking-[-0.02em] md:mt-7"
              style={{
                fontSize: "clamp(1.45rem, 3.1vw, 1.95rem)",
                color: L.gold,
              }}
            >
              A operação da funerária, organizada do atendimento ao encerramento.
            </h1>
            <p
              className="landing-enter landing-enter-d3 mt-4 max-w-md leading-relaxed"
              style={{ color: L.mute }}
            >
              Implantação em minutos, não meses. Preço público. Portal da família
              por link — sem app. IA que lê o caso real, não um FAQ genérico.
            </p>
            <div className="landing-enter landing-enter-d4 mt-9 flex flex-wrap items-center gap-3">
              <LandingBtn href={appHref} size="lg">
                Começar gratuitamente
              </LandingBtn>
              <LandingBtn href="#diferenciais" size="lg" variant="outline">
                Por que Veluxa
              </LandingBtn>
            </div>
          </div>

          <div className="landing-enter landing-enter-d3 flex justify-center md:justify-end">
            <HeroCasePanel />
          </div>
        </div>
      </section>

      {/* ── Confiança: marquee de clientes (placeholders) ─ */}
      <section className="relative z-[2]" aria-label="Clientes">
        <div className="mx-auto w-full max-w-6xl px-0 md:px-6">
          <LogoMarquee />
        </div>
      </section>

      {/* ── Problema ─────────────────────────────────────── */}
      <section className="relative z-[2]" style={{ borderTop: `1px solid ${L.line}` }}>
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-6 py-24 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-24">
          <h2
            className="font-display font-semibold leading-tight tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            O que costuma travar o dia a dia
          </h2>
          <ul>
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
            ].map((item, i) => (
              <li
                key={item.title}
                className="py-7"
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${L.line}`,
                }}
              >
                <h3 className="font-display text-xl" style={{ color: L.gold }}>
                  {item.title}
                </h3>
                <p className="mt-2 max-w-lg leading-relaxed" style={{ color: L.mute }}>
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Diferenciais — ritmo quebrado, IA em destaque ─ */}
      <section
        id="diferenciais"
        className="relative z-[2] scroll-mt-20"
        style={{
          borderTop: `1px solid ${L.line}`,
          background: L.inkElevated,
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2
            className="font-display font-semibold tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            O que o mercado ainda não entrega
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed" style={{ color: L.mute }}>
            Concorrentes grandes pedem meses de implantação e preço &quot;sob
            consulta&quot;. O Veluxa foi feito para a funerária começar hoje —
            e para a família não precisar baixar aplicativo.
          </p>

          <div className="mt-14 grid gap-4 md:grid-cols-2 md:gap-5">
            {/* IA — peso visual dobrado + trecho de conversa */}
            <article
              className="flex flex-col justify-between gap-8 p-6 md:row-span-3 md:p-8"
              style={{
                border: `1px solid ${L.line}`,
                background: `linear-gradient(165deg, rgba(231,194,122,0.08) 0%, ${L.ink} 55%)`,
              }}
            >
              <div>
                <p
                  className="font-mono text-[11px] tracking-[0.16em]"
                  style={{ color: L.goldDeep }}
                >
                  DIF.IA
                </p>
                <h3 className="font-display mt-3 text-2xl tracking-tight md:text-[1.75rem]">
                  IA que conhece o caso de verdade
                </h3>
                <p className="mt-3 max-w-md leading-relaxed" style={{ color: L.mute }}>
                  Necrológio e resumos gerados a partir dos dados reais do
                  atendimento — não um chatbot de perguntas frequentes
                  desconectado da operação.
                </p>
              </div>

              <div
                className="space-y-2.5 rounded-md p-4 font-mono text-[12px] leading-relaxed"
                style={{
                  border: `1px solid ${L.line}`,
                  background: L.ink,
                }}
                aria-label="Exemplo de conversa com a IA"
              >
                <p style={{ color: L.mute }}>
                  <span style={{ color: L.goldDeep }}>você · </span>
                  gere um necrológio para o caso CAS-1042
                </p>
                <p style={{ color: L.cream }}>
                  <span style={{ color: L.gold }}>veluxa · </span>
                  Com base no caso: Maria Helena Silva, 72 anos, velório na Sala
                  A amanhã às 14h. Rascunho pronto — valores e horários sujeitos
                  à confirmação da equipe.
                </p>
              </div>
            </article>

            {(
              [
                {
                  code: "DIF.IMPLANT",
                  title: "Implantação em minutos, não meses",
                  text: "Importe a planilha que você já usa: o Veluxa sugere o mapeamento das colunas e você confirma. Sem projeto de 2 a 6 meses.",
                },
                {
                  code: "DIF.PRECO",
                  title: "Preço público, sem letra miúda",
                  text: "Você vê o valor na página. Sem reunião comercial só para descobrir quanto custa.",
                },
                {
                  code: "DIF.PORTAL",
                  title: "Portal da família por link, sem app",
                  text: "Um link seguro no WhatsApp. A família acompanha etapas e documentos no celular — zero instalação.",
                },
              ] as const
            ).map((item) => (
              <article
                key={item.code}
                className="p-6 md:p-7"
                style={{
                  border: `1px solid ${L.line}`,
                  background: L.ink,
                }}
              >
                <p
                  className="font-mono text-[11px] tracking-[0.16em]"
                  style={{ color: L.goldDeep }}
                >
                  {item.code}
                </p>
                <h3 className="font-display mt-3 text-lg md:text-xl">{item.title}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: L.mute }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Módulos — lista editorial alternada ──────────── */}
      <section
        id="modulos"
        className="relative z-[2] scroll-mt-20"
        style={{ borderTop: `1px solid ${L.line}` }}
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2
            className="font-display font-semibold tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            Tudo o que a operação precisa
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed" style={{ color: L.mute }}>
            Módulos integrados para o ritmo real da funerária — do balcão ao
            financeiro.
          </p>

          <ul className="mt-16" style={{ borderTop: `1px solid ${L.line}` }}>
            {MODULES.map((m, i) => {
              const flip = i % 2 === 1;
              return (
                <li
                  key={m.code}
                  className={cn(
                    "grid items-center gap-8 py-12 md:grid-cols-[1fr_auto] md:gap-16",
                    flip && "md:[direction:rtl]"
                  )}
                  style={{ borderBottom: `1px solid ${L.line}` }}
                >
                  <div className={cn(flip && "md:[direction:ltr]")}>
                    <p
                      className="font-mono text-[11px] tracking-[0.16em]"
                      style={{ color: L.goldDeep }}
                    >
                      {m.code}
                    </p>
                    <h3 className="font-display mt-3 text-2xl tracking-tight md:text-[1.65rem]">
                      {m.title}
                    </h3>
                    <p
                      className="mt-3 max-w-lg leading-relaxed"
                      style={{ color: L.mute }}
                    >
                      {m.text}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 md:[direction:ltr]",
                      flip ? "md:justify-self-start" : "md:justify-self-end"
                    )}
                    style={{
                      border: `1px solid ${L.line}`,
                      background: L.inkElevated,
                      minWidth: "min(100%, 15.5rem)",
                    }}
                  >
                    <FlameMark variant={m.flame} className="h-10 w-8" />
                    <div>
                      <p
                        className="font-mono text-[10px] tracking-[0.14em] uppercase"
                        style={{ color: L.goldDeep }}
                      >
                        registro
                      </p>
                      <p className="mt-1 font-mono text-[12px]" style={{ color: L.cream }}>
                        {m.mock}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Portal ───────────────────────────────────────── */}
      <section
        id="portal"
        className="relative z-[2] scroll-mt-20"
        style={{ borderTop: `1px solid ${L.line}` }}
      >
        <div className="mx-auto grid w-full max-w-6xl items-end gap-16 px-6 py-24 md:grid-cols-2">
          <div>
            <h2
              className="font-display font-semibold leading-tight tracking-[-0.02em]"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
            >
              A família acompanha tudo{" "}
              <span style={{ color: L.gold }}>sem precisar ligar.</span>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed" style={{ color: L.mute }}>
              Um link único no WhatsApp — abre no navegador, sem baixar app e sem
              criar conta. Mostra a etapa atual, a próxima cerimônia e os
              documentos liberados. Expira após o encerramento.
            </p>
          </div>

          <div
            className="p-7 md:p-8"
            style={{
              border: `1px solid ${L.line}`,
              background: L.inkElevated,
            }}
          >
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="mark" forceTheme="dark" size={22} />
              <span className="font-display text-base">Acompanhamento</span>
            </div>
            <ol className="mt-7 space-y-4">
              {[
                ["Atendimento recebido", true],
                ["Em andamento", true],
                ["Concluído", false],
              ].map(([label, done], idx) => (
                <li key={String(label)} className="flex items-center gap-3.5">
                  <span
                    className="flex size-7 items-center justify-center font-mono text-[11px]"
                    style={{
                      border: `1px solid ${done ? L.goldDeep : L.line}`,
                      color: done ? L.gold : L.mute,
                      borderRadius: 999,
                    }}
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <span style={{ color: done ? L.cream : L.mute }}>{label}</span>
                </li>
              ))}
            </ol>
            <p
              className="mt-7 px-3 py-2.5 font-mono text-xs"
              style={{
                border: `1px solid ${L.line}`,
                color: L.mute,
                background: L.ink,
              }}
            >
              veluxa.app/portal/…
            </p>
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────── */}
      <section
        id="planos"
        className="relative z-[2] scroll-mt-20"
        style={{
          borderTop: `1px solid ${L.line}`,
          background: L.inkElevated,
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2
            className="font-display font-semibold tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            Preço transparente
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed" style={{ color: L.mute }}>
            Sem &quot;sob consulta&quot; para começar. Comece no gratuito — escale
            quando a operação pedir.
          </p>

          <div
            className="mt-14 grid md:grid-cols-3"
            style={{ borderTop: `1px solid ${L.line}` }}
          >
            <PlanColumn
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
              divide
            />
            <PlanColumn
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
              divide
            />
            <PlanColumn
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
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section
        id="faq"
        className="relative z-[2] scroll-mt-20"
        style={{ borderTop: `1px solid ${L.line}` }}
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-24">
          <h2
            className="font-display font-semibold tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            Perguntas frequentes
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed" style={{ color: L.mute }}>
            Objeções reais de quem está avaliando trocar de planilha ou de sistema.
          </p>
          <div className="mt-10">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      <section className="relative z-[2]" style={{ borderTop: `1px solid ${L.line}` }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-24 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <BrandLogo variant="wordmark" forceTheme="dark" size={40} />
            <h2
              className="mt-8 font-display font-semibold leading-snug tracking-[-0.02em]"
              style={{ fontSize: "clamp(1.65rem, 3vw, 2.1rem)" }}
            >
              Organização por dentro,{" "}
              <span style={{ color: L.gold }}>acolhimento por fora.</span>
            </h2>
          </div>
          <LandingBtn href={appHref} size="lg">
            Criar conta da funerária
          </LandingBtn>
        </div>
      </section>

      <SiteFooter />
      <WhatsappFloat />
    </div>
  );
}

function LandingBtn({
  href,
  children,
  variant = "solid",
  size = "default",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline" | "ghost";
  size?: "default" | "lg";
}) {
  const external = href.startsWith("http");
  const hash = href.startsWith("#");

  const className = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200",
    size === "lg" ? "h-11 px-5 text-[15px]" : "h-9 px-3.5 text-sm",
    variant === "solid" && "bg-[#e7c27a] text-[#0c0a09] hover:bg-[#f0d9a0]",
    variant === "outline" &&
      "border border-[rgba(250,250,249,0.22)] bg-transparent text-[#fafaf9] hover:border-[rgba(250,250,249,0.4)] hover:bg-[rgba(250,250,249,0.04)]",
    variant === "ghost" &&
      "bg-transparent text-[#a8a29e] hover:bg-[rgba(250,250,249,0.06)] hover:text-[#fafaf9]"
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (hash) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function PlanColumn({
  name,
  audience,
  price,
  period,
  features,
  href,
  cta,
  highlighted,
  divide,
}: {
  name: string;
  audience: string;
  price: string;
  period?: string;
  features: string[];
  href: string;
  cta: string;
  highlighted?: boolean;
  divide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col px-0 py-10 md:px-8 md:py-12",
        "border-b md:border-b-0",
        divide && "md:border-r"
      )}
      style={{
        borderColor: L.line,
        background: highlighted ? "rgba(231,194,122,0.06)" : "transparent",
        boxShadow: highlighted ? `inset 0 2px 0 0 ${L.gold}` : undefined,
      }}
    >
      <h3 className="font-display text-2xl tracking-tight">{name}</h3>
      <p className="mt-1.5 text-sm" style={{ color: L.mute }}>
        {audience}
      </p>
      <p className="mt-6">
        <span
          className={
            price.startsWith("R$")
              ? "font-mono text-[1.75rem] tracking-tight"
              : "font-display text-[1.75rem]"
          }
        >
          {price}
        </span>
        {period && (
          <span className="ml-1 text-sm" style={{ color: L.mute }}>
            {period}
          </span>
        )}
      </p>
      <ul className="mt-7 mb-10 flex-1 space-y-2.5 text-sm" style={{ color: L.mute }}>
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span
              className="mt-2 size-1 shrink-0 rounded-full"
              style={{ background: L.goldDeep }}
              aria-hidden
            />
            {f}
          </li>
        ))}
      </ul>
      <LandingBtn href={href} variant={highlighted ? "solid" : "outline"}>
        {cta}
      </LandingBtn>
    </div>
  );
}
