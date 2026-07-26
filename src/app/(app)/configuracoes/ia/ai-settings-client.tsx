"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { AiFeature } from "@/lib/ai/features";

type FeatureRow = {
  feature: AiFeature;
  label: string;
  description: string;
  model: string | null;
  note: string;
  globalModel: string | null;
  effectiveModel: string;
  source: "tenant" | "global" | "env";
};

type OrModel = {
  id: string;
  name: string;
  provider: string;
  recommended: boolean;
  pricing?: { prompt?: string; completion?: string };
};

const SOURCE_LABEL = {
  tenant: "Configurado nesta funerária",
  global: "Padrão da plataforma",
  env: "Fallback do ambiente",
} as const;

function formatPrice(p?: string) {
  if (!p) return null;
  const n = Number(p);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return "grátis";
  // OpenRouter pricing is USD per token
  const perM = n * 1_000_000;
  if (perM < 0.01) return `~$${perM.toFixed(4)}/1M`;
  return `~$${perM.toFixed(2)}/1M tokens`;
}

export function AiSettingsClient() {
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [models, setModels] = useState<OrModel[]>([]);
  const [defaultModel, setDefaultModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, { model: string; note: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [settingsRes, modelsRes] = await Promise.all([
          fetch("/api/ai/settings"),
          fetch("/api/ai/models"),
        ]);
        const settingsData = await settingsRes.json().catch(() => null);
        const modelsData = await modelsRes.json().catch(() => null);

        if (!settingsRes.ok) {
          toast.error(settingsData?.error ?? "Erro ao carregar configurações");
          return;
        }
        if (!modelsRes.ok) {
          toast.error(modelsData?.error ?? "Erro ao listar modelos do OpenRouter");
        }

        if (cancelled) return;
        const features = (settingsData?.features ?? []) as FeatureRow[];
        setRows(features);
        setDefaultModel(settingsData?.defaultModel ?? "");
        setModels((modelsData?.models ?? []) as OrModel[]);
        const next: Record<string, { model: string; note: string }> = {};
        for (const f of features) {
          next[f.feature] = {
            model: f.model || f.effectiveModel,
            note: f.note || "",
          };
        }
        setDrafts(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredModels = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  }, [models, filter]);

  async function save(feature: AiFeature) {
    const draft = drafts[feature];
    if (!draft?.model) {
      toast.error("Selecione um modelo");
      return;
    }
    setSaving(feature);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          model: draft.model,
          note: draft.note,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao salvar");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.feature === feature
            ? {
                ...r,
                model: draft.model,
                note: draft.note,
                effectiveModel: draft.model,
                source: "tenant",
              }
            : r
        )
      );
      toast.success("Modelo salvo");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando modelos e configurações…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-medium tracking-tight">
            Catálogo OpenRouter
          </CardTitle>
          <CardDescription>
            Filtre a lista abaixo e escolha o modelo em cada funcionalidade.
            Modelos com badge <span className="text-gold">Recomendado</span> já
            foram validados para o Veluxa. Fallback do ambiente:{" "}
            <code className="font-mono text-xs">{defaultModel || "—"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="model-filter" className="sr-only">
            Filtrar modelos
          </Label>
          <Input
            id="model-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por nome, provedor ou id…"
            className="max-w-md"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {filteredModels.length} modelo(s) na lista filtrada
            {models.length ? ` · ${models.length} no total` : ""}.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rows.map((row) => {
          const draft = drafts[row.feature] ?? {
            model: row.effectiveModel,
            note: row.note,
          };
          const selected = models.find((m) => m.id === draft.model);
          return (
            <Card key={row.feature}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-display text-base font-medium tracking-tight">
                      <Sparkles className="size-4 text-gold" aria-hidden />
                      {row.label}
                    </CardTitle>
                    <CardDescription className="mt-1">{row.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{SOURCE_LABEL[row.source]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`model-${row.feature}`}>Modelo</Label>
                  <select
                    id={`model-${row.feature}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    value={draft.model}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [row.feature]: { ...draft, model: e.target.value },
                      }))
                    }
                  >
                    {!filteredModels.some((m) => m.id === draft.model) && draft.model && (
                      <option value={draft.model}>{draft.model} (atual)</option>
                    )}
                    {filteredModels.map((m) => {
                      const prompt = formatPrice(m.pricing?.prompt);
                      const label = [
                        m.recommended ? "★ " : "",
                        m.name,
                        `(${m.provider})`,
                        prompt ? `· ${prompt}` : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <option key={m.id} value={m.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {selected?.recommended && (
                    <Badge className="bg-gold/15 text-gold hover:bg-gold/15">
                      Recomendado
                    </Badge>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">{draft.model}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`note-${row.feature}`}>Nota (opcional)</Label>
                  <Textarea
                    id={`note-${row.feature}`}
                    rows={2}
                    value={draft.note}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [row.feature]: { ...draft, note: e.target.value },
                      }))
                    }
                    placeholder='Ex.: "mais barato, ótimo para resumos curtos"'
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => save(row.feature)}
                    disabled={saving === row.feature}
                  >
                    {saving === row.feature ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
