import { cn } from "@/lib/utils";

export type FlameVariant =
  | "cases"
  | "agenda"
  | "stock"
  | "contracts"
  | "portal"
  | "ai"
  | "panel";

type Props = {
  variant?: FlameVariant;
  className?: string;
  /** Para animação GSAP (opacidade/escala no painel). */
  lit?: boolean;
};

/**
 * Glifo de chama da família Veluxa — variações de espessura/forma por módulo.
 * Não usa ícones de biblioteca genérica.
 */
export function FlameMark({ variant = "cases", className, lit = true }: Props) {
  const cfg = VARIANT[variant];
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
      style={{
        opacity: lit ? 1 : 0.2,
        transform: lit ? "scale(1)" : "scale(0.88)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Corpo externo */}
      <path
        d={cfg.outer}
        stroke={cfg.stroke}
        strokeWidth={cfg.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={cfg.fillOuter}
      />
      {/* Núcleo */}
      <path
        d={cfg.inner}
        stroke={cfg.stroke}
        strokeWidth={Math.max(1, cfg.strokeWidth - 0.6)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={cfg.fillInner}
        opacity={0.9}
      />
    </svg>
  );
}

const GOLD = "#e7c27a";
const GOLD_SOFT = "rgba(231,194,122,0.18)";
const GOLD_CORE = "rgba(231,194,122,0.35)";

const VARIANT: Record<
  FlameVariant,
  {
    outer: string;
    inner: string;
    strokeWidth: number;
    stroke: string;
    fillOuter: string;
    fillInner: string;
  }
> = {
  cases: {
    outer: "M16 3C11 10 7 15 7 23a9 9 0 0 0 18 0c0-8-4-13-9-20Z",
    inner: "M16 14c-2.2 3.5-3.5 6-3.5 9a3.5 3.5 0 0 0 7 0c0-3-1.3-5.5-3.5-9Z",
    strokeWidth: 1.6,
    stroke: GOLD,
    fillOuter: GOLD_SOFT,
    fillInner: GOLD_CORE,
  },
  agenda: {
    // Chama mais estreita / pontiaguda (tempo, precisão)
    outer: "M16 2C12.5 9 9 15 9 23a7 7 0 0 0 14 0c0-8-3.5-14-7-21Z",
    inner: "M16 13c-1.6 3-2.5 5.5-2.5 8.5a2.5 2.5 0 0 0 5 0c0-3-0.9-5.5-2.5-8.5Z",
    strokeWidth: 1.35,
    stroke: GOLD,
    fillOuter: "rgba(231,194,122,0.12)",
    fillInner: GOLD_SOFT,
  },
  stock: {
    // Base mais larga (volume / estoque)
    outer: "M16 4C10 11 6 16 6 24a10 10 0 0 0 20 0c0-8-4-13-10-20Z",
    inner: "M16 15c-2.8 3.2-4 5.8-4 8.5a4 4 0 0 0 8 0c0-2.7-1.2-5.3-4-8.5Z",
    strokeWidth: 1.9,
    stroke: GOLD,
    fillOuter: GOLD_SOFT,
    fillInner: GOLD_CORE,
  },
  contracts: {
    // Contorno seco, quase sem preenchimento (registro / contrato)
    outer: "M16 3.5C11.5 10.5 8 16 8 23.5a8 8 0 0 0 16 0c0-7.5-3.5-13-8-20Z",
    inner: "M16 16v10",
    strokeWidth: 1.45,
    stroke: GOLD,
    fillOuter: "transparent",
    fillInner: "transparent",
  },
  portal: {
    // Duas línguas leves (família / acompanhamento)
    outer: "M12 6C9 12 7 17 7 23a6 6 0 0 0 10 0c0-6-2-11-5-17Z",
    inner: "M22 9C19.5 14 18 18 18 23a4.5 4.5 0 0 0 7.5-3.2C25.5 15 24 11 22 9Z",
    strokeWidth: 1.4,
    stroke: GOLD,
    fillOuter: "rgba(231,194,122,0.14)",
    fillInner: "rgba(231,194,122,0.22)",
  },
  ai: {
    // Núcleo mais luminoso (inteligência)
    outer: "M16 2.5C11 10 7.5 15.5 7.5 23a8.5 8.5 0 0 0 17 0c0-7.5-3.5-13-8.5-20.5Z",
    inner: "M16 12c-2.4 3.8-3.8 6.5-3.8 10a3.8 3.8 0 0 0 7.6 0c0-3.5-1.4-6.2-3.8-10Z",
    strokeWidth: 1.55,
    stroke: "#f0d9a0",
    fillOuter: "rgba(240,217,160,0.22)",
    fillInner: "rgba(240,217,160,0.45)",
  },
  panel: {
    outer: "M16 4C12 11 9 16 9 23a7 7 0 0 0 14 0c0-7-3-12-7-19Z",
    inner: "M16 15c-1.8 3-2.6 5-2.6 7.5a2.6 2.6 0 0 0 5.2 0c0-2.5-0.8-4.5-2.6-7.5Z",
    strokeWidth: 1.5,
    stroke: GOLD,
    fillOuter: GOLD_SOFT,
    fillInner: GOLD_CORE,
  },
};
