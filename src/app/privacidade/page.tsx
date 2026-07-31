import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Política de Privacidade" };

const L = {
  ink: "#0c0a09",
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  gold: "#e7c27a",
} as const;

export default function PrivacidadePage() {
  return (
    <div className="min-h-dvh" style={{ background: L.ink, color: L.cream }}>
      <div className="landing-grain pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay" aria-hidden />
      <header className="relative mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/">
          <BrandLogo forceTheme="dark" size={24} className="text-base text-[#fafaf9]" />
        </Link>
        <Link href="/termos" className="text-sm" style={{ color: L.mute }}>
          Termos
        </Link>
      </header>
      <main className="relative mx-auto max-w-3xl px-6 py-12 pb-24">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: L.gold }}>
          LGPD
        </p>
        <h1 className="font-display mt-3 text-4xl tracking-[-0.02em]">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm" style={{ color: L.mute }}>
          Última atualização: 31 de julho de 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed" style={{ color: L.mute }}>
          <Section title="1. Controlador">
            O Veluxa atua como operador/controlador conforme o contexto: dados da conta da
            funerária (cadastro, billing) são tratados sob nossa responsabilidade; dados de
            famílias e casos inseridos pela funerária são, em regra, de responsabilidade da
            funerária (controladora), e o Veluxa atua como operador sob instruções do cliente.
          </Section>
          <Section title="2. Dados que coletamos">
            Dados de cadastro (nome, e-mail, nome da funerária), dados de uso do sistema,
            informações operacionais inseridas pela equipe (casos, contratos, agenda), logs
            técnicos e, quando habilitado, conteúdo enviado a recursos de IA. Não pedimos dados
            desnecessários à prestação do serviço.
          </Section>
          <Section title="3. Finalidades">
            Prestação e melhoria do serviço, autenticação, suporte, cobrança de planos, segurança,
            cumprimento de obrigações legais e comunicações relacionadas à conta. Não vendemos
            dados pessoais.
          </Section>
          <Section title="4. Bases legais (LGPD)">
            Execução de contrato, legítimo interesse (segurança e melhoria), consentimento quando
            aplicável, e cumprimento de obrigação legal.
          </Section>
          <Section title="5. Compartilhamento">
            Podemos usar subprocessadores de infraestrutura (hospedagem, e-mail, pagamento, IA via
            provedores como OpenRouter) sob contratos e medidas de segurança adequadas. Dados não
            são compartilhados com terceiros para fins de marketing sem autorização.
          </Section>
          <Section title="6. Retenção e exclusão">
            Mantemos dados enquanto a conta estiver ativa e pelo prazo necessário a obrigações
            legais. Após encerramento, dados podem ser excluídos ou anonimizados conforme política
            operacional e pedidos do titular/cliente.
          </Section>
          <Section title="7. Segurança">
            Acesso autenticado, isolamento por funerária (multi-tenant), criptografia em trânsito
            (HTTPS) e práticas de minimização. Nenhum sistema é 100% isento de risco; notificamos
            incidentes relevantes conforme a lei.
          </Section>
          <Section title="8. Direitos do titular">
            Você pode solicitar confirmação de tratamento, acesso, correção, anonimização,
            portabilidade, eliminação e informação sobre compartilhamentos, nos termos da LGPD,
            pelos canais de contato do site ou suporte da conta.
          </Section>
          <Section title="9. Cookies">
            Usamos cookies essenciais de sessão/autenticação. Cookies opcionais de analytics, se
            adotados, serão informados e poderão depender de consentimento.
          </Section>
          <Section title="10. Contato do encarregado (DPO)">
            Para exercer direitos ou tirar dúvidas sobre privacidade, utilize o WhatsApp comercial
            do site ou o e-mail de suporte da sua conta, com o assunto &quot;LGPD / Privacidade&quot;.
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
