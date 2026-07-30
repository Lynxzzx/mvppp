"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileSignature,
  FileUp,
  FolderHeart,
  LayoutDashboard,
  Package,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, roles: ["admin", "atendente", "financeiro"] },
  { href: "/importacao", label: "Importar", icon: FileUp, roles: ["admin", "atendente", "financeiro"] },
  { href: "/casos", label: "Casos", icon: FolderHeart, roles: ["admin", "atendente", "financeiro"] },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, roles: ["admin", "atendente"] },
  { href: "/estoque", label: "Estoque", icon: Package, roles: ["admin", "atendente"] },
  { href: "/contratos", label: "Contratos", icon: FileSignature, roles: ["admin", "financeiro"] },
  { href: "/cobradores", label: "Cobradores", icon: Users, roles: ["admin", "financeiro"] },
  { href: "/faturamento", label: "Faturamento", icon: Receipt, roles: ["admin", "financeiro"] },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "financeiro"] },
  { href: "/configuracoes/ia", label: "IA", icon: Sparkles, roles: ["admin"] },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard, roles: ["admin"] },
] as const;

export function Sidebar({ role, tenantName }: { role: Role; tenantName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="min-w-0 transition-opacity hover:opacity-80">
          <BrandLogo size={28} className="text-lg" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
        {NAV.filter((item) => (item.roles as readonly string[]).includes(role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
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

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {tenantName}
        </p>
      </div>
    </aside>
  );
}
