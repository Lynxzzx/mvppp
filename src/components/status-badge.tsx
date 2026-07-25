import { cn } from "@/lib/utils";

/**
 * Badges de status consistentes (design system):
 * dourado = em andamento · sálvia = concluído/pago · cinza = novo/pendente ·
 * vermelho quente = atrasado/cancelado.
 */
const STYLES: Record<string, string> = {
  gold: "bg-gold/15 text-gold border-gold/30",
  sage: "bg-sage/15 text-sage border-sage/30",
  gray: "bg-muted text-muted-foreground border-border",
  red: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_MAP: Record<string, { label: string; tone: keyof typeof STYLES }> = {
  // Caso (PRD 6.1)
  novo: { label: "Novo", tone: "gray" },
  em_andamento: { label: "Em andamento", tone: "gold" },
  encerrado: { label: "Encerrado", tone: "sage" },
  // Parcela / cobrança (PRD 6.4 / 6.5)
  pendente: { label: "Pendente", tone: "gray" },
  pago: { label: "Pago", tone: "sage" },
  paga: { label: "Paga", tone: "sage" },
  atrasado: { label: "Atrasado", tone: "red" },
  atrasada: { label: "Atrasada", tone: "red" },
  cancelada: { label: "Cancelada", tone: "red" },
  // Cerimônia (PRD 6.2)
  agendada: { label: "Agendada", tone: "gold" },
  realizada: { label: "Realizada", tone: "sage" },
  // Contrato (PRD 6.4)
  ativo: { label: "Ativo", tone: "gold" },
  quitado: { label: "Quitado", tone: "sage" },
  cancelado: { label: "Cancelado", tone: "red" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLES[cfg.tone],
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
