import { NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { Contract } from "@/models/Contract";
import { formatBRL } from "@/lib/format";
import { toObjectId } from "@/lib/api";

/**
 * POST — gera um rascunho de pricingInfo a partir dos nomes de plano
 * distintos nos contratos ativos (sem dados de clientes).
 */
export const POST = withAuth(
  async (_req, session) => {
    const oid = toObjectId(session.tenantId)!;
    const kb = await ChatKnowledgeBase.findOne({ tenantId: oid });
    if (!kb) return jsonError("Configure o chat primeiro", 400);

    const rows = await Contract.aggregate<{
      _id: string;
      count: number;
      avgCents: number;
      minCents: number;
      maxCents: number;
    }>([
      { $match: { tenantId: oid, status: "ativo" } },
      {
        $group: {
          _id: "$planName",
          count: { $sum: 1 },
          avgCents: { $avg: "$totalCents" },
          minCents: { $min: "$totalCents" },
          maxCents: { $max: "$totalCents" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
    ]);

    if (!rows.length) {
      return jsonError("Nenhum contrato ativo encontrado para importar", 404);
    }

    const lines = [
      "Planos (resumo gerado a partir dos contratos ativos — valores sujeitos a confirmação):",
      "",
      ...rows.map((r) => {
        const avg = formatBRL(Math.round(r.avgCents || 0));
        const min = formatBRL(Math.round(r.minCents || 0));
        const max = formatBRL(Math.round(r.maxCents || 0));
        const range =
          r.minCents === r.maxCents ? avg : `${min} a ${max} (média ${avg})`;
        return `- ${r._id}: ${range} · ${r.count} contrato(s) ativo(s) de referência`;
      }),
      "",
      "Edite este texto antes de publicar. Não confirme valores sem a equipe.",
    ];

    const draft = lines.join("\n");
    const merged = kb.pricingInfo?.trim()
      ? `${kb.pricingInfo.trim()}\n\n---\n\n${draft}`
      : draft;

    kb.pricingInfo = merged.slice(0, 20_000);
    await kb.save();

    return NextResponse.json({ pricingInfo: kb.pricingInfo });
  },
  { roles: [] }
);
