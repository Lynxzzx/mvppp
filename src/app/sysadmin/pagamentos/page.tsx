import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { dbConnect } from "@/lib/db";
import { PlanPayment } from "@/models/PlanPayment";
import { Tenant } from "@/models/Tenant";
import { formatBRL, formatDateTime } from "@/lib/format";
import { PLAN_LABEL, type Plan } from "@/lib/plans";
import { StatusBadge } from "@/components/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Pagamentos" };
export const dynamic = "force-dynamic";

export default async function PagamentosPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  await dbConnect();
  const payments = await PlanPayment.find().sort({ createdAt: -1 }).limit(100).lean();
  const tenantIds = [...new Set(payments.map((p) => String(p.tenantId)))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select("name").lean();
  const names = Object.fromEntries(tenants.map((t) => [String(t._id), t.name]));

  const complete = payments.filter((p) => p.status === "completo");
  const totalCents = complete.reduce((s, p) => s + (p.amountCents ?? 0), 0);

  return (
    <div className="animate-enter mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Pagamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assinaturas via MisticPay · {complete.length} pagos · {formatBRL(totalCents)} confirmados
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Funerária</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mistic ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={String(p._id)}>
                <TableCell className="font-mono text-xs">
                  {formatDateTime((p.paidAt ?? p.createdAt) as Date)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/sysadmin/funerarias/${p.tenantId}`}
                    className="text-gold hover:underline"
                  >
                    {names[String(p.tenantId)] ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>{PLAN_LABEL[p.plan as Plan] ?? p.plan}</TableCell>
                <TableCell className="font-mono">{formatBRL(p.amountCents)}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={
                      p.status === "completo"
                        ? "pago"
                        : p.status === "falha"
                          ? "cancelada"
                          : "pendente"
                    }
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.misticTransactionId ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum pagamento ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
