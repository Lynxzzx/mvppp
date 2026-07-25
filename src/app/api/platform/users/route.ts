import { NextResponse } from "next/server";
import { withPlatformAuth } from "@/lib/platform-admin";
import { User } from "@/models/User";
import { Tenant } from "@/models/Tenant";

export const GET = withPlatformAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  const tenantIds = [...new Set(users.map((u) => String(u.tenantId)))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } })
    .select("name subscriptionPlan active")
    .lean();
  const tenantMap = Object.fromEntries(
    tenants.map((t) => [
      String(t._id),
      {
        name: t.name,
        plan: t.subscriptionPlan ?? "free",
        active: t.active !== false,
      },
    ])
  );

  return NextResponse.json({
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active !== false,
      tenantId: String(u.tenantId),
      tenant: tenantMap[String(u.tenantId)] ?? null,
      createdAt: u.createdAt,
    })),
  });
});
