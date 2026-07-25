"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NovoCasoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        family: {
          name: f.get("familyName"),
          phone: f.get("familyPhone") || undefined,
          email: f.get("familyEmail") || undefined,
          relationship: f.get("relationship") || undefined,
        },
        deceased: {
          name: f.get("deceasedName"),
          dateOfDeath: f.get("dateOfDeath") || undefined,
          placeOfDeath: f.get("placeOfDeath") || undefined,
        },
        serviceType: f.get("serviceType"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao registrar caso");
      return;
    }
    const { id, code } = await res.json();
    toast.success(`Caso ${code} registrado`);
    router.push(`/casos/${id}`);
    router.refresh();
  }

  return (
    <div className="animate-enter mx-auto max-w-2xl">
      <PageHeader
        title="Registrar novo caso"
        description="Fluxo rápido para o primeiro contato. O checklist do serviço é criado automaticamente."
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium">Família responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="familyName">Nome do responsável *</Label>
              <Input id="familyName" name="familyName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyPhone">Telefone</Label>
              <Input id="familyPhone" name="familyPhone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyEmail">E-mail</Label>
              <Input id="familyEmail" name="familyEmail" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Parentesco</Label>
              <Input id="relationship" name="relationship" placeholder="Ex.: filho(a)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium">Falecido(a)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deceasedName">Nome completo *</Label>
              <Input id="deceasedName" name="deceasedName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfDeath">Data do óbito</Label>
              <Input id="dateOfDeath" name="dateOfDeath" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeOfDeath">Local do óbito</Label>
              <Input id="placeOfDeath" name="placeOfDeath" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-medium">Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de serviço *</Label>
              <select
                id="serviceType"
                name="serviceType"
                required
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="velorio">Velório</option>
                <option value="sepultamento">Sepultamento</option>
                <option value="cremacao">Cremação</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Registrando…" : "Registrar caso"}
          </Button>
        </div>
      </form>
    </div>
  );
}
