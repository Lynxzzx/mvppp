import { Download, FileText } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { FamilyPortalLink } from "@/models/FamilyPortalLink";
import { Case } from "@/models/Case";
import { Ceremony } from "@/models/Ceremony";
import { Tenant } from "@/models/Tenant";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatDate, formatDateTime } from "@/lib/format";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/models/Case";

export const metadata = { title: "Acompanhamento" };
export const dynamic = "force-dynamic";

const STAGES = [
  { status: "novo", label: "Atendimento recebido" },
  { status: "em_andamento", label: "Em andamento" },
  { status: "encerrado", label: "Concluído" },
];

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex min-h-dvh flex-col items-center bg-background px-4 py-10 text-foreground">
      <div className="mb-8">
        <BrandLogo forceTheme="dark" size={36} className="text-2xl" />
      </div>
      <div className="w-full max-w-lg animate-enter">{children}</div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Este é um acompanhamento seguro, acessível apenas por este link.
      </p>
    </div>
  );
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await dbConnect();

  const link = await FamilyPortalLink.findOne({ token, active: true }).lean<{
    tenantId: unknown;
    caseId: unknown;
    expiresAt?: Date;
  }>();

  if (!link || (link.expiresAt && new Date(link.expiresAt) < new Date())) {
    return (
      <PortalShell>
        <div className="rounded-lg border bg-card p-8 text-center">
          <h1 className="font-display text-xl">Link indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de acompanhamento expirou ou não existe. Entre em contato
            com a funerária para receber um novo link.
          </p>
        </div>
      </PortalShell>
    );
  }

  const caseDoc = await Case.findOne({ _id: link.caseId, tenantId: link.tenantId }).lean<{
    _id: unknown;
    status: string;
    serviceType: ServiceType;
    deceased: { name: string };
    updatedAt: Date;
    documents: { _id: unknown; name: string; visibleToFamily: boolean }[];
  }>();

  if (!caseDoc) {
    return (
      <PortalShell>
        <div className="rounded-lg border bg-card p-8 text-center">
          <h1 className="font-display text-xl">Link indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre em contato com a funerária para mais informações.
          </p>
        </div>
      </PortalShell>
    );
  }

  const [tenant, nextCeremony] = await Promise.all([
    Tenant.findById(link.tenantId).lean<{ name: string }>(),
    Ceremony.findOne({
      tenantId: link.tenantId,
      caseId: link.caseId,
      status: "agendada",
      startsAt: { $gte: new Date() },
    })
      .sort({ startsAt: 1 })
      .lean<{ type: ServiceType; startsAt: Date; room?: string }>(),
  ]);

  const stageIndex = STAGES.findIndex((s) => s.status === caseDoc.status);
  const documents = caseDoc.documents?.filter((d) => d.visibleToFamily) ?? [];

  return (
    <PortalShell>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-xs text-muted-foreground">{tenant?.name}</p>
          <h1 className="mt-1 font-display text-xl">
            Acompanhamento — {caseDoc.deceased.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERVICE_TYPE_LABEL[caseDoc.serviceType]} · atualizado em{" "}
            {formatDateTime(caseDoc.updatedAt)}
          </p>

          {/* Etapas do atendimento */}
          <ol className="mt-6 space-y-3" aria-label="Etapas do atendimento">
            {STAGES.map((s, idx) => {
              const done = idx < stageIndex;
              const current = idx === stageIndex;
              return (
                <li key={s.status} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      done && "border-sage bg-sage/20 text-sage",
                      current && "border-gold bg-gold/15 text-gold",
                      !done && !current && "border-border text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      current ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                    {current && (
                      <span className="ml-2 text-xs text-gold">etapa atual</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {nextCeremony && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-display text-base">Próxima cerimônia</h2>
            <p className="mt-2 text-sm">
              {SERVICE_TYPE_LABEL[nextCeremony.type]} ·{" "}
              <span className="font-mono text-sm text-gold-bright">
                {formatDateTime(nextCeremony.startsAt)}
              </span>
            </p>
            {nextCeremony.room && (
              <p className="text-sm text-muted-foreground">Local: {nextCeremony.room}</p>
            )}
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-display text-base">Documentos</h2>
          {documents.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum documento disponibilizado até o momento.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li key={String(d._id)}>
                  <a
                    href={`/api/portal/${token}/documents/${d._id}`}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:border-gold/40 hover:text-gold-bright"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{d.name}</span>
                    <Download className="size-4 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {link.expiresAt && (
          <p className="text-center text-xs text-muted-foreground">
            Acesso disponível até {formatDate(link.expiresAt)}.
          </p>
        )}
      </div>
    </PortalShell>
  );
}
