import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Estado vazio padrão: orientação clara + ação primária (design system). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-enter flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 py-16 px-6 text-center">
      {Icon && <Icon className="size-7 text-gold/70" aria-hidden />}
      <p className="font-display text-lg tracking-tight text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action}
      {!action && actionLabel && actionHref && (
        <Button className="mt-2" nativeButton={false} render={<Link href={actionHref} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
