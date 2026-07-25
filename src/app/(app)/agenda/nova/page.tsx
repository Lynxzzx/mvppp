"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CaseOption = {
  _id: string;
  code: string;
  deceased: { name: string };
  serviceType: string;
};

function NovaCerimoniaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => (r.ok ? r.json() : { cases: [] }))
      .then((d) => setCases(d.cases as CaseOption[]))
      .catch(() => toast.error("Erro ao carregar casos"));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const date = String(f.get("date"));
    const res = await fetch("/api/ceremonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: f.get("caseId"),
        type: f.get("type"),
        startsAt: `${date}T${f.get("startTime")}`,
        endsAt: `${date}T${f.get("endTime")}`,
        room: f.get("room") || undefined,
        vehicle: f.get("vehicle") || undefined,
        notes: f.get("notes") || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao agendar cerimônia");
      return;
    }
    toast.success("Cerimônia agendada");
    router.push("/agenda");
    router.refresh();
  }

  const selectClass =
    "h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring";

  return (
    <div className="animate-enter mx-auto max-w-2xl">
      <PageHeader
        title="Nova cerimônia"
        description="Sala e veículo são verificados automaticamente contra conflitos de horário."
      />
      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="caseId">Caso *</Label>
              <select
                id="caseId"
                name="caseId"
                required
                defaultValue={params.get("caso") ?? ""}
                className={selectClass}
              >
                <option value="" disabled>
                  Selecione o caso…
                </option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.deceased?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <select id="type" name="type" required className={selectClass}>
                <option value="velorio">Velório</option>
                <option value="sepultamento">Sepultamento</option>
                <option value="cremacao">Cremação</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Início *</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim *</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Sala</Label>
              <Input id="room" name="room" placeholder="Ex.: Sala 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Input id="vehicle" name="vehicle" placeholder="Ex.: Van ABC-1234" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Agendando…" : "Agendar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NovaCerimoniaPage() {
  return (
    <Suspense>
      <NovaCerimoniaForm />
    </Suspense>
  );
}
