"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseBRLToCents } from "@/lib/format";

export default function NovoContratoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const totalCents = parseBRLToCents(String(f.get("total")));
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: f.get("customerName"),
        customerPhone: f.get("customerPhone") || undefined,
        customerDocument: f.get("customerDocument") || undefined,
        planName: f.get("planName"),
        totalCents,
        installmentsCount: Number(f.get("installmentsCount")),
        adjustmentRule: f.get("adjustmentRule") || undefined,
        firstDueDate: f.get("firstDueDate"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao criar contrato");
      return;
    }
    const { id, code } = await res.json();
    toast.success(`Contrato ${code} criado`);
    router.push(`/contratos/${id}`);
    router.refresh();
  }

  return (
    <div className="animate-enter mx-auto max-w-2xl">
      <PageHeader
        title="Novo contrato"
        description="O cronograma de parcelas mensais é gerado automaticamente."
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium">Titular</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customerName">Nome do titular *</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerDocument">CPF</Label>
              <Input id="customerDocument" name="customerDocument" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium">Plano</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="planName">Nome do plano *</Label>
              <Input id="planName" name="planName" required placeholder="Ex.: Plano Família Essencial" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Valor total (R$) *</Label>
              <Input id="total" name="total" required inputMode="decimal" placeholder="Ex.: 3.600,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installmentsCount">Nº de parcelas *</Label>
              <Input
                id="installmentsCount"
                name="installmentsCount"
                type="number"
                min={1}
                max={120}
                defaultValue={12}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstDueDate">Primeiro vencimento *</Label>
              <Input id="firstDueDate" name="firstDueDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustmentRule">Regra de reajuste</Label>
              <Input id="adjustmentRule" name="adjustmentRule" placeholder="Ex.: IPCA anual" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Criando…" : "Criar contrato"}
          </Button>
        </div>
      </form>
    </div>
  );
}
