"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Phone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

type Item = {
  contractId: string;
  contractCode: string;
  customerName: string;
  customerPhone: string;
  planName: string;
  installmentNumber: number;
  dueDate: string;
  amountCents: number;
  amountLabel: string;
  overdue: boolean;
};

export function CollectorClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cobrador/${token}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Link indisponível");
        return;
      }
      setCollectorName(data.collectorName);
      setTenantName(data.tenantName);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay(item: Item) {
    const key = `${item.contractId}-${item.installmentNumber}`;
    if (!confirm(`Confirmar recebimento de ${item.amountLabel} — ${item.customerName}?`)) {
      return;
    }
    setPaying(key);
    try {
      const res = await fetch(`/api/cobrador/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: item.contractId,
          installmentNumber: item.installmentNumber,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Falha ao registrar");
        return;
      }
      toast.success("Pagamento registrado");
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.contractId === item.contractId &&
              i.installmentNumber === item.installmentNumber
            )
        )
      );
    } finally {
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando parcelas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="font-display text-xl tracking-tight">Link indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-enter">
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {tenantName}
        </p>
        <h1 className="mt-1 font-display text-xl tracking-tight">
          Olá, {collectorName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} parcela(s) em aberto para receber.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma parcela pendente no momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const key = `${item.contractId}-${item.installmentNumber}`;
            return (
              <li
                key={key}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.contractCode} · {item.planName} · parc.{" "}
                      {item.installmentNumber}
                    </p>
                    <p className="mt-1 font-mono text-lg text-gold">
                      {item.amountLabel}
                    </p>
                    <p
                      className={
                        item.overdue
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      Venc. {formatDate(item.dueDate)}
                      {item.overdue ? " · atrasada" : ""}
                    </p>
                    {item.customerPhone && (
                      <a
                        href={`tel:${item.customerPhone}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {item.customerPhone}
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={paying === key}
                    onClick={() => void pay(item)}
                    className="shrink-0"
                  >
                    {paying === key ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Banknote data-icon="inline-start" />
                    )}
                    Recebi
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
