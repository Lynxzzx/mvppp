import { NextResponse } from "next/server";
import { withPlatformAuth } from "@/lib/platform-admin";
import { PlanPayment } from "@/models/PlanPayment";
import { Tenant } from "@/models/Tenant";

export const GET = withPlatformAuth(async () => {
  const payments = await PlanPayment.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const tenantIds = [...new Set(payments.map((p) => String(p.tenantId)))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select("name").lean();
  const names = Object.fromEntries(tenants.map((t) => [String(t._id), t.name]));

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: String(p._id),
      tenantId: String(p.tenantId),
      tenantName: names[String(p.tenantId)] ?? "—",
      plan: p.plan,
      amountCents: p.amountCents,
      status: p.status,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      misticTransactionId: p.misticTransactionId ?? null,
    })),
  });
});
