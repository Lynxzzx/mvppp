import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api";
import { Supplier } from "@/models/Supplier";

const createSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  category: z.enum(["urna", "caixao", "flor", "paramentacao", "veiculo", "outro"]),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

/** GET /api/suppliers — fornecedores do tenant. */
export const GET = withAuth(async (_req, session) => {
  const suppliers = await Supplier.find({ tenantId: session.tenantId })
    .sort({ category: 1, name: 1 })
    .lean();
  return NextResponse.json({ suppliers });
}, { feature: "estoque" });

/** POST /api/suppliers — cadastro básico por categoria (PRD 6.3). */
export const POST = withAuth(
  async (req, session) => {
    const data = await parseBody(req, createSchema);
    const supplier = await Supplier.create({
      ...data,
      email: data.email || undefined,
      tenantId: session.tenantId,
    });
    return NextResponse.json({ id: supplier._id.toString() }, { status: 201 });
  },
  { roles: ["atendente"], feature: "estoque" }
);
