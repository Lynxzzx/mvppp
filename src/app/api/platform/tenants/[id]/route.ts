import { NextResponse } from "next/server";
import { z } from "zod";
import { withPlatformAuth } from "@/lib/platform-admin";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";
import { PlanPayment } from "@/models/PlanPayment";
import { AuditLog } from "@/models/AuditLog";
import { toObjectId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  subscriptionPlan: z.enum(["free", "essencial", "profissional", "rede"]).optional(),
  planPaidUntil: z.string().nullable().optional(),
  active: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  name: z.string().min(2).optional(),
});

export async function GET(req: Request, ctx: Ctx) {
  return withPlatformAuth(async () => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const tenant = await Tenant.findById(objectId).lean();
    if (!tenant) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const [users, cases, payments, audits] = await Promise.all([
      User.find({ tenantId: objectId }).select("-passwordHash").sort({ createdAt: -1 }).lean(),
      Case.countDocuments({ tenantId: objectId }),
      PlanPayment.find({ tenantId: objectId }).sort({ createdAt: -1 }).limit(20).lean(),
      AuditLog.find({ tenantId: objectId }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    return NextResponse.json({
      tenant: {
        id: String(tenant._id),
        name: tenant.name,
        cnpj: tenant.cnpj ?? null,
        subscriptionPlan: tenant.subscriptionPlan ?? "free",
        planPaidUntil: tenant.planPaidUntil ?? null,
        active: tenant.active !== false,
        notes: tenant.notes ?? "",
        units: tenant.units ?? [],
        createdAt: tenant.createdAt,
      },
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active !== false,
        createdAt: u.createdAt,
      })),
      cases,
      payments: payments.map((p) => ({
        id: String(p._id),
        plan: p.plan,
        amountCents: p.amountCents,
        status: p.status,
        paidAt: p.paidAt ?? null,
        createdAt: p.createdAt,
      })),
      audits: audits.map((a) => ({
        id: String(a._id),
        action: a.action,
        userName: a.userName,
        entity: a.entity,
        createdAt: a.createdAt,
      })),
    });
  })(req);
}

export async function PATCH(req: Request, ctx: Ctx) {
  return withPlatformAuth(async (request, session) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const body = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const tenant = await Tenant.findById(objectId);
    if (!tenant) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const before = {
      plan: tenant.subscriptionPlan,
      paidUntil: tenant.planPaidUntil,
      active: tenant.active,
    };

    if (body.data.name !== undefined) tenant.name = body.data.name;
    if (body.data.subscriptionPlan !== undefined) {
      tenant.subscriptionPlan = body.data.subscriptionPlan;
      if (body.data.subscriptionPlan === "free") {
        tenant.planPaidUntil = undefined;
      }
    }
    if (body.data.planPaidUntil !== undefined) {
      tenant.planPaidUntil = body.data.planPaidUntil
        ? new Date(body.data.planPaidUntil)
        : undefined;
    }
    if (body.data.active !== undefined) tenant.active = body.data.active;
    if (body.data.notes !== undefined) tenant.notes = body.data.notes;

    // Rede / planos pagos: se ativar plano pago sem data, dá 30 dias
    if (
      body.data.subscriptionPlan &&
      body.data.subscriptionPlan !== "free" &&
      !tenant.planPaidUntil &&
      body.data.subscriptionPlan !== "rede"
    ) {
      tenant.planPaidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (body.data.subscriptionPlan === "rede" && !tenant.planPaidUntil) {
      // Rede não expira por padrão — marca 1 ano à frente como referência
      tenant.planPaidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    await tenant.save();

    await AuditLog.create({
      tenantId: objectId,
      userId: objectId,
      userName: `plataforma (${session.username})`,
      action: "platform.tenant.update",
      entity: "Tenant",
      entityId: objectId,
      meta: { before, after: body.data },
    });

    return NextResponse.json({ ok: true });
  })(req);
}
