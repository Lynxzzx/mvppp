/** Planos comerciais (PRD seção 10) com preços definidos pelo negócio. */

export type PaidPlan = "essencial" | "profissional";
export type Plan = "free" | PaidPlan | "rede";

/** Módulos do produto que podem ser liberados/bloqueados por plano. */
export type Feature =
  | "casos"
  | "agenda"
  | "estoque"
  | "contratos"
  | "faturamento"
  | "portal"
  | "relatorios";

export const WHATSAPP_SALES_URL =
  "https://wa.me/55999475210?text=" +
  encodeURIComponent("Olá! Tenho interesse no plano Rede do Veluxa.");

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Gratuito",
  essencial: "Essencial",
  profissional: "Profissional",
  rede: "Rede",
};

export const PLAN_INFO: Record<
  PaidPlan,
  { label: string; priceCents: number; features: string[] }
> = {
  essencial: {
    label: "Essencial",
    priceCents: 29700,
    features: [
      "Atendimento & casos",
      "Agenda de cerimônias",
      "Estoque básico",
      "Portal da família",
      "Até 2 usuários",
    ],
  },
  profissional: {
    label: "Profissional",
    priceCents: 69700,
    features: [
      "Tudo do Essencial",
      "Contratos & planos pré-pagos",
      "Faturamento",
      "Relatórios",
      "Até 10 usuários",
    ],
  },
};

/**
 * Matriz de acesso: quais módulos cada plano libera.
 * Free é degustação: casos, agenda e portal (com limites em FREE_LIMITS).
 */
const PLAN_FEATURES: Record<Plan, readonly Feature[]> = {
  free: ["casos", "agenda", "portal"],
  essencial: ["casos", "agenda", "estoque", "portal"],
  profissional: ["casos", "agenda", "estoque", "contratos", "faturamento", "portal", "relatorios"],
  rede: ["casos", "agenda", "estoque", "contratos", "faturamento", "portal", "relatorios"],
};

/** Limites do plano gratuito (degustação). */
export const FREE_LIMITS = {
  cases: 3,
  ceremonies: 3,
} as const;

export function planAllows(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

/** Menor plano que libera o módulo (para CTA de upgrade). */
export function minPlanFor(feature: Feature): PaidPlan {
  return PLAN_FEATURES.essencial.includes(feature) ? "essencial" : "profissional";
}

export const FEATURE_LABEL: Record<Feature, string> = {
  casos: "Atendimento & casos",
  agenda: "Agenda de cerimônias",
  estoque: "Estoque & fornecedores",
  contratos: "Contratos & planos",
  faturamento: "Faturamento",
  portal: "Portal da família",
  relatorios: "Relatórios",
};
