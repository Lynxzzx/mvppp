import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { InventoryItem } from "@/models/InventoryItem";
import { StockMovement } from "@/models/StockMovement";
import { Case } from "@/models/Case";

const createSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["entrada", "saida"]),
  quantity: z.number().int().min(1, "Quantidade mínima: 1"),
  caseId: z.string().optional(),
  note: z.string().optional(),
});

/** GET /api/inventory/movements — últimas movimentações. */
export const GET = withAuth(async (_req, session) => {
  const movements = await StockMovement.find({ tenantId: session.tenantId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return NextResponse.json({ movements });
}, { feature: "estoque" });

/**
 * POST /api/inventory/movements — entrada/saída vinculada a caso (PRD 6.3).
 * Saída é atômica: só efetiva se houver quantidade suficiente.
 */
export const POST = withAuth(
  async (req, session) => {
    const data = await parseBody(req, createSchema);
    const itemObjectId = toObjectId(data.itemId);
    if (!itemObjectId) return jsonError("Item não encontrado", 404);

    const delta = data.type === "entrada" ? data.quantity : -data.quantity;
    const filter: Record<string, unknown> = { _id: itemObjectId, tenantId: session.tenantId };
    if (data.type === "saida") filter.quantity = { $gte: data.quantity };

    const item = await InventoryItem.findOneAndUpdate(
      filter,
      { $inc: { quantity: delta } },
      { new: true }
    );
    if (!item) {
      const exists = await InventoryItem.exists({ _id: itemObjectId, tenantId: session.tenantId });
      return exists
        ? jsonError("Estoque insuficiente para esta saída", 409)
        : jsonError("Item não encontrado", 404);
    }

    let caseCode: string | undefined;
    if (data.caseId) {
      const parentCase = await Case.findOne({
        _id: toObjectId(data.caseId),
        tenantId: session.tenantId,
      });
      if (parentCase) {
        caseCode = parentCase.code;
        parentCase.timeline.push({
          kind: "sistema",
          text: `${data.type === "saida" ? "Saída" : "Entrada"} de estoque: ${data.quantity}× ${item.name}`,
          userId: session.userId,
          userName: session.name,
        });
        await parentCase.save();
      }
    }

    await StockMovement.create({
      tenantId: session.tenantId,
      itemId: item._id,
      itemName: item.name,
      category: item.category,
      type: data.type,
      quantity: data.quantity,
      caseId: data.caseId ? toObjectId(data.caseId) : undefined,
      caseCode,
      userId: session.userId,
      userName: session.name,
      note: data.note?.trim() || undefined,
    });

    const lowStock = item.quantity <= item.minQuantity;
    return NextResponse.json({ ok: true, quantity: item.quantity, lowStock }, { status: 201 });
  },
  { roles: ["atendente"], feature: "estoque" }
);
