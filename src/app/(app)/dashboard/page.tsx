import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, FolderHeart, Package, Receipt } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Case } from "@/models/Case";
import { Ceremony } from "@/models/Ceremony";
import { InventoryItem } from "@/models/InventoryItem";
import { Invoice } from "@/models/Invoice";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceType } from "@/models/Case";

export const metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();
  const tenantId = session.tenantId;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [openCases, todayCeremonies, lowStockCount, pendingInvoices, recentCases] =
    await Promise.all([
      Case.countDocuments({ tenantId, status: { $in: ["novo", "em_andamento"] } }),
      Ceremony.find({
        tenantId,
        status: "agendada",
        startsAt: { $gte: todayStart, $lt: todayEnd },
      })
        .sort({ startsAt: 1 })
        .lean<{ _id: unknown; caseId: unknown; deceasedName?: string; type: ServiceType; startsAt: Date; room?: string }[]>(),
      InventoryItem.countDocuments({
        tenantId,
        minQuantity: { $gt: 0 },
        $expr: { $lte: ["$quantity", "$minQuantity"] },
      }),
      Invoice.countDocuments({ tenantId, status: "pendente" }),
      Case.find({ tenantId })
        .select("code deceased.name serviceType status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<{ _id: unknown; code: string; deceased: { name: string }; serviceType: ServiceType; status: string }[]>(),
    ]);

  const stats = [
    { href: "/casos", icon: FolderHeart, label: "Casos em aberto", value: openCases },
    { href: "/agenda", icon: CalendarDays, label: "Cerimônias hoje", value: todayCeremonies.length },
    { href: "/estoque", icon: Package, label: "Itens abaixo do mínimo", value: lowStockCount, warn: lowStockCount > 0 },
    { href: "/faturamento", icon: Receipt, label: "Cobranças pendentes", value: pendingInvoices },
  ];

  return (
    <div className="animate-enter">
      <PageHeader
        title={`Olá, ${session.name.split(" ")[0]}`}
        description="Resumo da operação de hoje."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full transition-colors duration-200 group-hover:border-gold/35 group-hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans text-sm font-normal text-muted-foreground">
                  <s.icon className="size-4 text-gold" aria-hidden />
                  {s.label}
                  {s.warn && <AlertTriangle className="size-3.5 text-destructive" aria-hidden />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-[1.75rem] tracking-tight">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">Cerimônias de hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {todayCeremonies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma cerimônia agendada para hoje.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayCeremonies.map((c) => (
                  <li key={String(c._id)} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-gold-bright">{formatTime(c.startsAt)}</span>
                    <Link href={`/casos/${c.caseId}`} className="min-w-0 flex-1 truncate hover:underline">
                      {c.deceasedName ?? "—"}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {SERVICE_TYPE_LABEL[c.type]}
                      {c.room ? ` · ${c.room}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">Casos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum caso registrado ainda.{" "}
                <Link href="/casos/novo" className="text-gold hover:underline">
                  Registrar novo caso
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {recentCases.map((c) => (
                  <li key={String(c._id)} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    <Link href={`/casos/${c._id}`} className="min-w-0 flex-1 truncate hover:underline">
                      {c.deceased.name}
                    </Link>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
