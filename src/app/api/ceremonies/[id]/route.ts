import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Ceremony } from "@/models/Ceremony";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["agendada", "realizada", "cancelada"]),
});

/** PATCH /api/ceremonies/[id] — atualiza status (realizada/cancelada). */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const { status } = await parseBody(req, updateSchema);
    const updated = await Ceremony.findOneAndUpdate(
      { _id: toObjectId(id), tenantId: session.tenantId },
      { $set: { status } }
    );
    if (!updated) return jsonError("Cerimônia não encontrada", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"] }
);
