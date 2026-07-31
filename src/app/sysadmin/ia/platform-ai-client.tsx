"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Payload = {
  openRouterApiKeyMasked: string | null;
  hasOpenRouterApiKey: boolean;
  openRouterDefaultModel: string;
  openRouterRateLimitPerHour: number | null;
  resolved: {
    apiKeySource: "database" | "env" | "none";
    apiKeyMasked: string | null;
    defaultModel: string;
    defaultModelSource: string;
    rateLimitPerHour: number;
    configured: boolean;
  };
  builtinDefaultModel: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

const SOURCE_LABEL = {
  database: "Painel sysadmin",
  env: "Variável de ambiente",
  none: "Não configurada",
  builtin: "Padrão do código",
} as const;

export function PlatformAiSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [rateLimit, setRateLimit] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/ai-settings");
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao carregar");
        return;
      }
      setData(json as Payload);
      setDefaultModel(json.openRouterDefaultModel || "");
      setRateLimit(
        json.openRouterRateLimitPerHour != null
          ? String(json.openRouterRateLimitPerHour)
          : ""
      );
      setApiKey("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(opts?: { clearKey?: boolean }) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        openRouterDefaultModel: defaultModel.trim() || null,
        openRouterRateLimitPerHour: rateLimit.trim()
          ? Number(rateLimit.trim())
          : null,
      };
      if (opts?.clearKey) body.clearApiKey = true;
      else if (apiKey.trim()) body.openRouterApiKey = apiKey.trim();

      const res = await fetch("/api/platform/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Configuração de IA salva");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">
            Status efetivo
          </CardTitle>
          <CardDescription>
            Como a IA está resolvida agora (painel &gt; env &gt; padrão).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">API key:</span>
            <Badge variant={data.resolved.configured ? "outline" : "destructive"}>
              {data.resolved.configured ? "OK" : "Ausente"}
            </Badge>
            <span className="font-mono text-xs">
              {data.resolved.apiKeyMasked ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({SOURCE_LABEL[data.resolved.apiKeySource]})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Modelo padrão:</span>
            <code className="font-mono text-xs">{data.resolved.defaultModel}</code>
            <span className="text-xs text-muted-foreground">
              (
              {SOURCE_LABEL[
                data.resolved.defaultModelSource as keyof typeof SOURCE_LABEL
              ] ?? data.resolved.defaultModelSource}
              )
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Limite/hora por funerária:</span>
            <span className="font-mono text-xs">{data.resolved.rateLimitPerHour}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base tracking-tight">
            <KeyRound className="size-4 text-gold" aria-hidden />
            Credenciais OpenRouter
          </CardTitle>
          <CardDescription>
            A chave é criptografada no banco com o AUTH_SECRET. Deixe em branco
            para manter a atual. Builtin:{" "}
            <code className="font-mono text-xs">{data.builtinDefaultModel}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="or-key">API key</Label>
              <Input
                id="or-key"
                type="password"
                autoComplete="off"
                placeholder={
                  data.hasOpenRouterApiKey
                    ? `Salva: ${data.openRouterApiKeyMasked}`
                    : "sk-or-v1-…"
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="or-model">Modelo padrão (fallback)</Label>
              <Input
                id="or-model"
                placeholder={data.builtinDefaultModel}
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="or-limit">Limite de chamadas / hora / funerária</Label>
              <Input
                id="or-limit"
                type="number"
                min={1}
                max={10000}
                placeholder="60"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                Salvar
              </Button>
              {data.hasOpenRouterApiKey && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    if (confirm("Remover a chave salva no painel? (env continua valendo)")) {
                      void save({ clearKey: true });
                    }
                  }}
                >
                  <Trash2 data-icon="inline-start" />
                  Remover chave do painel
                </Button>
              )}
            </div>
            {data.updatedBy && (
              <p className="text-xs text-muted-foreground">
                Última alteração: {data.updatedBy}
                {data.updatedAt
                  ? ` · ${new Date(data.updatedAt).toLocaleString("pt-BR")}`
                  : ""}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
