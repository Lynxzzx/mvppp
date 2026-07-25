import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Tenant } from "@/models/Tenant";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();
  const tenant = await Tenant.findById(session.tenantId).lean<{ name: string }>();

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar role={session.role} tenantName={tenant?.name ?? "Veluxa"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={session.name} role={session.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
