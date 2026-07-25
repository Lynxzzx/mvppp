import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { dbConnect } from "@/lib/db";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";
import { PLAN_LABEL, type Plan } from "@/lib/plans";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Funerárias" };
export const dynamic = "force-dynamic";

export default async function FunerariasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>;
}) {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  const { q, plan, status } = await searchParams;
  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };
  if (plan && ["free", "essencial", "profissional", "rede"].includes(plan)) {
    filter.subscriptionPlan = plan;
  }
  if (status === "suspended") filter.active = false;
  if (status === "active") filter.active = { $ne: false };

  const tenants = await Tenant.find(filter).sort({ createdAt: -1 }).lean();
  const ids = tenants.map((t) => t._id);
  const [userCounts, caseCounts, admins] = await Promise.all([
    User.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    Case.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    User.find({ tenantId: { $in: ids }, role: "admin" }).select("tenantId email").lean(),
  ]);
  const userMap = Object.fromEntries(userCounts.map((u) => [String(u._id), u.count]));
  const caseMap = Object.fromEntries(caseCounts.map((c) => [String(c._id), c.count]));
  const adminMap = Object.fromEntries(admins.map((a) => [String(a.tenantId), a.email]));

  const filters = [
    { label: "Todas", href: "/sysadmin/funerarias" },
    { label: "Ativas", href: "/sysadmin/funerarias?status=active" },
    { label: "Suspensas", href: "/sysadmin/funerarias?status=suspended" },
    { label: "Free", href: "/sysadmin/funerarias?plan=free" },
    { label: "Essencial", href: "/sysadmin/funerarias?plan=essencial" },
    { label: "Profissional", href: "/sysadmin/funerarias?plan=profissional" },
    { label: "Rede", href: "/sysadmin/funerarias?plan=rede" },
  ];

  return (
    <div className="animate-enter mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Funerárias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tenants.length} conta{tenants.length === 1 ? "" : "s"} · clique para gerenciar plano e
          acesso
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome…"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm md:max-w-xs"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={cn(
              "rounded-md border px-2.5 py-1 transition-colors hover:border-gold/40",
              (f.href.includes(`plan=${plan}`) ||
                f.href.includes(`status=${status}`) ||
                (f.href === "/sysadmin/funerarias" && !plan && !status)) &&
                "border-gold/50 bg-gold/10 text-gold-bright"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funerária</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Pago até</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Casos</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={String(t._id)}>
                <TableCell>
                  <Link
                    href={`/sysadmin/funerarias/${t._id}`}
                    className="font-medium text-gold hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {formatDate(t.createdAt as Date)}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {adminMap[String(t._id)] ?? "—"}
                </TableCell>
                <TableCell>{PLAN_LABEL[(t.subscriptionPlan as Plan) ?? "free"]}</TableCell>
                <TableCell className="font-mono text-xs">
                  {t.planPaidUntil ? formatDate(t.planPaidUntil as Date) : "—"}
                </TableCell>
                <TableCell className="font-mono">{userMap[String(t._id)] ?? 0}</TableCell>
                <TableCell className="font-mono">{caseMap[String(t._id)] ?? 0}</TableCell>
                <TableCell>
                  <StatusBadge status={t.active === false ? "suspenso" : "ativo"} />
                </TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma funerária encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
