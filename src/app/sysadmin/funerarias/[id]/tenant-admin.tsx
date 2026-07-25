"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { PLAN_LABEL, type Plan } from "@/lib/plans";

type Props = {
  tenant: {
    id: string;
    name: string;
    cnpj: string | null;
    subscriptionPlan: Plan;
    planPaidUntil: string | null;
    active: boolean;
    notes: string;
    units: { name: string }[];
    createdAt: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
  }[];
  cases: number;
  payments: {
    id: string;
    plan: string;
    amountCents: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  audits: {
    id: string;
    action: string;
    userName: string;
    entity: string;
    createdAt: string;
  }[];
};

export function TenantAdmin({ tenant, users, cases, payments, audits }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(tenant.subscriptionPlan);
  const [paidUntil, setPaidUntil] = useState(
    tenant.planPaidUntil ? tenant.planPaidUntil.slice(0, 10) : ""
  );
  const [active, setActive] = useState(tenant.active);
  const [notes, setNotes] = useState(tenant.notes);
  const [name, setName] = useState(tenant.name);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/platform/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subscriptionPlan: plan,
        planPaidUntil: paidUntil || null,
        active,
        notes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Erro ao salvar");
      return;
    }
    toast.success("Funerária atualizada");
    router.refresh();
  }

  async function toggleUser(userId: string, nextActive: boolean) {
    const res = await fetch(`/api/platform/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar usuário");
      return;
    }
    toast.success(nextActive ? "Usuário reativado" : "Usuário desativado");
    router.refresh();
  }

  async function resetPassword(userId: string) {
    const pwd = prompt("Nova senha (mín. 8 caracteres):");
    if (!pwd || pwd.length < 8) {
      if (pwd !== null) toast.error("Senha muito curta");
      return;
    }
    const res = await fetch(`/api/platform/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: pwd }),
    });
    if (!res.ok) {
      toast.error("Erro ao resetar senha");
      return;
    }
    toast.success("Senha redefinida");
  }

  return (
    <div className="animate-enter mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/sysadmin/funerarias"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Funerárias
        </Link>
        <h1 className="font-display text-3xl">{tenant.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Criada em {formatDate(tenant.createdAt)} · {cases} casos · {tenant.units.length}{" "}
          unidade(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-medium">Plano e acesso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Plano</Label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => (
                <option key={p} value={p}>
                  {PLAN_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Pago até</Label>
            <Input
              type="date"
              value={paidUntil}
              onChange={(e) => setPaidUntil(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notas internas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações da operação…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Conta ativa (desmarque para suspender login)
          </label>
          <div className="sm:col-span-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-medium">
            Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{u.role}</span>
              <StatusBadge status={u.active ? "ativo" : "cancelada"} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleUser(u.id, !u.active)}
              >
                {u.active ? "Desativar" : "Reativar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => resetPassword(u.id)}>
                Reset senha
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Pagamentos de assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payments.length === 0 && (
              <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-border py-2 last:border-0">
                <span>
                  {PLAN_LABEL[p.plan as Plan] ?? p.plan}{" "}
                  <span className="text-muted-foreground">
                    · {formatDateTime(p.paidAt ?? p.createdAt)}
                  </span>
                </span>
                <span className="font-mono">{formatBRL(p.amountCents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">Auditoria recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {audits.length === 0 && (
              <p className="text-muted-foreground">Sem eventos.</p>
            )}
            {audits.map((a) => (
              <div key={a.id} className="border-b border-border py-2 last:border-0">
                <p className="font-medium">{a.action}</p>
                <p className="text-muted-foreground">
                  {a.userName} · {formatDateTime(a.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
