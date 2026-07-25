import { NextResponse } from "next/server";
import { withPlatformAuth } from "@/lib/platform-admin";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";

export const GET = withPlatformAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const plan = searchParams.get("plan");
  const status = searchParams.get("status"); // active | suspended

  const filter: Record<string, unknown> = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (plan && ["free", "essencial", "profissional", "rede"].includes(plan)) {
    filter.subscriptionPlan = plan;
  }
  if (status === "suspended") filter.active = false;
  if (status === "active") filter.active = { $ne: false };

  const tenants = await Tenant.find(filter).sort({ createdAt: -1 }).lean();
  const ids = tenants.map((t) => t._id);

  const [userCounts, caseCounts, admins] = await Promise.all([
    User.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    Case.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    User.find({ tenantId: { $in: ids }, role: "admin" })
      .select("tenantId name email")
      .lean(),
  ]);

  const userMap = Object.fromEntries(userCounts.map((u) => [String(u._id), u.count]));
  const caseMap = Object.fromEntries(caseCounts.map((c) => [String(c._id), c.count]));
  const adminMap: Record<string, { name: string; email: string }> = {};
  for (const a of admins) {
    const key = String(a.tenantId);
    if (!adminMap[key]) adminMap[key] = { name: a.name, email: a.email };
  }

  return NextResponse.json({
    tenants: tenants.map((t) => ({
      id: String(t._id),
      name: t.name,
      cnpj: t.cnpj ?? null,
      subscriptionPlan: t.subscriptionPlan ?? "free",
      planPaidUntil: t.planPaidUntil ?? null,
      active: t.active !== false,
      notes: t.notes ?? "",
      units: (t.units ?? []).length,
      users: userMap[String(t._id)] ?? 0,
      cases: caseMap[String(t._id)] ?? 0,
      admin: adminMap[String(t._id)] ?? null,
      createdAt: t.createdAt,
    })),
  });
});
