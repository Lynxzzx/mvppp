import type { ServiceType } from "@/models/Case";

/**
 * Templates padrão de checklist por tipo de serviço (PRD 6.1).
 * No MVP o checklist é editável por caso; o template dá o ponto de partida
 * (ver DECISIONS.md — "configurável por tipo de serviço").
 */
const COMMON = [
  "Registrar dados da família responsável",
  "Receber certidão de óbito",
  "Definir plano/orçamento do serviço",
  "Selecionar urna e ornamentação",
];

export const CHECKLIST_TEMPLATES: Record<ServiceType, string[]> = {
  velorio: [
    ...COMMON,
    "Reservar sala de velório",
    "Agendar preparação do corpo",
    "Organizar transporte (veículo)",
    "Confirmar horário com a família",
  ],
  sepultamento: [
    ...COMMON,
    "Confirmar jazigo/local de sepultamento",
    "Obter autorização de sepultamento",
    "Agendar cortejo e veículo",
    "Confirmar horário com o cemitério",
  ],
  cremacao: [
    ...COMMON,
    "Obter autorização de cremação (declaração médica adicional)",
    "Confirmar agendamento com o crematório",
    "Organizar transporte (veículo)",
    "Definir destinação das cinzas com a família",
  ],
};

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  velorio: "Velório",
  sepultamento: "Sepultamento",
  cremacao: "Cremação",
};
