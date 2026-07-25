import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LogOut, Users } from "lucide-react";
import { getPlatformSession, clearPlatformCookie } from "@/lib/platform-admin";
import { BrandLogo } from "@/components/brand-logo";

const NAV = [
  { href: "/sysadmin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/sysadmin/funerarias", label: "Funerárias", icon: Building2 },
  { href: "/sysadmin/usuarios", label: "Usuários", icon: Users },
  { href: "/sysadmin/pagamentos", label: "Pagamentos", icon: CreditCard },
];

async function logoutAction() {
  "use server";
  await clearPlatformCookie();
  redirect("/sysadmin/login");
}

export default async function SysadminLayout({ children }: { children: React.ReactNode }) {
  const session = await getPlatformSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="dark flex min-h-dvh bg-background text-foreground">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <BrandLogo forceTheme="dark" size={26} className="text-base" />
        </div>
        <p className="px-4 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Plataforma · {session.username}
        </p>
        <nav className="flex-1 space-y-0.5 p-3" aria-label="Admin plataforma">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
