import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { jsonError, parseBody, toObjectId } from "@/lib/api";
import { CollectorAccess } from "@/models/CollectorAccess";
import { Contract } from "@/models/Contract";
import { Tenant } from "@/models/Tenant";
import { markInstallmentPaid } from "@/lib/billing/invoice-pay";
import { formatBRL } from "@/lib/format";

type Ctx = { params: Promise<{ token: string }> };

async function resolveCollector(token: string) {
  await dbConnect();
  const link = await CollectorAccess.findOne({ token, active: true }).lean<{
    _id: unknown;
    tenantId: unknown;
    name: string;
    expiresAt?: Date;
  }>();
  if (!link) return null;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;
  return link;
}

/** GET — parcelas pendentes para cobrança em campo. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const link = await resolveCollector(token);
  if (!link) return jsonError("Link indisponível ou expirado", 404);

  const tenant = await Tenant.findById(link.tenantId).lean<{ name: string }>();
  const contracts = await Contract.find({
    tenantId: link.tenantId,
    status: "ativo",
  })
    .select("code customerName customerPhone customerDocument planName installments")
    .lean<
      {
        _id: unknown;
        code: string;
        customerName: string;
        customerPhone?: string;
        customerDocument?: string;
        planName: string;
        installments: {
          number: number;
          dueDate: Date;
          amountCents: number;
          status: string;
        }[];
      }[]
    >();

  const now = new Date();
  const items = contracts.flatMap((c) =>
    c.installments
      .filter((i) => i.status === "pendente" || i.status === "atrasado")
      .map((i) => ({
        contractId: String(c._id),
        contractCode: c.code,
        customerName: c.customerName,
        customerPhone: c.customerPhone ?? "",
        planName: c.planName,
        installmentNumber: i.number,
        dueDate: i.dueDate,
        amountCents: i.amountCents,
        amountLabel: formatBRL(i.amountCents),
        overdue: new Date(i.dueDate) < now,
      }))
  );

  items.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return NextResponse.json({
    collectorName: link.name,
    tenantName: tenant?.name ?? "Veluxa",
    items,
  });
}

const PaySchema = z.object({
  contractId: z.string().min(1),
  installmentNumber: z.number().int().min(1),
  note: z.string().trim().max(200).optional(),
});

/** POST — registra pagamento recebido em campo. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const link = await resolveCollector(token);
  if (!link) return jsonError("Link indisponível ou expirado", 404);

  const body = await parseBody(req, PaySchema);
  const contractId = toObjectId(body.contractId);
  if (!contractId) return jsonError("Contrato inválido", 400);

  const result = await markInstallmentPaid({
    contractId,
    installmentNumber: body.installmentNumber,
    tenantId: String(link.tenantId),
  });

  if (!result.ok) return jsonError(result.error, 400);

  return NextResponse.json({
    ok: true,
    message: "Pagamento registrado",
    invoiceId: result.invoiceId,
    by: link.name,
    note: body.note,
  });
}
