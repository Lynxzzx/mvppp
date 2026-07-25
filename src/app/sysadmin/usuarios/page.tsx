import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Tenant } from "@/models/Tenant";
import { UsuariosClient } from "./usuarios-client";

export const metadata = { title: "Usuários" };
export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  await dbConnect();
  const users = await User.find()
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
        plan: (t.subscriptionPlan as string) ?? "free",
        active: t.active !== false,
      },
    ])
  );

  return (
    <div className="animate-enter mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os logins das funerárias · {users.length} registro(s)
        </p>
      </div>
      <UsuariosClient
        initial={users.map((u) => ({
          id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active !== false,
          tenantId: String(u.tenantId),
          tenant: tenantMap[String(u.tenantId)] ?? null,
        }))}
      />
    </div>
  );
}
