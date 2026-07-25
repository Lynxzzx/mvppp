"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { value: "urna", label: "Urna" },
  { value: "caixao", label: "Caixão" },
  { value: "flor", label: "Flor" },
  { value: "paramentacao", label: "Paramentação" },
  { value: "veiculo", label: "Veículo" },
  { value: "outro", label: "Outro" },
];

const selectClass =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring";

async function post(url: string, body: unknown): Promise<boolean> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    toast.error(data?.error ?? "Erro na operação");
    return false;
  }
  return true;
}

export function NewItemDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await post("/api/inventory", {
      name: f.get("name"),
      category: f.get("category"),
      quantity: Number(f.get("quantity") || 0),
      minQuantity: Number(f.get("minQuantity") || 0),
      supplierName: f.get("supplierName") || undefined,
    });
    if (ok) {
      toast.success("Item cadastrado");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Novo item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Novo item de estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ni-name">Nome *</Label>
              <Input id="ni-name" name="name" required placeholder="Ex.: Urna modelo clássico" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ni-category">Categoria *</Label>
                <select id="ni-category" name="category" required className={selectClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ni-quantity">Qtd. inicial</Label>
                <Input id="ni-quantity" name="quantity" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ni-min">Nível mínimo</Label>
                <Input id="ni-min" name="minQuantity" type="number" min={0} defaultValue={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ni-supplier">Fornecedor</Label>
              <Input id="ni-supplier" name="supplierName" placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MovementDialog({
  items,
}: {
  items: { _id: string; name: string; quantity: number }[];
}) {
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
    const res = await fetch("/api/inventory/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: f.get("itemId"),
        type: f.get("type"),
        quantity: Number(f.get("quantity")),
        caseId: f.get("caseId") || undefined,
        note: f.get("note") || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro na movimentação");
      return;
    }
    const data = await res.json();
    if (data.lowStock) {
      toast.warning("Atenção: item atingiu o nível mínimo de estoque");
    } else {
      toast.success("Movimentação registrada");
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowDownUp data-icon="inline-start" /> Movimentar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Entrada / saída de estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mv-item">Item *</Label>
              <select id="mv-item" name="itemId" required className={selectClass}>
                <option value="" disabled>Selecione…</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} (atual: {i.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mv-type">Tipo *</Label>
                <select id="mv-type" name="type" required className={selectClass}>
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mv-qty">Quantidade *</Label>
                <Input id="mv-qty" name="quantity" type="number" min={1} defaultValue={1} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mv-case">Vincular a caso</Label>
              <select id="mv-case" name="caseId" className={selectClass} defaultValue="">
                <option value="">Sem vínculo</option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.deceased?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mv-note">Observação</Label>
              <Input id="mv-note" name="note" placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NewSupplierDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await post("/api/suppliers", {
      name: f.get("name"),
      category: f.get("category"),
      phone: f.get("phone") || undefined,
      email: f.get("email") || undefined,
    });
    if (ok) {
      toast.success("Fornecedor cadastrado");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Novo fornecedor
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-medium">Novo fornecedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ns-name">Nome *</Label>
              <Input id="ns-name" name="name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ns-category">Categoria *</Label>
                <select id="ns-category" name="category" required className={selectClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ns-phone">Telefone</Label>
                <Input id="ns-phone" name="phone" type="tel" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns-email">E-mail</Label>
              <Input id="ns-email" name="email" type="email" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
