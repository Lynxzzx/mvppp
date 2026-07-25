import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const toggleSchema = z.object({
  itemId: z.string(),
  done: z.boolean(),
});

const addSchema = z.object({
  label: z.string().min(1, "Descreva a tarefa").max(200),
});

/** PATCH /api/cases/[id]/checklist — marca/desmarca item. */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const { itemId, done } = await parseBody(req, toggleSchema);

    const updated = await Case.findOneAndUpdate(
      { _id: objectId, tenantId: session.tenantId, "checklist._id": toObjectId(itemId) },
      {
        $set: {
          "checklist.$.done": done,
          "checklist.$.doneAt": done ? new Date() : null,
        },
      }
    );
    if (!updated) return jsonError("Item não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"] }
);

/** POST /api/cases/[id]/checklist — adiciona item (checklist configurável, PRD 6.1). */
export const POST = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const { label } = await parseBody(req, addSchema);

    const updated = await Case.findOneAndUpdate(
      { _id: objectId, tenantId: session.tenantId },
      { $push: { checklist: { label, done: false } } }
    );
    if (!updated) return jsonError("Caso não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"] }
);
