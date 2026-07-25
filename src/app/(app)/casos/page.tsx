import Link from "next/link";
import { FolderHeart, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Case } from "@/models/Case";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/models/Case";

export const metadata = { title: "Casos" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "encerrado", label: "Encerrados" },
];

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { status, q } = await searchParams;

  await dbConnect();
  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { "deceased.name": { $regex: q, $options: "i" } },
      { "family.name": { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
    ];
  }
  const cases = await Case.find(filter)
    .select("code family.name deceased.name serviceType status assigneeName createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<{ _id: unknown; code: string; family: { name: string }; deceased: { name: string }; serviceType: ServiceType; status: string; assigneeName?: string; createdAt: Date }[]>();

  return (
    <div className="animate-enter">
      <PageHeader title="Casos" description="Atendimentos do primeiro contato ao encerramento.">
        <Button nativeButton={false} render={<Link href="/casos/novo" />}>
          <Plus data-icon="inline-start" /> Registrar novo caso
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/casos?status=${f.value}` : "/casos"}
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
        <form className="ml-auto" action="/casos">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou código…"
            className="h-8 w-64 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
          />
        </form>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title="Nenhum caso em andamento"
          description="Quando a família entrar em contato, registre o atendimento aqui para acompanhar tudo em um só lugar."
          actionLabel="Registrar novo caso"
          actionHref="/casos/novo"
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Falecido(a)</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={String(c._id)}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/casos/${c._id}`} className="text-gold hover:underline">
                      {c.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/casos/${c._id}`} className="hover:underline">
                      {c.deceased.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.family.name}</TableCell>
                  <TableCell>{SERVICE_TYPE_LABEL[c.serviceType]}</TableCell>
                  <TableCell className="text-muted-foreground">{c.assigneeName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(c.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
