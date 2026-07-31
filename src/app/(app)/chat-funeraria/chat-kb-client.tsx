"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  FileUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type FaqItem = { id?: string; question: string; answer: string };
type DocItem = {
  id?: string;
  fileName: string;
  storageUrl: string;
  extractedChars: number;
};

type KbPayload = {
  slug: string;
  publicUrl: string;
  whatsappNumber: string;
  faq: FaqItem[];
  pricingInfo: string;
  policies: string;
  uploadedDocuments: DocItem[];
  isActive: boolean;
  welcomeMessage: string;
};

export function ChatKbClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [data, setData] = useState<KbPayload | null>(null);

  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [welcome, setWelcome] = useState("");
  const [pricing, setPricing] = useState("");
  const [policies, setPolicies] = useState("");
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [isActive, setIsActive] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat-kb");
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao carregar");
        return;
      }
      const kb = json as KbPayload;
      setData(kb);
      setSlug(kb.slug);
      setWhatsapp(kb.whatsappNumber);
      setWelcome(kb.welcomeMessage);
      setPricing(kb.pricingInfo);
      setPolicies(kb.policies);
      setFaq(kb.faq.length ? kb.faq : [{ question: "", answer: "" }]);
      setIsActive(kb.isActive);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const cleanFaq = faq
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question && f.answer);

      const res = await fetch("/api/chat-kb", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          whatsappNumber: whatsapp,
          welcomeMessage: welcome,
          pricingInfo: pricing,
          policies,
          faq: cleanFaq,
          isActive,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Chat da funerária salvo");
      setData(json as KbPayload);
      setSlug(json.slug);
      setIsActive(json.isActive);
    } finally {
      setSaving(false);
    }
  }

  async function importPlans() {
    setImporting(true);
    try {
      const res = await fetch("/api/chat-kb/import-plans", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Não foi possível importar");
        return;
      }
      setPricing(json.pricingInfo ?? "");
      toast.success("Resumo de planos importado — revise antes de publicar");
    } finally {
      setImporting(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const b64 = result.includes(",") ? result.split(",")[1]! : result;
          resolve(b64);
        };
        reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/chat-kb/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          dataBase64,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Upload falhou");
        return;
      }
      toast.success("Documento processado");
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function removeDoc(id: string) {
    if (!confirm("Remover este documento da base?")) return;
    const res = await fetch(`/api/chat-kb/documents/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(json?.error ?? "Erro ao remover");
      return;
    }
    toast.success("Documento removido");
    await load();
  }

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando…
      </div>
    );
  }

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/chat/${slug || data.slug}`
      : data.publicUrl;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base tracking-tight">
            <MessageCircle className="size-4 text-gold" aria-hidden />
            Link público
          </CardTitle>
          <CardDescription>
            Divulgue este link no Instagram, site ou status do WhatsApp. O chat só
            responde com o que você cadastrar abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug do link</Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">/chat/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-[var(--gold)]"
              />
              Chat ativo
              {isActive ? (
                <Badge variant="outline">Publicado</Badge>
              ) : (
                <Badge variant="destructive">Desligado</Badge>
              )}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{publicUrl}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                toast.success("Link copiado");
              }}
            >
              <Copy data-icon="inline-start" />
              Copiar
            </Button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <ExternalLink data-icon="inline-start" />
              Abrir
            </a>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa">WhatsApp de atendimento (obrigatório para ativar)</Label>
            <Input
              id="wa"
              placeholder="11999998888"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="welcome">Mensagem de boas-vindas</Label>
            <Textarea
              id="welcome"
              rows={2}
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">
            Preços e planos
          </CardTitle>
          <CardDescription>
            Texto que a IA usará para responder sobre valores. Pode importar um
            rascunho a partir dos contratos ativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={8}
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            placeholder="Ex.: Plano Essencial — a partir de R$ … (sujeito a confirmação)"
          />
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => void importPlans()}
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus data-icon="inline-start" />
            )}
            Importar resumo dos Contratos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">Políticas</CardTitle>
          <CardDescription>
            Horário de atendimento, documentos necessários, cobertura geográfica, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            placeholder="Ex.: Atendimento 24h. Documentos: RG, CPF…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">
            Perguntas frequentes
          </CardTitle>
          <CardDescription>
            Pares pergunta/resposta — a IA prioriza estas respostas quando couber.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faq.map((item, idx) => (
            <div key={idx} className="space-y-2 border-b border-border pb-4 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <Label>Pergunta {idx + 1}</Label>
                {faq.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFaq((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                )}
              </div>
              <Input
                value={item.question}
                onChange={(e) =>
                  setFaq((prev) =>
                    prev.map((f, i) => (i === idx ? { ...f, question: e.target.value } : f))
                  )
                }
              />
              <Textarea
                rows={2}
                value={item.answer}
                onChange={(e) =>
                  setFaq((prev) =>
                    prev.map((f, i) => (i === idx ? { ...f, answer: e.target.value } : f))
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setFaq((prev) => [...prev, { question: "", answer: "" }])}
          >
            <Plus data-icon="inline-start" />
            Adicionar FAQ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base tracking-tight">Documentos</CardTitle>
          <CardDescription>
            PDF ou TXT (até 2 MB). O texto extraído entra no contexto da IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={cn(
                buttonVariants({ variant: "outline" }),
                uploading && "pointer-events-none opacity-50",
                "cursor-pointer"
              )}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileUp data-icon="inline-start" />
              )}
              Enviar arquivo
              <input
                type="file"
                accept=".pdf,.txt,.md,.csv,application/pdf,text/plain"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void onUpload(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {(data.uploadedDocuments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.uploadedDocuments.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {d.fileName}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({d.extractedChars} chars extraídos)
                    </span>
                  </span>
                  {d.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void removeDoc(d.id!)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Salvar tudo
        </Button>
      </div>
    </div>
  );
}
