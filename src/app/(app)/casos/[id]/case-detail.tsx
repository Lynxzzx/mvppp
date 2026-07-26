"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Copy, Download, FileText, Link2, Loader2, Plus, ShieldOff, Sparkles, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Role } from "@/lib/auth";
import type { ServiceType } from "@/models/Case";

export interface CaseData {
  _id: string;
  code: string;
  status: "novo" | "em_andamento" | "encerrado";
  serviceType: ServiceType;
  assigneeName?: string;
  createdAt: string;
  anonymizedAt?: string;
  family: { name: string; phone?: string; email?: string; relationship?: string };
  deceased: { name: string; dateOfBirth?: string; dateOfDeath?: string; placeOfDeath?: string };
  checklist: { _id: string; label: string; done: boolean }[];
  timeline: { _id: string; kind: string; text: string; userName?: string; at: string }[];
  documents: {
    _id: string; name: string; mimeType: string; size: number;
    visibleToFamily: boolean; uploadedAt: string;
  }[];
}

async function api(url: string, method: string, body?: unknown): Promise<boolean> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    toast.error(data?.error ?? "Erro na operação");
    return false;
  }
  return true;
}

export function CaseDetail({ data, role }: { data: CaseData; role: Role }) {
  const router = useRouter();
  const canEdit = (role === "admin" || role === "atendente") && !data.anonymizedAt;
  const isAdmin = role === "admin";
  const [note, setNote] = useState("");
  const [newItem, setNewItem] = useState("");
  const [portalLink, setPortalLink] = useState<{ url: string; expiresAt: string | null } | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiMeta, setAiMeta] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<"obituary-draft" | "case-summary" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runAi(feature: "obituary-draft" | "case-summary") {
    setAiLoading(feature);
    setAiMeta(null);
    try {
      const res = await fetch(`/api/cases/${data._id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error ?? "Falha na geração");
        return;
      }
      setAiText(payload.content ?? "");
      setAiMeta(
        [
          payload.model,
          payload.usedFallback ? "fallback automático" : null,
        ]
          .filter(Boolean)
          .join(" · ")
      );
      toast.success(feature === "obituary-draft" ? "Necrológio gerado" : "Resumo gerado");
    } finally {
      setAiLoading(null);
    }
  }

  useEffect(() => {
    fetch(`/api/cases/${data._id}/portal-link`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPortalLink(d?.link ?? null))
      .catch(() => null);
  }, [data._id]);

  async function setStatus(status: string) {
    if (await api(`/api/cases/${data._id}`, "PATCH", { status })) router.refresh();
  }

  async function toggleItem(itemId: string, done: boolean) {
    if (await api(`/api/cases/${data._id}/checklist`, "PATCH", { itemId, done })) router.refresh();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (await api(`/api/cases/${data._id}/checklist`, "POST", { label: newItem.trim() })) {
      setNewItem("");
      router.refresh();
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    if (await api(`/api/cases/${data._id}/notes`, "POST", { text: note.trim() })) {
      setNote("");
      router.refresh();
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo acima de 2MB");
      return;
    }
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    if (
      await api(`/api/cases/${data._id}/documents`, "POST", {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64,
      })
    ) {
      toast.success("Documento anexado");
      router.refresh();
    }
  }

  async function toggleDocVisibility(docId: string, visibleToFamily: boolean) {
    if (await api(`/api/cases/${data._id}/documents/${docId}`, "PATCH", { visibleToFamily })) {
      router.refresh();
    }
  }

  async function generatePortalLink() {
    const res = await fetch(`/api/cases/${data._id}/portal-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const d = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(d?.error ?? "Erro ao gerar link");
      return;
    }
    setPortalLink(d.link);
    toast.success("Link do portal gerado");
  }

  async function copyPortalLink() {
    if (!portalLink) return;
    await navigator.clipboard.writeText(portalLink.url);
    toast.success("Link copiado");
  }

  async function anonymize() {
    if (!confirm("Anonimizar dados pessoais deste caso? Esta ação é irreversível (LGPD).")) return;
    if (await api(`/api/cases/${data._id}/anonymize`, "POST", {})) {
      toast.success("Caso anonimizado");
      router.refresh();
    }
  }

  async function removeCase() {
    if (!confirm(`Excluir o caso ${data.code}? A exclusão fica registrada em auditoria.`)) return;
    if (await api(`/api/cases/${data._id}`, "DELETE")) {
      toast.success("Caso excluído");
      router.push("/casos");
      router.refresh();
    }
  }

  const doneCount = data.checklist.filter((i) => i.done).length;

  return (
    <div className="animate-enter">
      <PageHeader
        title={data.deceased.name}
        description={`Caso ${data.code} · ${SERVICE_TYPE_LABEL[data.serviceType]} · criado em ${formatDate(data.createdAt)}`}
      >
        <StatusBadge status={data.status} className="text-sm" />
        {canEdit && data.status === "novo" && (
          <Button size="sm" onClick={() => setStatus("em_andamento")}>Iniciar atendimento</Button>
        )}
        {canEdit && data.status === "em_andamento" && (
          <Button size="sm" onClick={() => setStatus("encerrado")}>Encerrar caso</Button>
        )}
        {canEdit && data.status === "encerrado" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("em_andamento")}>Reabrir</Button>
        )}
      </PageHeader>

      {data.anonymizedAt && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Dados pessoais anonimizados em {formatDateTime(data.anonymizedAt)} (LGPD).
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Dados */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-medium">Família responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{data.family.name}</p>
                {data.family.relationship && (
                  <p className="text-muted-foreground">{data.family.relationship}</p>
                )}
                {data.family.phone && <p className="font-mono text-xs">{data.family.phone}</p>}
                {data.family.email && <p className="font-mono text-xs">{data.family.email}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-medium">Falecido(a)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{data.deceased.name}</p>
                <p className="text-muted-foreground">
                  Óbito: <span className="font-mono text-xs">{formatDate(data.deceased.dateOfDeath)}</span>
                  {data.deceased.placeOfDeath ? ` · ${data.deceased.placeOfDeath}` : ""}
                </p>
                <p className="text-muted-foreground">
                  Responsável interno: {data.assigneeName ?? "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-medium">
                Checklist{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {doneCount}/{data.checklist.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.checklist.map((item) => (
                <label
                  key={item._id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={!canEdit}
                    onChange={(e) => toggleItem(item._id, e.target.checked)}
                    className="size-4 accent-(--gold)"
                  />
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>
                    {item.label}
                  </span>
                </label>
              ))}
              {canEdit && (
                <form onSubmit={addItem} className="flex gap-2 pt-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Adicionar tarefa…"
                    aria-label="Nova tarefa do checklist"
                  />
                  <Button type="submit" variant="outline" size="icon" aria-label="Adicionar">
                    <Plus />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-medium">Histórico de interações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!data.anonymizedAt && (
                <form onSubmit={addNote} className="space-y-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Registrar interação (ligação, decisão da família, observação…)"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!note.trim()}>Registrar</Button>
                  </div>
                </form>
              )}
              <ol className="space-y-3">
                {[...data.timeline].reverse().map((t) => (
                  <li key={t._id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    <div>
                      <p>{t.text}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(t.at)}
                        {t.userName ? ` · ${t.userName}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Agenda do caso */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-medium">Cerimônia</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/agenda/nova?caso=${data._id}`} />}
                >
                  Agendar cerimônia
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assistente de IA */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base font-medium">
                  <Sparkles className="size-4 text-gold" aria-hidden />
                  Assistente de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!!aiLoading}
                    onClick={() => runAi("obituary-draft")}
                  >
                    {aiLoading === "obituary-draft" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <FileText data-icon="inline-start" />
                    )}
                    Gerar necrológio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!!aiLoading}
                    onClick={() => runAi("case-summary")}
                  >
                    {aiLoading === "case-summary" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles data-icon="inline-start" />
                    )}
                    Resumir caso
                  </Button>
                </div>
                {aiText && (
                  <div className="space-y-2">
                    <Textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      rows={8}
                      aria-label="Texto gerado pela IA"
                    />
                    {aiMeta && (
                      <p className="font-mono text-[11px] text-muted-foreground">{aiMeta}</p>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(aiText);
                        toast.success("Texto copiado");
                      }}
                    >
                      <Copy data-icon="inline-start" /> Copiar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portal da família */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-medium">Portal da família</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {portalLink ? (
                <>
                  <p className="break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                    {portalLink.url}
                  </p>
                  {portalLink.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expira em {formatDate(portalLink.expiresAt)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyPortalLink}>
                      <Copy data-icon="inline-start" /> Copiar
                    </Button>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={generatePortalLink}>
                        <Link2 data-icon="inline-start" /> Regenerar
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    A família acompanha o andamento por um link único, sem senha.
                  </p>
                  {canEdit && (
                    <Button size="sm" onClick={generatePortalLink}>
                      <Link2 data-icon="inline-start" /> Gerar link
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-medium">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum documento anexado (certidão de óbito, autorizações…).
                </p>
              )}
              {data.documents.map((doc) => (
                <div key={doc._id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate" title={doc.name}>{doc.name}</span>
                    <a
                      href={`/api/cases/${data._id}/documents/${doc._id}`}
                      className="text-gold hover:text-gold-bright"
                      aria-label={`Baixar ${doc.name}`}
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                  {canEdit && (
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={doc.visibleToFamily}
                        onChange={(e) => toggleDocVisibility(doc._id, e.target.checked)}
                        className="size-3.5 accent-(--gold)"
                      />
                      Visível no portal da família
                    </label>
                  )}
                </div>
              ))}
              {canEdit && (
                <>
                  <input ref={fileRef} type="file" hidden onChange={uploadFile} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Plus data-icon="inline-start" /> Anexar documento (até 2MB)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ações administrativas */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-medium">Administração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.status === "encerrado" && !data.anonymizedAt && (
                  <Button variant="outline" size="sm" className="w-full" onClick={anonymize}>
                    <ShieldOff data-icon="inline-start" /> Anonimizar dados (LGPD)
                  </Button>
                )}
                <Button variant="destructive" size="sm" className="w-full" onClick={removeCase}>
                  <Trash2 data-icon="inline-start" /> Excluir caso
                </Button>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle2 className="mr-1 inline size-3" aria-hidden />
                  Ações críticas ficam na trilha de auditoria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
