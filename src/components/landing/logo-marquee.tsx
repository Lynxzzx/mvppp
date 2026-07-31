"use client";

import { cn } from "@/lib/utils";

const L = {
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  goldDeep: "#c4a574",
  inkElevated: "#141210",
} as const;

/** Placeholders até fechar os primeiros clientes reais. */
const PLACEHOLDERS = [
  "Funerária Aurora",
  "Casa Memorial",
  "Grupo Paz Eterna",
  "Serviços São José",
  "Memorial do Vale",
  "Rede Esperança",
];

/**
 * Faixa de logos com scroll infinito (padrão marquee / Aceternity).
 * Tokens Veluxa — pronto para trocar placeholders por logos reais.
 */
export function LogoMarquee({
  className,
  labels = PLACEHOLDERS,
}: {
  className?: string;
  labels?: string[];
}) {
  const loop = [...labels, ...labels];

  return (
    <div
      className={cn("relative overflow-hidden py-10", className)}
      style={{ borderTop: `1px solid ${L.line}`, borderBottom: `1px solid ${L.line}` }}
    >
      <p
        className="mb-6 text-center font-mono text-[11px] tracking-[0.18em] uppercase"
        style={{ color: L.goldDeep }}
      >
        Funerárias que confiam no Veluxa
      </p>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0c0a09] to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0c0a09] to-transparent md:w-24" />

      <div className="flex overflow-hidden">
        <ul className="landing-marquee flex min-w-full shrink-0 items-center gap-10 px-5 md:gap-14">
          {loop.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="flex h-12 shrink-0 items-center justify-center px-5 font-display text-lg tracking-[-0.02em] whitespace-nowrap md:h-14 md:text-xl"
              style={{
                color: L.mute,
                border: `1px solid ${L.line}`,
                background: L.inkElevated,
                minWidth: "10.5rem",
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-center text-xs" style={{ color: L.mute }}>
        Espaço reservado — logos reais assim que os primeiros clientes autorizarem.
      </p>
    </div>
  );
}
