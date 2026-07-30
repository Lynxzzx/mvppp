"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BankCnabPanel({ canEditBank }: { canEditBank: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retornoLoading, setRetornoLoading] = useState(false);
  const [form, setForm] = useState({
    bankCode: "237",
    agency: "",
    account: "",
    wallet: "09",
    beneficiaryName: "",
    beneficiaryDocument: "",
  });

  useEffect(() => {
    fetch("/api/billing/bank-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.bankSettings) setForm((f) => ({ ...f, ...d.bankSettings }));
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveBank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/billing/bank-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Dados bancários salvos");
    } finally {
      setSaving(false);
    }
  }

  async function downloadRemessa(todas: boolean) {
    const res = await fetch(`/api/invoices/remessa${todas ? "?todas=1" : ""}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Não foi possível gerar a remessa");
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    const name = match?.[1] ?? "remessa.rem";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Remessa baixada");
    router.refresh();
  }

  async function onRetorno(file: File) {
    setRetornoLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/invoices/retorno", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Falha ao processar retorno");
        return;
      }
      toast.success(
        `Retorno: ${data.matched} baixa(s) · ${data.alreadyPaid} já paga(s) · ${data.unmatched} sem match`
      );
      router.refresh();
    } finally {
      setRetornoLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando dados bancários…</p>;
  }

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base font-medium tracking-tight">
            <Building2 className="size-4 text-gold" aria-hidden />
            Dados bancários (CNAB)
          </CardTitle>
          <CardDescription>
            Usados na geração do arquivo remessa. Ajuste conforme o convênio do banco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveBank} className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["bankCode", "Banco (cód.)"],
                ["agency", "Agência"],
                ["account", "Conta"],
                ["wallet", "Carteira"],
                ["beneficiaryName", "Beneficiário"],
                ["beneficiaryDocument", "CNPJ"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className={key === "beneficiaryName" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  disabled={!canEditBank}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  required={key !== "wallet" && key !== "beneficiaryDocument"}
                />
              </div>
            ))}
            {canEditBank && (
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  <Save data-icon="inline-start" />
                  Salvar
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-medium tracking-tight">
            Remessa e retorno
          </CardTitle>
          <CardDescription>
            Baixe a remessa das cobranças pendentes e importe o retorno do banco para
            baixar automaticamente — sem lançamento manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={() => void downloadRemessa(false)}>
            <Download data-icon="inline-start" />
            Gerar remessa (novas)
          </Button>
          <Button type="button" variant="ghost" onClick={() => void downloadRemessa(true)}>
            <Download data-icon="inline-start" />
            Regenerar remessa (todas pendentes)
          </Button>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-6 text-sm hover:bg-muted/40">
            {retornoLoading ? "Processando…" : (
              <>
                <Upload className="size-4 text-gold" aria-hidden />
                Enviar arquivo retorno (.ret / .txt)
              </>
            )}
            <input
              type="file"
              accept=".ret,.txt,.retorno,.cnab"
              className="sr-only"
              disabled={retornoLoading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void onRetorno(f);
              }}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
