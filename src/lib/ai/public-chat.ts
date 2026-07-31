import type { ChatKnowledgeBaseDoc } from "@/models/ChatKnowledgeBase";

const MAX_KB_CHARS = 14_000;
const MAX_DOC_CHARS = 4_000;

/** Sinais de urgência/emergência → handoff imediato ao WhatsApp. */
const URGENCY_PATTERNS: RegExp[] = [
  /\bfaleceu\b/i,
  /\bfaleceu agora\b/i,
  /\bacabou de (falecer|morrer)\b/i,
  /\bmorreu\b/i,
  /\bóbitos?\b/i,
  /\bemerg[eê]ncia\b/i,
  /\burg[eê]nte\b/i,
  /\burg[eê]ncia\b/i,
  /\bpreciso de ajuda (hoje|agora|j[aá])\b/i,
  /\bajuda (hoje|agora)\b/i,
  /\bagora mesmo\b/i,
  /\bcorpo\b/i,
  /\bremoc[aã]o\b/i,
  /\bvel[oó]rio (hoje|agora)\b/i,
  /\baten[dç]imento (hoje|agora|imediato)\b/i,
];

export function detectUrgency(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return URGENCY_PATTERNS.some((re) => re.test(t));
}

export function urgencyHandoffMessage(tenantName: string): string {
  return (
    `Sinto muito pelo momento difícil. Para atendimento imediato com a equipe da ${tenantName}, ` +
    `use o botão "Falar agora no WhatsApp" nesta tela — eles estão preparados para ajudar agora. ` +
    `Não continue por este chat em situações de urgência.`
  );
}

/** Normaliza telefone BR para dígitos (com 55 se parecer nacional). */
export function normalizeWhatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function whatsappChatUrl(digits: string, prefill?: string): string | null {
  const n = normalizeWhatsappDigits(digits);
  if (!n || n.length < 12) return null;
  const base = `https://wa.me/${n}`;
  if (!prefill?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefill.trim())}`;
}

export function slugifyTenantName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "funeraria";
}

type KbLike = {
  faq?: { question: string; answer: string }[];
  pricingInfo?: string;
  policies?: string;
  uploadedDocuments?: { fileName: string; extractedText?: string }[];
};

/** Monta o bloco de conhecimento injetado no prompt (RAG simples). */
export function buildKnowledgeContext(kb: KbLike): string {
  const parts: string[] = [];

  if (kb.pricingInfo?.trim()) {
    parts.push(`## Preços e planos\n${kb.pricingInfo.trim()}`);
  }

  if (kb.policies?.trim()) {
    parts.push(`## Políticas e informações gerais\n${kb.policies.trim()}`);
  }

  const faq = (kb.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (faq.length) {
    parts.push(
      "## Perguntas frequentes\n" +
        faq.map((f, i) => `${i + 1}. P: ${f.question.trim()}\n   R: ${f.answer.trim()}`).join("\n")
    );
  }

  for (const doc of kb.uploadedDocuments ?? []) {
    const text = (doc.extractedText ?? "").trim().slice(0, MAX_DOC_CHARS);
    if (!text) continue;
    parts.push(`## Documento: ${doc.fileName}\n${text}`);
  }

  let joined = parts.join("\n\n").trim();
  if (!joined) {
    return "(Nenhuma informação cadastrada ainda pela funerária.)";
  }
  if (joined.length > MAX_KB_CHARS) {
    joined = joined.slice(0, MAX_KB_CHARS) + "\n\n[…conteúdo truncado por limite de contexto…]";
  }
  return joined;
}

export function publicChatAppUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  if (base) return `${base}/chat/${slug}`;
  return `/chat/${slug}`;
}

export type { ChatKnowledgeBaseDoc };
