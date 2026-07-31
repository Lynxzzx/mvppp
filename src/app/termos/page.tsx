import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Termos de Uso" };

const L = {
  ink: "#0c0a09",
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  gold: "#e7c27a",
} as const;

export default function TermosPage() {
  return (
    <div className="min-h-dvh" style={{ background: L.ink, color: L.cream }}>
      <div className="landing-grain pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay" aria-hidden />
      <header className="relative mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/">
          <BrandLogo forceTheme="dark" size={24} className="text-base text-[#fafaf9]" />
        </Link>
        <Link href="/privacidade" className="text-sm" style={{ color: L.mute }}>
          Privacidade
        </Link>
      </header>
      <main className="relative mx-auto max-w-3xl px-6 py-12 pb-24">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: L.gold }}>
          Legal
        </p>
        <h1 className="font-display mt-3 text-4xl tracking-[-0.02em]">Termos de Uso</h1>
        <p className="mt-3 text-sm" style={{ color: L.mute }}>
          Última atualização: 31 de julho de 2026
        </p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed" style={{ color: L.mute }}>
          <Section title="1. Aceitação">
            Ao criar conta ou utilizar o Veluxa, você concorda com estes Termos. Se não concordar,
            não utilize o serviço.
          </Section>
          <Section title="2. O serviço">
            O Veluxa é um software (SaaS) para gestão de funerárias: atendimento, agenda, estoque,
            contratos, faturamento, portal da família e recursos de IA opcionais. As funcionalidades
            variam conforme o plano contratado.
          </Section>
          <Section title="3. Conta e responsabilidades">
            Você é responsável por manter credenciais seguras, pela veracidade dos dados inseridos
            e pelo uso adequado do sistema pela sua equipe. Contas podem ser suspensas em caso de
            abuso, inadimplência ou violação destes Termos.
          </Section>
          <Section title="4. Dados e privacidade">
            O tratamento de dados pessoais segue a nossa{" "}
            <Link href="/privacidade" className="underline underline-offset-4" style={{ color: L.cream }}>
              Política de Privacidade
            </Link>
            , em conformidade com a LGPD (Lei nº 13.709/2018).
          </Section>
          <Section title="5. Planos e pagamento">
            Preços e limites dos planos estão descritos na página comercial. O plano gratuito pode
            ter limitações. Pagamentos de planos pagos seguem as condições apresentadas no
            checkout. Não há garantia de disponibilidade ininterrupta, mas buscamos alta
            disponibilidade razoável.
          </Section>
          <Section title="6. Conteúdo do cliente">
            Você mantém a titularidade dos dados que inserir. Concede ao Veluxa licença limitada
            para processá-los apenas para prestar o serviço. Não revendemos sua base de clientes.
          </Section>
          <Section title="7. IA">
            Recursos de inteligência artificial são auxiliares. Saídas devem ser revisadas por
            humanos antes de uso externo (ex.: necrológio). O Veluxa não se responsabiliza por
            decisões tomadas exclusivamente com base em conteúdo gerado por IA.
          </Section>
          <Section title="8. Limitação de responsabilidade">
            O serviço é oferecido &quot;como está&quot;, nos limites da lei. Não nos
            responsabilizamos por danos indiretos, lucros cessantes ou interrupções causadas por
            fatores fora do nosso controle razoável.
          </Section>
          <Section title="9. Rescisão">
            Você pode encerrar a conta a qualquer momento. Podemos encerrar ou suspender o acesso
            em caso de violação destes Termos ou inadimplência, com aviso quando praticável.
          </Section>
          <Section title="10. Contato">
            Dúvidas sobre estes Termos: fale conosco pelo WhatsApp comercial indicado no site ou
            pelo canal de suporte da sua conta.
          </Section>
        </div>

        <Link
          href="/"
          className="mt-12 inline-block text-sm transition-colors hover:text-[#fafaf9]"
          style={{ color: L.gold }}
        >
          ← Voltar ao início
        </Link>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: `1px solid ${L.line}`, paddingTop: "1.5rem" }}>
      <h2 className="font-display text-xl tracking-[-0.02em]" style={{ color: L.cream }}>
        {title}
      </h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
