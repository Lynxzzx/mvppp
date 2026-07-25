/** Helpers de formatação pt-BR. Valores monetários em centavos (inteiro). */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | Date | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Converte "1.234,56" ou "1234.56" em centavos. */
export function parseBRLToCents(input: string): number {
  const normalized = input.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}
