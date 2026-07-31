"use client";

import { MessageCircle } from "lucide-react";

const CONTACT_URL =
  "https://wa.me/55999475210?text=" +
  encodeURIComponent("Olá! Quero conhecer o Veluxa para a minha funerária.");

/**
 * Botão WhatsApp flutuante — visível em toda a landing.
 */
export function WhatsappFloat() {
  return (
    <a
      href={CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#052e16] shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7c27a] md:right-6"
      aria-label="Falar com o Veluxa no WhatsApp"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
