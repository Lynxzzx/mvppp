import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withPlatformAuth } from "@/lib/platform-admin";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { toObjectId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(["admin", "atendente", "financeiro"]).optional(),
  name: z.string().min(2).optional(),
  resetPassword: z.string().min(8).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  return withPlatformAuth(async (request, session) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const body = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const user = await User.findById(objectId);
    if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (body.data.active !== undefined) user.active = body.data.active;
    if (body.data.role !== undefined) user.role = body.data.role;
    if (body.data.name !== undefined) user.name = body.data.name;
    if (body.data.resetPassword) {
      user.passwordHash = await bcrypt.hash(body.data.resetPassword, 10);
    }
    await user.save();

    await AuditLog.create({
      tenantId: user.tenantId,
      userId: user._id,
      userName: `plataforma (${session.username})`,
      action: "platform.user.update",
      entity: "User",
      entityId: user._id,
      meta: {
        active: body.data.active,
        role: body.data.role,
        passwordReset: Boolean(body.data.resetPassword),
      },
    });

    return NextResponse.json({ ok: true });
  })(req);
}
