"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  atendente: "Atendente",
  financeiro: "Financeiro",
};

export function Topbar({ name, role }: { name: string; role: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-1 border-b bg-background px-4">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="gap-2 px-2 text-sm" />}
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-gold/15 text-gold">
            <UserIcon className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">{name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="text-sm">{name}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {ROLE_LABEL[role] ?? role}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} variant="destructive">
            <LogOut className="size-4" aria-hidden />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
