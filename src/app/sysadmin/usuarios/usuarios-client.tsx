"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PLAN_LABEL, type Plan } from "@/lib/plans";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  tenantId: string;
  tenant: { name: string; plan: string; active: boolean } | null;
};

export function UsuariosClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const filtered = initial.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.tenant?.name.toLowerCase().includes(q.toLowerCase())
  );

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/platform/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success(active ? "Usuário reativado" : "Usuário desativado");
    router.refresh();
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/platform/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      toast.error("Erro ao alterar papel");
      return;
    }
    toast.success("Papel atualizado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar por nome, e-mail ou funerária…"
        className="max-w-md"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Funerária</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>
                  {u.tenant ? (
                    <Link
                      href={`/sysadmin/funerarias/${u.tenantId}`}
                      className="text-gold hover:underline"
                    >
                      {u.tenant.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {PLAN_LABEL[(u.tenant?.plan as Plan) ?? "free"]}
                </TableCell>
                <TableCell>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="admin">admin</option>
                    <option value="atendente">atendente</option>
                    <option value="financeiro">financeiro</option>
                  </select>
                </TableCell>
                <TableCell>
                  <StatusBadge status={u.active ? "ativo" : "cancelada"} />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => toggle(u.id, !u.active)}>
                    {u.active ? "Desativar" : "Reativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum usuário.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
