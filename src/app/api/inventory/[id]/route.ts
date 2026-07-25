import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { InventoryItem } from "@/models/InventoryItem";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  minQuantity: z.number().int().min(0).optional(),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
});

/** PATCH /api/inventory/[id] — edita item (quantidade só via movimentação). */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const data = await parseBody(req, updateSchema);
    const updated = await InventoryItem.findOneAndUpdate(
      { _id: toObjectId(id), tenantId: session.tenantId },
      { $set: data }
    );
    if (!updated) return jsonError("Item não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"], feature: "estoque" }
);

/** DELETE /api/inventory/[id] — remove item (somente admin). */
export const DELETE = withAuth<Ctx>(
  async (_req, session, ctx) => {
    const { id } = await ctx.params;
    const deleted = await InventoryItem.findOneAndDelete({
      _id: toObjectId(id),
      tenantId: session.tenantId,
    });
    if (!deleted) return jsonError("Item não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: [], feature: "estoque" }
);
