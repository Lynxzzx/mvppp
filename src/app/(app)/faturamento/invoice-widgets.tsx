"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseBRLToCents } from "@/lib/format";

export function InvoiceActions({
  id,
  status,
  boletoLine,
}: {
  id: string;
  status: string;
  boletoLine?: string;
}) {
  const router = useRouter();

  async function setStatus(next: "paga" | "pendente" | "cancelada") {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar cobrança");
      return;
    }
    toast.success(
      next === "paga" ? "Cobrança marcada como paga" : next === "cancelada" ? "Cobrança cancelada" : "Baixa estornada"
    );
    router.refresh();
  }

  async function copyLine() {
    if (!boletoLine) return;
    await navigator.clipboard.writeText(boletoLine);
    toast.success("Linha digitável copiada");
  }

  return (
    <div className="flex justify-end gap-1">
      {boletoLine && (
        <Button size="icon-sm" variant="ghost" aria-label="Copiar linha digitável" title="Copiar linha digitável" onClick={copyLine}>
          <Copy />
        </Button>
      )}
      {status === "pendente" && (
        <>
          <Button size="sm" variant="outline" onClick={() => setStatus("paga")}>
            Marcar paga
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus("cancelada")}>
            Cancelar
          </Button>
        </>
      )}
      {status === "paga" && (
        <Button size="sm" variant="ghost" onClick={() => setStatus("pendente")}>
          <Undo2 data-icon="inline-start" /> Estornar
        </Button>
      )}
    </div>
  );
}

export function NewInvoiceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<{ _id: string; code: string; deceased: { name: string } }[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/cases")
      .then((r) => (r.ok ? r.json() : { cases: [] }))
      .then((d) => setCases(d.cases))
      .catch(() => null);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: f.get("caseId"),
        description: f.get("description"),
        amountCents: parseBRLToCents(String(f.get("amount"))),
        dueDate: f.get("dueDate"),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao gerar cobrança");
      return;
    }
    const { number } = await res.json();
    toast.success(`Cobrança ${number} gerada (boleto simulado)`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Nova cobrança
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Nova cobrança (boleto simulado)</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-case">Caso *</Label>
              <select
                id="inv-case"
                name="caseId"
                required
                defaultValue=""
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="" disabled>Selecione o caso…</option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.deceased?.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Cobranças de parcelas de contrato são geradas na tela do contrato.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-desc">Descrição *</Label>
              <Textarea id="inv-desc" name="description" rows={2} required placeholder="Ex.: Serviço de velório e sepultamento" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inv-amount">Valor (R$) *</Label>
                <Input id="inv-amount" name="amount" required inputMode="decimal" placeholder="Ex.: 2.500,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due">Vencimento *</Label>
                <Input id="inv-due" name="dueDate" type="date" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Gerar cobrança</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
