import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Ceremony } from "@/models/Ceremony";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CeremonyActions } from "./ceremony-actions";
import type { ServiceType } from "@/models/Case";

export const metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

type CeremonyRow = {
  _id: unknown;
  caseId: unknown;
  caseCode: string;
  deceasedName?: string;
  type: ServiceType;
  startsAt: Date;
  endsAt: Date;
  room?: string;
  vehicle?: string;
  status: string;
};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = (r.getDay() + 6) % 7; // segunda = 0
  r.setDate(r.getDate() - day);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; visao?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { inicio, visao } = await searchParams;

  const view = visao === "dia" ? "dia" : "semana";
  const base = inicio ? new Date(`${inicio}T00:00:00`) : new Date();
  const rangeStart = view === "dia" ? startOfDay(base) : startOfWeek(base);
  const days = view === "dia" ? 1 : 7;
  const rangeEnd = addDays(rangeStart, days);

  await dbConnect();
  const ceremonies = await Ceremony.find({
    tenantId: session.tenantId,
    startsAt: { $gte: rangeStart, $lt: rangeEnd },
  })
    .sort({ startsAt: 1 })
    .lean<CeremonyRow[]>();

  const byDay = new Map<string, CeremonyRow[]>();
  for (let i = 0; i < days; i++) {
    byDay.set(toParam(addDays(rangeStart, i)), []);
  }
  for (const c of ceremonies) {
    const key = toParam(new Date(c.startsAt));
    byDay.get(key)?.push(c);
  }

  const prev = toParam(addDays(rangeStart, -days));
  const next = toParam(addDays(rangeStart, days));
  const today = toParam(new Date());

  return (
    <div className="animate-enter">
      <PageHeader title="Agenda" description="Cerimônias com controle de sala e veículo.">
        <Button nativeButton={false} render={<Link href="/agenda/nova" />}>
          <Plus data-icon="inline-start" /> Nova cerimônia
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Período anterior"
          nativeButton={false}
          render={<Link href={`/agenda?inicio=${prev}&visao=${view}`} />}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Próximo período"
          nativeButton={false}
          render={<Link href={`/agenda?inicio=${next}&visao=${view}`} />}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/agenda?inicio=${today}&visao=${view}`} />}
        >
          Hoje
        </Button>
        <span className="font-mono text-sm text-muted-foreground">
          {rangeStart.toLocaleDateString("pt-BR")} –{" "}
          {addDays(rangeEnd, -1).toLocaleDateString("pt-BR")}
        </span>
        <div className="ml-auto flex gap-1">
          {(["semana", "dia"] as const).map((v) => (
            <Link
              key={v}
              href={`/agenda?inicio=${toParam(rangeStart)}&visao=${v}`}
              className={cn(
                "rounded-md border px-3 py-1 text-sm capitalize transition-colors",
                view === v
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {ceremonies.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma cerimônia neste período"
          description="Agende velórios, sepultamentos e cremações vinculados a um caso — o sistema bloqueia conflitos de sala e veículo automaticamente."
          actionLabel="Nova cerimônia"
          actionHref="/agenda/nova"
        />
      ) : (
        <div className={cn("grid gap-4", view === "semana" && "lg:grid-cols-2 xl:grid-cols-3")}>
          {[...byDay.entries()].map(([day, list]) => {
            if (view === "semana" && list.length === 0) return null;
            const date = new Date(`${day}T00:00:00`);
            return (
              <section key={day} className="rounded-lg border bg-card p-4">
                <h2 className="mb-3 font-display text-base capitalize">
                  {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
                  {day === today && <span className="ml-2 text-xs text-gold">hoje</span>}
                </h2>
                <ul className="space-y-2">
                  {list.map((c) => (
                    <li key={String(c._id)} className="rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-gold-bright">
                          {formatTime(c.startsAt)}–{formatTime(c.endsAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={c.status} />
                          {c.status === "agendada" && <CeremonyActions id={String(c._id)} />}
                        </div>
                      </div>
                      <p className="mt-1">
                        <Link href={`/casos/${c.caseId}`} className="font-medium hover:underline">
                          {c.deceasedName ?? c.caseCode}
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          · {SERVICE_TYPE_LABEL[c.type]}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.room ? `Sala: ${c.room}` : ""}
                        {c.room && c.vehicle ? " · " : ""}
                        {c.vehicle ? `Veículo: ${c.vehicle}` : ""}
                      </p>
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className="text-sm text-muted-foreground">Sem cerimônias.</li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
