"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FlameMark } from "@/components/landing/flame-mark";

const CASES = [
  { code: "CAS-1042", family: "Silva", service: "Velório", status: "Em andamento" },
  { code: "CAS-1041", family: "Oliveira", service: "Sepultamento", status: "Checklist" },
  { code: "CAS-1040", family: "Costa", service: "Cremação", status: "Documentos" },
  { code: "CAS-1039", family: "Pereira", service: "Velório", status: "Agendado" },
];

const L = {
  ink: "#0c0a09",
  inkElevated: "#141210",
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  gold: "#e7c27a",
  goldDeep: "#c4a574",
} as const;

/**
 * Painel "Painel Veluxa — hoje" — único momento de animação elaborada da landing.
 * ScrollTrigger scrub: linhas + chama aparecem conforme o scroll.
 */
export function HeroCasePanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const flameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const footerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rows = rowRefs.current.filter(Boolean) as HTMLLIElement[];
    const flames = flameRefs.current.filter(Boolean) as HTMLSpanElement[];
    const footer = footerRef.current;

    if (reduced) {
      gsap.set([rows, flames, footer].flat().filter(Boolean), {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(rows, { opacity: 0, y: 14 });
    gsap.set(flames, { opacity: 0.12, scale: 0.82 });
    if (footer) gsap.set(footer, { opacity: 0, y: 8 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 78%",
        end: "top 28%",
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });

    rows.forEach((row, i) => {
      const at = i * 0.22;
      tl.to(row, { opacity: 1, y: 0, duration: 0.2, ease: "none" }, at);
      if (flames[i]) {
        tl.to(
          flames[i],
          { opacity: 1, scale: 1, duration: 0.2, ease: "none", force3D: true },
          at
        );
      }
    });

    if (footer) {
      tl.to(footer, { opacity: 1, y: 0, duration: 0.18, ease: "none" }, rows.length * 0.22);
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      {/* Glow sutil — como se o painel emitisse luz própria */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(231,194,122,0.14) 0%, transparent 68%)",
        }}
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded-lg border"
        style={{
          borderColor: L.line,
          background: L.inkElevated,
          willChange: "contents",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3 sm:px-5"
          style={{ borderColor: L.line }}
        >
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: L.goldDeep }}>
            Painel Veluxa — hoje
          </p>
          <span className="font-mono text-[10px]" style={{ color: L.mute }}>
            ao vivo
          </span>
        </div>

        <ul className="divide-y" style={{ borderColor: L.line }}>
          {CASES.map((c, i) => (
            <li
              key={c.code}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className="flex items-center gap-3 px-4 py-3.5 sm:gap-3.5 sm:px-5"
              style={{ borderColor: L.line }}
            >
              <span
                ref={(el) => {
                  flameRefs.current[i] = el;
                }}
                className="inline-flex"
                style={{ willChange: "opacity, transform" }}
              >
                <FlameMark variant="panel" className="h-7 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[11px] tracking-wide" style={{ color: L.gold }}>
                    {c.code}
                  </span>
                  <span className="truncate text-[14px]" style={{ color: L.cream }}>
                    {c.family}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: L.mute }}>
                  {c.service} · {c.status}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p
          ref={footerRef}
          className="border-t px-4 py-3 font-mono text-[11px] tracking-wide sm:px-5"
          style={{ borderColor: L.line, color: L.mute }}
        >
          4 casos ativos · agenda aplicada
        </p>
      </div>
    </div>
  );
}
