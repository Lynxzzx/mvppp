"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { parseCsv, rowsToObjects } from "@/lib/import/csv";
import {
  IMPORT_ENTITIES,
  suggestMapping,
  type ImportEntity,
} from "@/lib/import/schema";
import type { Role } from "@/lib/auth";

type Step = "entity" | "upload" | "map" | "done";

export function ImportWizard({ role }: { role: Role }) {
  const entities = useMemo(() => {
    return IMPORT_ENTITIES.filter((e) => {
      if (e.id === "estoque" && role === "financeiro") return false;
      if (e.id === "contratos" && role === "atendente") return false;
      return true;
    });
  }, [role]);

  const [step, setStep] = useState<Step>("entity");
  const [entity, setEntity] = useState<ImportEntity | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    imported: number;
    failed: number;
    results: { row: number; ok: boolean; code?: string; error?: string }[];
  } | null>(null);

  const def = entity ? IMPORT_ENTITIES.find((e) => e.id === entity) : null;

  async function onFile(file: File) {
    if (!entity) return;
    const text = await file.text();
    const table = parseCsv(text);
    if (!table.headers.length || !table.rows.length) {
      toast.error("Arquivo vazio ou inválido. Exporte do Excel como CSV (UTF-8).");
      return;
    }
    if (table.rows.length > 500) {
      toast.error("Máximo de 500 linhas por importação.");
      return;
    }
    setFileName(file.name);
    setHeaders(table.headers);
    setRows(rowsToObjects(table));
    setMapping(suggestMapping(table.headers, entity));
    setStep("map");
  }

  async function confirmImport() {
    if (!entity || !def) return;
    const mapped = new Set(Object.values(mapping).filter(Boolean));
    for (const f of def.fields.filter((x) => x.required)) {
      if (!mapped.has(f.key)) {
        toast.error(`Mapeie a coluna: ${f.label}`);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, mapping, rows }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Falha na importação");
        return;
      }
      setSummary(data);
      setStep("done");
      toast.success(`${data.imported} registro(s) importado(s)`);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("entity");
    setEntity(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setFileName("");
    setSummary(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {step === "entity" && (
        <div className="grid gap-3">
          {entities.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setEntity(e.id);
                setStep("upload");
              }}
              className="rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-gold/40 hover:bg-accent/40"
            >
              <p className="font-display text-lg tracking-tight">{e.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
            </button>
          ))}
        </div>
      )}

      {step === "upload" && def && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base tracking-tight">
              Enviar planilha — {def.label}
            </CardTitle>
            <CardDescription>
              Aceita CSV (vírgula ou ponto-e-vírgula). No Excel: Arquivo → Salvar como → CSV UTF-8.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center hover:bg-muted/40">
              <FileUp className="size-8 text-gold" aria-hidden />
              <span className="text-sm text-muted-foreground">
                Clique para escolher o arquivo .csv
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onFile(f);
                }}
              />
            </label>
            <Button type="button" variant="ghost" onClick={() => setStep("entity")}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "map" && def && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base tracking-tight">
              Conferir colunas
            </CardTitle>
            <CardDescription>
              Arquivo: {fileName} · {rows.length} linha(s). Ajustamos o mapeamento
              automaticamente — confirme ou corrija.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {def.fields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-center"
                >
                  <Label htmlFor={`map-${field.key}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  <select
                    id={`map-${field.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={
                      Object.entries(mapping).find(([, k]) => k === field.key)?.[0] ?? ""
                    }
                    onChange={(e) => {
                      const header = e.target.value;
                      setMapping((prev) => {
                        const next = { ...prev };
                        for (const [h, k] of Object.entries(next)) {
                          if (k === field.key) delete next[h];
                        }
                        if (header) next[header] = field.key;
                        return next;
                      });
                    }}
                  >
                    <option value="">— ignorar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {headers.slice(0, 6).map((h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((r, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {headers.slice(0, 6).map((h) => (
                        <td key={h} className="max-w-[10rem] truncate px-2 py-1.5">
                          {r[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void confirmImport()} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Importar {rows.length} linha(s)
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("upload")}>
                Outro arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base tracking-tight">
              <CheckCircle2 className="size-5 text-sage" aria-hidden />
              Importação concluída
            </CardTitle>
            <CardDescription>
              {summary.imported} ok · {summary.failed} com erro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.failed > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {summary.results
                  .filter((r) => !r.ok)
                  .slice(0, 40)
                  .map((r) => (
                    <li key={r.row}>
                      Linha {r.row}: {r.error}
                    </li>
                  ))}
              </ul>
            )}
            <Button type="button" onClick={reset}>
              Nova importação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
