"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/sysadmin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/sysadmin/funerarias", label: "Funerárias", icon: Building2 },
  { href: "/sysadmin/usuarios", label: "Usuários", icon: Users },
  { href: "/sysadmin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/sysadmin/ia", label: "IA / OpenRouter", icon: Sparkles },
];

export function SysadminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Admin plataforma">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon
              className={cn("size-[1.05rem]", active ? "text-gold" : "opacity-70")}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
