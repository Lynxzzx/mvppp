/** Cabeçalho padrão das páginas do painel. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
