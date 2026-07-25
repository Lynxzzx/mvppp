import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api";
import { InventoryItem } from "@/models/InventoryItem";

const CATEGORIES = ["urna", "caixao", "flor", "paramentacao", "veiculo", "outro"] as const;

const createSchema = z.object({
  name: z.string().min(2, "Informe o nome do item"),
  category: z.enum(CATEGORIES),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
});

/** GET /api/inventory?category= — itens do tenant. */
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    filter.category = category;
  }
  const items = await InventoryItem.find(filter).sort({ category: 1, name: 1 }).lean();
  return NextResponse.json({ items });
}, { feature: "estoque" });

/** POST /api/inventory — cadastra item por categoria (PRD 6.3). */
export const POST = withAuth(
  async (req, session) => {
    const data = await parseBody(req, createSchema);
    const item = await InventoryItem.create({ ...data, tenantId: session.tenantId });
    return NextResponse.json({ id: item._id.toString() }, { status: 201 });
  },
  { roles: ["atendente"], feature: "estoque" }
);
