import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Package } from "lucide-react";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { InventoryItem, ITEM_CATEGORY_LABEL, type ItemCategory } from "@/models/InventoryItem";
import { Supplier } from "@/models/Supplier";
import { StockMovement } from "@/models/StockMovement";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEffectivePlan } from "@/lib/entitlements";
import { planAllows } from "@/lib/plans";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { NewItemDialog, MovementDialog, NewSupplierDialog } from "./dialogs";

export const metadata = { title: "Estoque" };
export const dynamic = "force-dynamic";

const TABS = [
  { value: "itens", label: "Itens" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "movimentacoes", label: "Movimentações" },
];

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { aba } = await searchParams;
  const tab = TABS.some((t) => t.value === aba) ? aba! : "itens";

  await dbConnect();
  const plan = await getEffectivePlan(session.tenantId);
  if (!planAllows(plan, "estoque")) return <UpgradeGate feature="estoque" />;

  const items = await InventoryItem.find({ tenantId: session.tenantId })
    .sort({ category: 1, name: 1 })
    .lean<{
      _id: unknown; name: string; category: ItemCategory; quantity: number;
      minQuantity: number; supplierName?: string;
    }[]>();
  const lowStock = items.filter((i) => i.quantity <= i.minQuantity && i.minQuantity > 0);

  const suppliers =
    tab === "fornecedores"
      ? await Supplier.find({ tenantId: session.tenantId })
          .sort({ category: 1, name: 1 })
          .lean<{ _id: unknown; name: string; category: ItemCategory; phone?: string; email?: string }[]>()
      : [];

  const movements =
    tab === "movimentacoes"
      ? await StockMovement.find({ tenantId: session.tenantId })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean<{
            _id: unknown; itemName: string; type: string; quantity: number;
            caseCode?: string; userName?: string; createdAt: Date;
          }[]>()
      : [];

  const itemsForDialog = items.map((i) => ({
    _id: String(i._id),
    name: i.name,
    quantity: i.quantity,
  }));

  return (
    <div className="animate-enter">
      <PageHeader title="Estoque" description="Urnas, caixões, flores, paramentação e veículos.">
        <MovementDialog items={itemsForDialog} />
        {tab === "fornecedores" ? <NewSupplierDialog /> : <NewItemDialog />}
      </PageHeader>

      {lowStock.length > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {lowStock.length === 1
            ? `1 item no nível mínimo de estoque: ${lowStock[0].name}`
            : `${lowStock.length} itens no nível mínimo de estoque: ${lowStock.map((i) => i.name).join(", ")}`}
        </p>
      )}

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/estoque?aba=${t.value}`}
            className={cn(
              "rounded-md border px-3 py-1 text-sm transition-colors",
              tab === t.value
                ? "border-gold/40 bg-gold/10 text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "itens" &&
        (items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum item cadastrado"
            description="Cadastre urnas, caixões, flores, paramentação e veículos para controlar quantidades e receber alertas de nível mínimo."
            action={<NewItemDialog />}
          />
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => {
                  const low = i.quantity <= i.minQuantity && i.minQuantity > 0;
                  return (
                    <TableRow key={String(i._id)}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ITEM_CATEGORY_LABEL[i.category]}
                      </TableCell>
                      <TableCell className="text-right font-mono">{i.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {i.minQuantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{i.supplierName ?? "—"}</TableCell>
                      <TableCell>
                        {low ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            <AlertTriangle className="size-3" aria-hidden /> Abaixo do mínimo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-sage/30 bg-sage/15 px-2 py-0.5 text-xs font-medium text-sage">
                            OK
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

      {tab === "fornecedores" &&
        (suppliers.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum fornecedor cadastrado"
            description="Cadastre fornecedores por categoria de item para agilizar reposições."
            action={<NewSupplierDialog />}
          />
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={String(s._id)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ITEM_CATEGORY_LABEL[s.category]}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.phone ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.email ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

      {tab === "movimentacoes" &&
        (movements.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma movimentação registrada"
            description="Registre entradas e saídas de itens — saídas podem ser vinculadas a um caso."
          />
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead>Caso</TableHead>
                  <TableHead>Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={String(m._id)}>
                    <TableCell className="font-mono text-xs">{formatDateTime(m.createdAt)}</TableCell>
                    <TableCell>{m.itemName}</TableCell>
                    <TableCell>
                      <span className={m.type === "entrada" ? "text-sage" : "text-gold"}>
                        {m.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">{m.caseCode ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.userName ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
    </div>
  );
}
