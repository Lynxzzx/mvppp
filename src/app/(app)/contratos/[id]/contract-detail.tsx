"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Receipt, Undo2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDate } from "@/lib/format";
import type { Role } from "@/lib/auth";

export interface ContractData {
  _id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerDocument?: string;
  planName: string;
  totalCents: number;
  installmentsCount: number;
  adjustmentRule?: string;
  status: "ativo" | "quitado" | "cancelado";
  caseId?: string;
  caseCode?: string;
  createdAt: string;
  installments: {
    _id: string;
    number: number;
    dueDate: string;
    amountCents: number;
    status: "pendente" | "pago" | "atrasado";
    paidAt?: string;
  }[];
}

export function ContractDetail({ data, role }: { data: ContractData; role: Role }) {
  const router = useRouter();
  const canEdit = role === "admin" || role === "financeiro";
  const [cases, setCases] = useState<{ _id: string; code: string; deceased: { name: string } }[]>([]);
  const [linkCaseId, setLinkCaseId] = useState("");

  useEffect(() => {
    if (!canEdit || data.caseId) return;
    fetch("/api/cases")
      .then((r) => (r.ok ? r.json() : { cases: [] }))
      .then((d) => setCases(d.cases))
      .catch(() => null);
  }, [canEdit, data.caseId]);

  async function patch(body: unknown, url = `/api/contracts/${data._id}`): Promise<boolean> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Erro na operação");
      return false;
    }
    return true;
  }

  async function setInstallment(installmentId: string, status: "pago" | "pendente") {
    if (
      await patch({ installmentId, status }, `/api/contracts/${data._id}/installments`)
    ) {
      router.refresh();
    }
  }

  async function generateInvoice(installmentNumber: number) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: data._id, installmentNumber }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Erro ao gerar cobrança");
      return;
    }
    toast.success("Cobrança gerada — veja em Faturamento");
    router.refresh();
  }

  async function linkCase(e: React.FormEvent) {
    e.preventDefault();
    if (!linkCaseId) return;
    if (await patch({ caseId: linkCaseId })) {
      toast.success("Contrato vinculado ao caso");
      router.refresh();
    }
  }

  async function cancelContract() {
    if (!confirm(`Cancelar o contrato ${data.code}? A alteração fica registrada em auditoria.`)) return;
    if (await patch({ status: "cancelado" })) {
      toast.success("Contrato cancelado");
      router.refresh();
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const paid = data.installments.filter((i) => i.status === "pago").length;

  return (
    <div className="animate-enter">
      <PageHeader
        title={data.customerName}
        description={`Contrato ${data.code} · ${data.planName} · criado em ${formatDate(data.createdAt)}`}
      >
        <StatusBadge status={data.status} className="text-sm" />
        {canEdit && data.status === "ativo" && (
          <Button size="sm" variant="destructive" onClick={cancelContract}>
            <XCircle data-icon="inline-start" /> Cancelar contrato
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Valor total</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-xl">{formatBRL(data.totalCents)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Parcelas pagas</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-xl">
              {paid}<span className="text-sm text-muted-foreground">/{data.installments.length}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Reajuste</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{data.adjustmentRule ?? "Sem reajuste"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Caso vinculado</CardTitle></CardHeader>
          <CardContent>
            {data.caseId ? (
              <Link href={`/casos/${data.caseId}`} className="font-mono text-sm text-gold hover:underline">
                {data.caseCode}
              </Link>
            ) : canEdit && data.status === "ativo" ? (
              <form onSubmit={linkCase} className="flex gap-2">
                <select
                  value={linkCaseId}
                  onChange={(e) => setLinkCaseId(e.target.value)}
                  aria-label="Selecionar caso para vincular"
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
                >
                  <option value="">Vincular a caso…</option>
                  {cases.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} — {c.deceased?.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="outline" disabled={!linkCaseId}>
                  Vincular
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pago em</TableHead>
              {canEdit && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.installments.map((i) => {
              const overdue = i.status === "pendente" && i.dueDate.slice(0, 10) < today;
              return (
                <TableRow key={i._id}>
                  <TableCell className="font-mono text-xs">
                    {i.number}/{data.installments.length}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatBRL(i.amountCents)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={overdue ? "atrasada" : i.status === "pago" ? "paga" : i.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {i.paidAt ? formatDate(i.paidAt) : "—"}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      {i.status === "pago" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInstallment(i._id, "pendente")}
                        >
                          <Undo2 data-icon="inline-start" /> Estornar
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateInvoice(i.number)}
                            disabled={data.status === "cancelado"}
                          >
                            <Receipt data-icon="inline-start" /> Gerar cobrança
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInstallment(i._id, "pago")}
                            disabled={data.status === "cancelado"}
                          >
                            Marcar paga
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
