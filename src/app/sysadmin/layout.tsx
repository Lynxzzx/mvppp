import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getPlatformSession, clearPlatformCookie } from "@/lib/platform-admin";
import { BrandLogo } from "@/components/brand-logo";
import { SysadminNav } from "@/components/sysadmin-nav";

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
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <BrandLogo forceTheme="light" size={26} className="text-base" />
        </div>
        <p className="px-5 pt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Plataforma · {session.username}
        </p>
        <SysadminNav />
        <div className="border-t border-sidebar-border p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-[1.05rem] opacity-70" aria-hidden />
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="surface-paper flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
