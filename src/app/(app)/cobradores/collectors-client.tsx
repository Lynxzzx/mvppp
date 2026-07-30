"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
  expiresAt?: string;
  url: string;
};

export function CollectorsClient({ canCreate }: { canCreate: boolean }) {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/collectors");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao listar");
        return;
      }
      setList(data.collectors ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/collectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined, expiresInDays: 90 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao criar");
        return;
      }
      toast.success("Link gerado");
      setName("");
      setPhone("");
      if (data.url) {
        await navigator.clipboard.writeText(data.url).catch(() => null);
        toast.message("Link copiado para a área de transferência");
      }
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Desativar este link de cobrador?")) return;
    const res = await fetch(`/api/collectors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao desativar");
      return;
    }
    toast.success("Link desativado");
    await load();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base tracking-tight">
              Novo cobrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cname">Nome</Label>
                <Input
                  id="cname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex.: João — rota zona norte"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cphone">Telefone (opcional)</Label>
                <Input
                  id="cphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Plus data-icon="inline-start" />
                  )}
                  Gerar link
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">
            Links ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cobrador cadastrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {c.name}{" "}
                      {!c.active && (
                        <span className="text-xs text-muted-foreground">(inativo)</span>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {c.url}
                    </p>
                    {c.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expira em {formatDate(c.expiresAt)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!c.active}
                    onClick={async () => {
                      await navigator.clipboard.writeText(c.url);
                      toast.success("Link copiado");
                    }}
                  >
                    <Copy data-icon="inline-start" />
                    Copiar
                  </Button>
                  {canCreate && c.active && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Desativar"
                      onClick={() => void deactivate(c.id)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            O cobrador abre o link no celular, vê as parcelas e toca em &quot;Recebi&quot;
            para baixar no sistema na hora.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
