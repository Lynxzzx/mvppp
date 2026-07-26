import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ServiceType } from "@/models/Case";
import type { ChatMessage } from "@/lib/ai/openrouter";

type CaseForAi = {
  code: string;
  status: string;
  serviceType: ServiceType;
  family: { name: string; phone?: string; email?: string; relationship?: string };
  deceased: {
    name: string;
    dateOfBirth?: Date | string | null;
    dateOfDeath?: Date | string | null;
    placeOfDeath?: string;
  };
  timeline?: { kind: string; text: string; at: Date | string; userName?: string }[];
};

function orDash(value: string | undefined | null, fallback = "não informado"): string {
  if (!value || value === "—") return fallback;
  return value;
}

function caseContext(c: CaseForAi): string {
  const notes = (c.timeline ?? [])
    .filter((t) => t.kind === "nota" || t.kind === "status")
    .slice(-12)
    .map(
      (t) =>
        `- [${formatDateTime(t.at)}] ${t.kind}${t.userName ? ` (${t.userName})` : ""}: ${t.text}`
    )
    .join("\n");

  return [
    `Código do caso: ${c.code}`,
    `Status: ${c.status}`,
    `Tipo de serviço: ${SERVICE_TYPE_LABEL[c.serviceType] ?? c.serviceType}`,
    `Falecido(a): ${c.deceased.name}`,
    `Nascimento: ${orDash(formatDate(c.deceased.dateOfBirth))}`,
    `Óbito: ${orDash(formatDate(c.deceased.dateOfDeath))}`,
    `Local do óbito: ${orDash(c.deceased.placeOfDeath)}`,
    `Familiar responsável: ${c.family.name}`,
    `Parentesco: ${orDash(c.family.relationship)}`,
    `Contato: ${orDash([c.family.phone, c.family.email].filter(Boolean).join(" · "))}`,
    notes ? `Histórico recente:\n${notes}` : "Histórico recente: (vazio)",
  ].join("\n");
}

export function obituaryMessages(c: CaseForAi): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Você é redator de necrológios para funerárias no Brasil. Escreva em português do Brasil, tom respeitoso, sóbrio e acolhedor. Não invente biografia, títulos honoríficos, causas de morte, religião ou detalhes que não estejam nos dados. Se faltar informação, use formulações genéricas adequadas. Entregue apenas o texto do necrológio, sem título nem explicações.",
    },
    {
      role: "user",
      content: `Redija um rascunho de necrológio (1 a 3 parágrafos curtos) com base nestes dados:\n\n${caseContext(c)}`,
    },
  ];
}

export function caseSummaryMessages(c: CaseForAi): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Você resume atendimentos funerários para a equipe interna. Português do Brasil, objetivo e discreto. Não invente fatos. Use bullets curtos. Não inclua dados desnecessários além do contexto.",
    },
    {
      role: "user",
      content: `Gere um resumo interno do caso em até 8 bullets:\n\n${caseContext(c)}`,
    },
  ];
}
