import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Contract } from "@/models/Contract";
import { Case } from "@/models/Case";
import { nextSeq } from "@/models/Counter";

const createSchema = z.object({
  customerName: z.string().min(2, "Informe o titular"),
  customerPhone: z.string().optional(),
  customerDocument: z.string().optional(),
  planName: z.string().min(2, "Informe o plano"),
  totalCents: z.number().int().min(100, "Valor mínimo: R$ 1,00"),
  installmentsCount: z.number().int().min(1).max(120),
  adjustmentRule: z.string().optional(),
  firstDueDate: z.string().min(1, "Informe o primeiro vencimento"),
  caseId: z.string().optional(),
});

/** GET /api/contracts?status=&q= — contratos do tenant. */
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && ["ativo", "quitado", "cancelado"].includes(status)) filter.status = status;
  if (q) {
    filter.$or = [
      { customerName: { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
    ];
  }
  const contracts = await Contract.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ contracts });
}, { feature: "contratos" });

/**
 * POST /api/contracts — cria plano pré-pago com cronograma automático de
 * parcelas mensais (PRD 6.4). A última parcela absorve o arredondamento.
 */
export const POST = withAuth(
  async (req, session) => {
    const data = await parseBody(req, createSchema);

    let caseCode: string | undefined;
    if (data.caseId) {
      const parentCase = await Case.findOne({
        _id: toObjectId(data.caseId),
        tenantId: session.tenantId,
      }).lean<{ code: string }>();
      if (!parentCase) return jsonError("Caso não encontrado", 404);
      caseCode = parentCase.code;
    }

    const base = Math.floor(data.totalCents / data.installmentsCount);
    const first = new Date(`${data.firstDueDate}T12:00:00`);
    const installments = Array.from({ length: data.installmentsCount }, (_, i) => {
      const dueDate = new Date(first);
      dueDate.setMonth(dueDate.getMonth() + i);
      const isLast = i === data.installmentsCount - 1;
      return {
        number: i + 1,
        dueDate,
        amountCents: isLast ? data.totalCents - base * (data.installmentsCount - 1) : base,
        status: "pendente" as const,
      };
    });

    const seq = await nextSeq(session.tenantId, "contract");
    const contract = await Contract.create({
      tenantId: session.tenantId,
      code: `CT-${String(seq).padStart(4, "0")}`,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerDocument: data.customerDocument,
      planName: data.planName,
      totalCents: data.totalCents,
      installmentsCount: data.installmentsCount,
      adjustmentRule: data.adjustmentRule?.trim() || "Sem reajuste",
      caseId: data.caseId ? toObjectId(data.caseId) : undefined,
      caseCode,
      installments,
    });

    await audit(session, "contract.create", "Contract", contract._id.toString(), {
      code: contract.code,
      totalCents: data.totalCents,
      installmentsCount: data.installmentsCount,
    });

    return NextResponse.json({ id: contract._id.toString(), code: contract.code }, { status: 201 });
  },
  { roles: ["financeiro"], feature: "contratos" }
);
