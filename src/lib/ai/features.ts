/** Funcionalidades de IA do Veluxa — chave estável usada em AiSettings e nas APIs. */

export const AI_FEATURES = ["obituary-draft", "case-summary"] as const;

export type AiFeature = (typeof AI_FEATURES)[number];

export const AI_FEATURE_LABEL: Record<AiFeature, string> = {
  "obituary-draft": "Gerador de necrológio",
  "case-summary": "Resumo de caso",
};

export const AI_FEATURE_DESCRIPTION: Record<AiFeature, string> = {
  "obituary-draft":
    "Redige um rascunho de necrológio respeitoso a partir dos dados do atendimento.",
  "case-summary":
    "Gera um resumo interno do caso (família, falecido, status e histórico recente).",
};

/** Modelo padrão do produto (também fallback de ambiente). */
export const AI_DEFAULT_MODEL = "inclusionai/ling-3.0-flash:free";

/** Modelos já validados pela equipe (badge "Recomendado" no seletor). */
export const AI_RECOMMENDED_MODELS = [
  "inclusionai/ling-3.0-flash:free",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001",
] as const;

export function isAiFeature(value: string): value is AiFeature {
  return (AI_FEATURES as readonly string[]).includes(value);
}

export function isRecommendedModel(modelId: string): boolean {
  return (AI_RECOMMENDED_MODELS as readonly string[]).includes(modelId);
}
