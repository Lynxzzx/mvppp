import { notFound, redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { dbConnect } from "@/lib/db";
import { toObjectId } from "@/lib/api";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";
import { PlanPayment } from "@/models/PlanPayment";
import { AuditLog } from "@/models/AuditLog";
import { TenantAdmin } from "./tenant-admin";
import type { Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  const { id } = await params;
  const objectId = toObjectId(id);
  if (!objectId) notFound();

  await dbConnect();
  const tenant = await Tenant.findById(objectId).lean();
  if (!tenant) notFound();

  const [users, cases, payments, audits] = await Promise.all([
    User.find({ tenantId: objectId }).select("-passwordHash").sort({ createdAt: -1 }).lean(),
    Case.countDocuments({ tenantId: objectId }),
    PlanPayment.find({ tenantId: objectId }).sort({ createdAt: -1 }).limit(20).lean(),
    AuditLog.find({ tenantId: objectId }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  return (
    <TenantAdmin
      tenant={{
        id: String(tenant._id),
        name: tenant.name,
        cnpj: tenant.cnpj ?? null,
        subscriptionPlan: (tenant.subscriptionPlan as Plan) ?? "free",
        planPaidUntil: tenant.planPaidUntil
          ? new Date(tenant.planPaidUntil as Date).toISOString()
          : null,
        active: tenant.active !== false,
        notes: (tenant.notes as string) ?? "",
        units: ((tenant.units as { name: string }[]) ?? []).map((u) => ({ name: u.name })),
        createdAt: new Date(tenant.createdAt as Date).toISOString(),
      }}
      users={users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active !== false,
        createdAt: new Date(u.createdAt as Date).toISOString(),
      }))}
      cases={cases}
      payments={payments.map((p) => ({
        id: String(p._id),
        plan: p.plan,
        amountCents: p.amountCents,
        status: p.status,
        paidAt: p.paidAt ? new Date(p.paidAt as Date).toISOString() : null,
        createdAt: new Date(p.createdAt as Date).toISOString(),
      }))}
      audits={audits.map((a) => ({
        id: String(a._id),
        action: a.action,
        userName: a.userName,
        entity: a.entity,
        createdAt: new Date(a.createdAt as Date).toISOString(),
      }))}
    />
  );
}
