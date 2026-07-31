import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { WHATSAPP_SALES_URL } from "@/lib/plans";

const L = {
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  goldDeep: "#c4a574",
} as const;

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { href: "/#modulos", label: "Módulos" },
      { href: "/#diferenciais", label: "Diferenciais" },
      { href: "/#planos", label: "Planos" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/registrar", label: "Criar conta" },
      { href: "/login", label: "Entrar" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/termos", label: "Termos de Uso" },
      { href: "/privacidade", label: "Política de Privacidade" },
    ],
  },
] as const;

/**
 * Rodapé em colunas (estrutura tipo footer Aceternity/21st.dev),
 * identidade Veluxa.
 */
export function SiteFooter() {
  return (
    <footer
      className="relative z-[2]"
      style={{ borderTop: `1px solid ${L.line}`, color: L.mute }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_repeat(3,1fr)] md:gap-10">
        <div>
          <BrandLogo forceTheme="dark" size={24} className="text-base text-[#fafaf9]" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            ERP para funerárias — operação organizada, família acompanhada, preço
            transparente.
          </p>
          <a
            href={WHATSAPP_SALES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-sm transition-colors duration-200 hover:text-[#fafaf9]"
            style={{ color: L.goldDeep }}
          >
            Falar no WhatsApp
          </a>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p
              className="font-mono text-[11px] tracking-[0.16em] uppercase"
              style={{ color: L.goldDeep }}
            >
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-200 hover:text-[#fafaf9]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs"
        style={{ borderTop: `1px solid ${L.line}` }}
      >
        <p>© {new Date().getFullYear()} Veluxa · ERP para funerárias</p>
        <p>Brasil · LGPD</p>
      </div>
    </footer>
  );
}
