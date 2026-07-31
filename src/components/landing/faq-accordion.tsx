"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

const L = {
  cream: "#fafaf9",
  mute: "#a8a29e",
  line: "rgba(250,250,249,0.12)",
  gold: "#e7c27a",
  goldDeep: "#c4a574",
  ink: "#0c0a09",
} as const;

/**
 * FAQ em acordeão limpo (estrutura tipo Aceternity/21st.dev),
 * tokens do Veluxa — sem animações elaboradas.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y" style={{ borderColor: L.line, borderTop: `1px solid ${L.line}` }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const btnId = `faq-btn-${i}`;
        return (
          <div key={item.question} style={{ borderColor: L.line }}>
            <button
              id={btnId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors duration-200 hover:text-[#e7c27a]"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-display text-lg tracking-[-0.02em] md:text-xl" style={{ color: L.cream }}>
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                style={{ color: L.goldDeep }}
                aria-hidden
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl leading-relaxed" style={{ color: L.mute }}>
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
