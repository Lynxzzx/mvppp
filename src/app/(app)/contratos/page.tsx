import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSignature, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Contract } from "@/models/Contract";
import { formatBRL } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEffectivePlan } from "@/lib/entitlements";
import { planAllows } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Contratos" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "quitado", label: "Quitados" },
  { value: "cancelado", label: "Cancelados" },
];

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { status, q } = await searchParams;

  await dbConnect();
  const plan = await getEffectivePlan(session.tenantId);
  if (!planAllows(plan, "contratos")) return <UpgradeGate feature="contratos" />;

  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { customerName: { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
    ];
  }
  const contracts = await Contract.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<{
      _id: unknown; code: string; customerName: string; planName: string;
      totalCents: number; status: string; caseCode?: string;
      installments: { status: string }[];
    }[]>();

  return (
    <div className="animate-enter">
      <PageHeader title="Contratos" description="Planos pré-pagos, parcelas e reajustes.">
        <Button nativeButton={false} render={<Link href="/contratos/novo" />}>
          <Plus data-icon="inline-start" /> Novo contrato
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/contratos?status=${f.value}` : "/contratos"}
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
        <form className="ml-auto" action="/contratos">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por titular ou código…"
            className="h-8 w-64 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
          />
        </form>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato cadastrado"
          description="Crie planos pré-pagos com cronograma automático de parcelas e acompanhe pagamentos e reajustes."
          actionLabel="Novo contrato"
          actionHref="/contratos/novo"
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Parcelas pagas</TableHead>
                <TableHead>Caso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const paid = c.installments.filter((i) => i.status === "pago").length;
                return (
                  <TableRow key={String(c._id)}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/contratos/${c._id}`} className="text-gold hover:underline">
                        {c.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/contratos/${c._id}`} className="hover:underline">
                        {c.customerName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.planName}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatBRL(c.totalCents)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {paid}/{c.installments.length}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.caseCode ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
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
