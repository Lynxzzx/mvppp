"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileSignature,
  FolderHeart,
  LayoutDashboard,
  Package,
  Receipt,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, roles: ["admin", "atendente", "financeiro"] },
  { href: "/casos", label: "Casos", icon: FolderHeart, roles: ["admin", "atendente", "financeiro"] },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, roles: ["admin", "atendente"] },
  { href: "/estoque", label: "Estoque", icon: Package, roles: ["admin", "atendente"] },
  { href: "/contratos", label: "Contratos", icon: FileSignature, roles: ["admin", "financeiro"] },
  { href: "/faturamento", label: "Faturamento", icon: Receipt, roles: ["admin", "financeiro"] },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "financeiro"] },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard, roles: ["admin"] },
] as const;

export function Sidebar({ role, tenantName }: { role: Role; tenantName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="min-w-0">
          <BrandLogo size={28} className="text-lg" />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3" aria-label="Navegação principal">
        {NAV.filter((item) => (item.roles as readonly string[]).includes(role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-gold-bright"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-3">
        <p className="truncate text-xs text-muted-foreground" title={tenantName}>
          {tenantName}
        </p>
      </div>
    </aside>
  );
}
