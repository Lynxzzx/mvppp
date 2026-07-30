import { NextResponse } from "next/server";
import { withAuth, jsonError, toObjectId } from "@/lib/api";
import { CollectorAccess } from "@/models/CollectorAccess";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE — desativa o link do cobrador. */
export const DELETE = withAuth<Ctx>(
  async (_req, session, ctx) => {
    const { id } = await ctx.params;
    const oid = toObjectId(id);
    if (!oid) return jsonError("ID inválido", 400);
    const doc = await CollectorAccess.findOneAndUpdate(
      { _id: oid, tenantId: session.tenantId },
      { $set: { active: false } }
    );
    if (!doc) return jsonError("Cobrador não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["admin"], feature: "contratos" }
);
