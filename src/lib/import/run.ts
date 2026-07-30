import { Case } from "@/models/Case";
import { InventoryItem } from "@/models/InventoryItem";
import { Contract } from "@/models/Contract";
import { nextSeq } from "@/models/Counter";
import { CHECKLIST_TEMPLATES } from "@/lib/checklists";
import { getEffectivePlan } from "@/lib/entitlements";
import { FREE_LIMITS } from "@/lib/plans";
import type { ImportEntity } from "@/lib/import/schema";
import type { Session } from "@/lib/auth";

export type ImportRowResult = {
  row: number;
  ok: boolean;
  code?: string;
  error?: string;
};

function cell(
  row: Record<string, string>,
  mapping: Record<string, string>,
  fieldKey: string
): string {
  const header = Object.entries(mapping).find(([, k]) => k === fieldKey)?.[0];
  if (!header) return "";
  return (row[header] ?? "").trim();
}

function parseDate(raw: string): Date | undefined {
  if (!raw) return undefined;
  // dd/mm/yyyy
  const br = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (br) {
    const d = Number(br[1]);
    const m = Number(br[2]) - 1;
    let y = Number(br[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, m, d, 12);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  }
  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? undefined : iso;
}

function parseMoneyToCents(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[R$\s]/gi, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function parseServiceType(raw: string): "velorio" | "sepultamento" | "cremacao" {
  const n = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n.includes("sepult") || n.includes("enterro")) return "sepultamento";
  if (n.includes("crem")) return "cremacao";
  return "velorio";
}

function parseCategory(raw: string): string {
  const n = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n.includes("urna")) return "urna";
  if (n.includes("caix")) return "caixao";
  if (n.includes("flor")) return "flor";
  if (n.includes("param")) return "paramentacao";
  if (n.includes("veic") || n.includes("carro")) return "veiculo";
  return "outro";
}

export async function runImport(opts: {
  entity: ImportEntity;
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  session: Session;
}): Promise<{ imported: number; failed: number; results: ImportRowResult[] }> {
  const { entity, rows, mapping, session } = opts;
  const results: ImportRowResult[] = [];
  let imported = 0;
  let failed = 0;

  if (entity === "casos") {
    const plan = await getEffectivePlan(session.tenantId);
    let remaining =
      plan === "free"
        ? Math.max(
            0,
            FREE_LIMITS.cases - (await Case.countDocuments({ tenantId: session.tenantId }))
          )
        : Infinity;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const deceasedName = cell(row, mapping, "deceased.name");
      const familyName = cell(row, mapping, "family.name");
      if (!deceasedName || !familyName) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: "Nome do falecido e do responsável são obrigatórios",
        });
        continue;
      }
      if (remaining <= 0) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: "Limite do plano gratuito atingido",
        });
        continue;
      }

      try {
        const serviceType = parseServiceType(cell(row, mapping, "serviceType"));
        const seq = await nextSeq(session.tenantId, "case");
        const year = new Date().getFullYear();
        const code = `${year}-${String(seq).padStart(4, "0")}`;
        await Case.create({
          tenantId: session.tenantId,
          code,
          family: {
            name: familyName,
            phone: cell(row, mapping, "family.phone") || undefined,
            email: cell(row, mapping, "family.email") || undefined,
            relationship: cell(row, mapping, "family.relationship") || undefined,
            document: cell(row, mapping, "family.document") || undefined,
          },
          deceased: {
            name: deceasedName,
            dateOfBirth: parseDate(cell(row, mapping, "deceased.dateOfBirth")),
            dateOfDeath: parseDate(cell(row, mapping, "deceased.dateOfDeath")),
            placeOfDeath: cell(row, mapping, "deceased.placeOfDeath") || undefined,
          },
          serviceType,
          status: "novo",
          assigneeId: session.userId,
          assigneeName: session.name,
          checklist: CHECKLIST_TEMPLATES[serviceType].map((label) => ({ label })),
          timeline: [
            {
              kind: "criacao",
              text: "Caso importado da planilha",
              userId: session.userId,
              userName: session.name,
            },
          ],
        });
        remaining--;
        imported++;
        results.push({ row: i + 2, ok: true, code });
      } catch (err) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: err instanceof Error ? err.message : "Erro ao importar",
        });
      }
    }
  }

  if (entity === "estoque") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const name = cell(row, mapping, "name");
      if (!name) {
        failed++;
        results.push({ row: i + 2, ok: false, error: "Nome do item obrigatório" });
        continue;
      }
      try {
        const qty = Number(cell(row, mapping, "quantity").replace(",", ".")) || 0;
        const min = Number(cell(row, mapping, "minQuantity").replace(",", ".")) || 0;
        await InventoryItem.create({
          tenantId: session.tenantId,
          name,
          category: parseCategory(cell(row, mapping, "category")),
          quantity: Math.max(0, Math.floor(qty)),
          minQuantity: Math.max(0, Math.floor(min)),
          supplierName: cell(row, mapping, "supplierName") || undefined,
          notes: cell(row, mapping, "notes") || undefined,
        });
        imported++;
        results.push({ row: i + 2, ok: true, code: name });
      } catch (err) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: err instanceof Error ? err.message : "Erro ao importar",
        });
      }
    }
  }

  if (entity === "contratos") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const customerName = cell(row, mapping, "customerName");
      const planName = cell(row, mapping, "planName");
      const totalCents = parseMoneyToCents(cell(row, mapping, "totalCents"));
      const installmentsCount = Math.max(
        1,
        Math.min(120, Math.floor(Number(cell(row, mapping, "installmentsCount")) || 1))
      );
      const firstDue = parseDate(cell(row, mapping, "firstDueDate"));

      if (!customerName || !planName || totalCents == null || totalCents < 100 || !firstDue) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: "Titular, plano, valor (≥ R$ 1) e 1º vencimento são obrigatórios",
        });
        continue;
      }

      try {
        const base = Math.floor(totalCents / installmentsCount);
        const installments = Array.from({ length: installmentsCount }, (_, idx) => {
          const dueDate = new Date(firstDue);
          dueDate.setMonth(dueDate.getMonth() + idx);
          const isLast = idx === installmentsCount - 1;
          return {
            number: idx + 1,
            dueDate,
            amountCents: isLast ? totalCents - base * (installmentsCount - 1) : base,
            status: "pendente" as const,
          };
        });
        const seq = await nextSeq(session.tenantId, "contract");
        const code = `CT-${String(seq).padStart(4, "0")}`;
        await Contract.create({
          tenantId: session.tenantId,
          code,
          customerName,
          customerPhone: cell(row, mapping, "customerPhone") || undefined,
          customerDocument: cell(row, mapping, "customerDocument") || undefined,
          planName,
          totalCents,
          installmentsCount,
          adjustmentRule: "Sem reajuste",
          status: "ativo",
          installments,
        });
        imported++;
        results.push({ row: i + 2, ok: true, code });
      } catch (err) {
        failed++;
        results.push({
          row: i + 2,
          ok: false,
          error: err instanceof Error ? err.message : "Erro ao importar",
        });
      }
    }
  }

  return { imported, failed, results };
}
