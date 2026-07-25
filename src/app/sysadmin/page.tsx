import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { dbConnect } from "@/lib/db";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";
import { PlanPayment } from "@/models/PlanPayment";
import { Contract } from "@/models/Contract";
import { Invoice } from "@/models/Invoice";
import { formatBRL } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LABEL, type Plan } from "@/lib/plans";

export const metadata = { title: "Sysadmin" };
export const dynamic = "force-dynamic";

export default async function SysadminHomePage() {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  await dbConnect();
  const now = new Date();
  const [
    tenants,
    users,
    cases,
    activePaid,
    suspended,
    paymentsTotal,
    paymentsMonth,
    contracts,
    byPlan,
    recentTenants,
  ] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
    Case.countDocuments(),
    Tenant.countDocuments({
      subscriptionPlan: { $in: ["essencial", "profissional", "rede"] },
      $or: [{ subscriptionPlan: "rede" }, { planPaidUntil: { $gt: now } }],
    }),
    Tenant.countDocuments({ active: false }),
    PlanPayment.aggregate([
      { $match: { status: "completo" } },
      { $group: { _id: null, total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
    ]),
    PlanPayment.aggregate([
      {
        $match: {
          status: "completo",
          paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
    ]),
    Contract.countDocuments(),
    Tenant.aggregate([{ $group: { _id: "$subscriptionPlan", count: { $sum: 1 } } }]),
    Tenant.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const pendingInvoices = await Invoice.countDocuments({ status: "pendente" });
  const planMap = Object.fromEntries(byPlan.map((p) => [p._id ?? "free", p.count]));

  const stats = [
    { label: "Funerárias", value: String(tenants), href: "/sysadmin/funerarias" },
    { label: "Usuários", value: String(users), href: "/sysadmin/usuarios" },
    { label: "Planos ativos", value: String(activePaid), href: "/sysadmin/funerarias?status=active" },
    { label: "Suspensas", value: String(suspended), href: "/sysadmin/funerarias?status=suspended" },
    { label: "Casos", value: String(cases) },
    { label: "Contratos", value: String(contracts) },
    {
      label: "Receita (assinaturas)",
      value: formatBRL(paymentsTotal[0]?.total ?? 0),
      href: "/sysadmin/pagamentos",
    },
    {
      label: "Receita no mês",
      value: formatBRL(paymentsMonth[0]?.total ?? 0),
      href: "/sysadmin/pagamentos",
    },
  ];

  return (
    <div className="animate-enter mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Visão geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operação da plataforma Veluxa · logado como {session.username}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <Card className={s.href ? "transition-colors hover:border-gold/40" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{s.value}</p>
              </CardContent>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">Funerárias por plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(["free", "essencial", "profissional", "rede"] as Plan[]).map((p) => (
                <li key={p} className="flex justify-between border-b border-border py-2 last:border-0">
                  <span>{PLAN_LABEL[p]}</span>
                  <span className="font-mono">{planMap[p] ?? 0}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Cadastros recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentTenants.map((t) => (
                <li key={String(t._id)}>
                  <Link
                    href={`/sysadmin/funerarias/${t._id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {PLAN_LABEL[(t.subscriptionPlan as Plan) ?? "free"]}
                    </span>
                  </Link>
                </li>
              ))}
              {recentTenants.length === 0 && (
                <p className="text-muted-foreground">Nenhuma funerária ainda.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Cobranças operacionais pendentes nas funerárias: {pendingInvoices} · Pagamentos de
        assinatura confirmados: {paymentsTotal[0]?.count ?? 0}
      </p>
    </div>
  );
}
