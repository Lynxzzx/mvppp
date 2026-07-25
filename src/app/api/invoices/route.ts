import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Invoice } from "@/models/Invoice";
import { Contract } from "@/models/Contract";
import { Case } from "@/models/Case";
import { nextSeq } from "@/models/Counter";

/** Linha digitável fictícia — boleto simulado na v1 (PRD 6.5 / DECISIONS.md). */
function fakeBoletoLine(): string {
  const digits = () => Math.floor(Math.random() * 10);
  const group = (n: number) => Array.from({ length: n }, digits).join("");
  return `23790.${group(5)} ${group(5)}.${group(6)} ${group(5)}.${group(6)} ${digits()} ${group(14)}`;
}

const createSchema = z.union([
  // Cobrança a partir de parcela de contrato
  z.object({
    contractId: z.string().min(1),
    installmentNumber: z.number().int().min(1),
  }),
  // Cobrança avulsa a partir de um caso
  z.object({
    caseId: z.string().min(1),
    description: z.string().min(2, "Descreva a cobrança"),
    amountCents: z.number().int().min(100, "Valor mínimo: R$ 1,00"),
    dueDate: z.string().min(1, "Informe o vencimento"),
  }),
]);

/** GET /api/invoices?status= — cobranças do tenant. */
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && ["pendente", "paga", "cancelada"].includes(status)) filter.status = status;
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ invoices });
}, { feature: "faturamento" });

/** POST /api/invoices — gera cobrança a partir de caso ou parcela (PRD 6.5). */
export const POST = withAuth(
  async (req, session) => {
    const data = await parseBody(req, createSchema);
    const seq = await nextSeq(session.tenantId, "invoice");
    const number = `FAT-${String(seq).padStart(4, "0")}`;

    if ("contractId" in data) {
      const contract = await Contract.findOne({
        _id: toObjectId(data.contractId),
        tenantId: session.tenantId,
      }).lean<{
        _id: unknown; code: string; customerName: string;
        installments: { number: number; dueDate: Date; amountCents: number; status: string }[];
      }>();
      if (!contract) return jsonError("Contrato não encontrado", 404);

      const installment = contract.installments.find((i) => i.number === data.installmentNumber);
      if (!installment) return jsonError("Parcela não encontrada", 404);
      if (installment.status === "pago") return jsonError("Parcela já está paga", 409);

      const existing = await Invoice.findOne({
        tenantId: session.tenantId,
        contractId: contract._id,
        installmentNumber: installment.number,
        status: "pendente",
      }).lean();
      if (existing) return jsonError("Já existe cobrança pendente para esta parcela", 409);

      const invoice = await Invoice.create({
        tenantId: session.tenantId,
        number,
        description: `Contrato ${contract.code} — parcela ${installment.number} (${contract.customerName})`,
        amountCents: installment.amountCents,
        dueDate: installment.dueDate,
        contractId: contract._id,
        contractCode: contract.code,
        installmentNumber: installment.number,
        boletoLine: fakeBoletoLine(),
      });
      return NextResponse.json({ id: invoice._id.toString(), number }, { status: 201 });
    }

    const parentCase = await Case.findOne({
      _id: toObjectId(data.caseId),
      tenantId: session.tenantId,
    }).lean<{ _id: unknown; code: string }>();
    if (!parentCase) return jsonError("Caso não encontrado", 404);

    const invoice = await Invoice.create({
      tenantId: session.tenantId,
      number,
      description: data.description,
      amountCents: data.amountCents,
      dueDate: new Date(`${data.dueDate}T12:00:00`),
      caseId: parentCase._id,
      caseCode: parentCase.code,
      boletoLine: fakeBoletoLine(),
    });
    return NextResponse.json({ id: invoice._id.toString(), number }, { status: 201 });
  },
  { roles: ["financeiro"], feature: "faturamento" }
);
