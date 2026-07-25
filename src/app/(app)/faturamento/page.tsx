import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { formatBRL, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEffectivePlan } from "@/lib/entitlements";
import { planAllows } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InvoiceActions, NewInvoiceDialog } from "./invoice-widgets";

export const metadata = { title: "Faturamento" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "paga", label: "Pagas" },
  { value: "cancelada", label: "Canceladas" },
];

type InvoiceRow = {
  _id: unknown; number: string; description: string; amountCents: number;
  dueDate: Date; status: string; paidAt?: Date; boletoLine?: string;
  caseId?: unknown; caseCode?: string; contractId?: unknown; contractCode?: string;
};

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { status } = await searchParams;

  await dbConnect();
  const plan = await getEffectivePlan(session.tenantId);
  if (!planAllows(plan, "faturamento")) return <UpgradeGate feature="faturamento" />;

  const all = await Invoice.find({ tenantId: session.tenantId })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean<InvoiceRow[]>();

  const now = new Date();
  const pending = all.filter((i) => i.status === "pendente");
  const overdue = pending.filter((i) => new Date(i.dueDate) < now);
  const paidThisMonth = all.filter(
    (i) =>
      i.status === "paga" &&
      i.paidAt &&
      new Date(i.paidAt).getMonth() === now.getMonth() &&
      new Date(i.paidAt).getFullYear() === now.getFullYear()
  );
  const sum = (list: InvoiceRow[]) => list.reduce((acc, i) => acc + i.amountCents, 0);

  const invoices = status ? all.filter((i) => i.status === status) : all;

  return (
    <div className="animate-enter">
      <PageHeader title="Faturamento" description="Cobranças, baixas e conciliação simples.">
        <NewInvoiceDialog />
      </PageHeader>

      {/* Conciliação simples: gerado × recebido (PRD 6.5) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">A receber (pendentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl">{formatBRL(sum(pending))}</p>
            <p className="text-xs text-muted-foreground">{pending.length} cobrança(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Em atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("font-mono text-xl", overdue.length > 0 && "text-destructive")}>
              {formatBRL(sum(overdue))}
            </p>
            <p className="text-xs text-muted-foreground">{overdue.length} cobrança(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Recebido no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl text-sage">{formatBRL(sum(paidThisMonth))}</p>
            <p className="text-xs text-muted-foreground">{paidThisMonth.length} baixa(s)</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/faturamento?status=${f.value}` : "/faturamento"}
            className={cn(
              "rounded-md border px-3 py-1 text-sm transition-colors",
              (status ?? "") === f.value
                ? "border-gold/40 bg-gold/10 text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma cobrança gerada"
          description="Gere cobranças a partir de um caso ou de parcelas de contrato. Na v1 o boleto é simulado e a baixa é manual."
          action={<NewInvoiceDialog />}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => {
                const isOverdue = i.status === "pendente" && new Date(i.dueDate) < now;
                return (
                  <TableRow key={String(i._id)}>
                    <TableCell className="font-mono text-xs">{i.number}</TableCell>
                    <TableCell className="max-w-72 truncate" title={i.description}>
                      {i.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {i.caseId ? (
                        <Link href={`/casos/${i.caseId}`} className="text-gold hover:underline">
                          {i.caseCode}
                        </Link>
                      ) : i.contractId ? (
                        <Link href={`/contratos/${i.contractId}`} className="text-gold hover:underline">
                          {i.contractCode}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatBRL(i.amountCents)}
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs", isOverdue && "text-destructive")}>
                      {formatDate(i.dueDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={isOverdue ? "atrasada" : i.status} />
                    </TableCell>
                    <TableCell>
                      <InvoiceActions
                        id={String(i._id)}
                        status={i.status}
                        boletoLine={i.boletoLine}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
