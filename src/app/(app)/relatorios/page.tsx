import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Case } from "@/models/Case";
import { Invoice } from "@/models/Invoice";
import { InventoryItem, ITEM_CATEGORY_LABEL, type ItemCategory } from "@/models/InventoryItem";
import { StockMovement } from "@/models/StockMovement";
import { SERVICE_TYPE_LABEL } from "@/lib/checklists";
import { formatBRL } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEffectivePlan } from "@/lib/entitlements";
import { planAllows } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { ServiceType } from "@/models/Case";

export const metadata = { title: "Relatórios" };
export const dynamic = "force-dynamic";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  await dbConnect();
  const plan = await getEffectivePlan(session.tenantId);
  if (!planAllows(plan, "relatorios")) return <UpgradeGate feature="relatorios" />;
  const { de, ate } = await searchParams;

  const to = ate ? new Date(`${ate}T23:59:59`) : new Date();
  const from = de
    ? new Date(`${de}T00:00:00`)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  await dbConnect();
  const tenantId = new mongoose.Types.ObjectId(session.tenantId);

  const [casesByStatus, casesByService, revenueByService, revenueByPlan, stockByCategory, movementsByCategory] =
    await Promise.all([
      // 6.7 — Casos por período e por status
      Case.aggregate([
        { $match: { tenantId, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Case.aggregate([
        { $match: { tenantId, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
      ]),
      // 6.7 — Receita por tipo de serviço (cobranças pagas vinculadas a casos)
      Invoice.aggregate([
        {
          $match: {
            tenantId,
            status: "paga",
            paidAt: { $gte: from, $lte: to },
            caseId: { $exists: true },
          },
        },
        { $lookup: { from: "cases", localField: "caseId", foreignField: "_id", as: "case" } },
        { $unwind: "$case" },
        { $group: { _id: "$case.serviceType", total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // 6.7 — Receita por tipo de plano (cobranças pagas de contratos)
      Invoice.aggregate([
        {
          $match: {
            tenantId,
            status: "paga",
            paidAt: { $gte: from, $lte: to },
            contractId: { $exists: true },
          },
        },
        { $lookup: { from: "contracts", localField: "contractId", foreignField: "_id", as: "contract" } },
        { $unwind: "$contract" },
        { $group: { _id: "$contract.planName", total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // 6.7 — Nível de estoque por categoria
      InventoryItem.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: "$category",
            totalQuantity: { $sum: "$quantity" },
            items: { $sum: 1 },
            low: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ["$minQuantity", 0] }, { $lte: ["$quantity", "$minQuantity"] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // 6.7 — Giro de estoque por categoria no período
      StockMovement.aggregate([
        { $match: { tenantId, createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: "$category",
            entradas: { $sum: { $cond: [{ $eq: ["$type", "entrada"] }, "$quantity", 0] } },
            saidas: { $sum: { $cond: [{ $eq: ["$type", "saida"] }, "$quantity", 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const totalCases = casesByStatus.reduce((acc, s) => acc + s.count, 0);
  const totalRevenue =
    revenueByService.reduce((acc, r) => acc + r.total, 0) +
    revenueByPlan.reduce((acc, r) => acc + r.total, 0);
  const movByCat = new Map(movementsByCategory.map((m) => [m._id, m]));

  const toInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="animate-enter">
      <PageHeader title="Relatórios" description="Casos, receita e estoque no período selecionado." />

      <form className="mb-6 flex flex-wrap items-end gap-3" action="/relatorios">
        <div className="space-y-1">
          <label htmlFor="de" className="text-xs text-muted-foreground">De</label>
          <input
            id="de" type="date" name="de" defaultValue={toInput(from)}
            className="block h-8 rounded-md border bg-transparent px-2 font-mono text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ate" className="text-xs text-muted-foreground">Até</label>
          <input
            id="ate" type="date" name="ate" defaultValue={toInput(to)}
            className="block h-8 rounded-md border bg-transparent px-2 font-mono text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <button
          type="submit"
          className="h-8 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Aplicar
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Casos por status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Casos no período{" "}
              <span className="font-mono text-sm text-muted-foreground">({totalCases})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {["novo", "em_andamento", "encerrado"].map((status) => {
                const count = casesByStatus.find((s) => s._id === status)?.count ?? 0;
                const pct = totalCases > 0 ? (count / totalCases) * 100 : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-32"><StatusBadge status={status} /></div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-sm">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-3">
              <p className="mb-2 text-xs text-muted-foreground">Por tipo de serviço</p>
              <div className="flex flex-wrap gap-2">
                {casesByService.map((s) => (
                  <span key={s._id} className="rounded-md border px-2 py-1 text-xs">
                    {SERVICE_TYPE_LABEL[s._id as ServiceType] ?? s._id}:{" "}
                    <span className="font-mono">{s.count}</span>
                  </span>
                ))}
                {casesByService.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum caso no período.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receita */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Receita recebida{" "}
              <span className="font-mono text-sm text-gold-bright">{formatBRL(totalRevenue)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Por tipo de plano (contratos)</p>
              {revenueByPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cobrança de contrato paga no período.</p>
              ) : (
                <ul className="space-y-1.5">
                  {revenueByPlan.map((r) => (
                    <li key={r._id} className="flex items-center justify-between text-sm">
                      <span>{r._id}</span>
                      <span className="font-mono text-xs">
                        {formatBRL(r.total)}{" "}
                        <span className="text-muted-foreground">({r.count})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t pt-3">
              <p className="mb-2 text-xs text-muted-foreground">Por tipo de serviço (casos)</p>
              {revenueByService.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cobrança de caso paga no período.</p>
              ) : (
                <ul className="space-y-1.5">
                  {revenueByService.map((r) => (
                    <li key={r._id} className="flex items-center justify-between text-sm">
                      <span>{SERVICE_TYPE_LABEL[r._id as ServiceType] ?? r._id}</span>
                      <span className="font-mono text-xs">
                        {formatBRL(r.total)}{" "}
                        <span className="text-muted-foreground">({r.count})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">
              Giro e nível de estoque por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item de estoque cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Itens</TableHead>
                    <TableHead className="text-right">Qtd. em estoque</TableHead>
                    <TableHead className="text-right">Entradas no período</TableHead>
                    <TableHead className="text-right">Saídas no período</TableHead>
                    <TableHead className="text-right">Abaixo do mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockByCategory.map((s) => {
                    const mov = movByCat.get(s._id);
                    return (
                      <TableRow key={s._id}>
                        <TableCell>{ITEM_CATEGORY_LABEL[s._id as ItemCategory] ?? s._id}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{s.items}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{s.totalQuantity}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-sage">
                          {mov?.entradas ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-gold">
                          {mov?.saidas ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {s.low > 0 ? (
                            <span className="text-destructive">{s.low}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
