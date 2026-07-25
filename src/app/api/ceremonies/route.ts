import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { getEffectivePlan, freeLimitResponse } from "@/lib/entitlements";
import { FREE_LIMITS } from "@/lib/plans";
import { Ceremony } from "@/models/Ceremony";
import { Case } from "@/models/Case";

const createSchema = z
  .object({
    caseId: z.string().min(1, "Selecione o caso"),
    type: z.enum(["velorio", "sepultamento", "cremacao"]),
    startsAt: z.string().min(1, "Informe o início"),
    endsAt: z.string().min(1, "Informe o fim"),
    room: z.string().optional(),
    vehicle: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: "O fim deve ser depois do início",
    path: ["endsAt"],
  });

/** GET /api/ceremonies?from=&to= — cerimônias do período. */
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (from || to) {
    filter.startsAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lt: new Date(to) } : {}),
    };
  }
  const ceremonies = await Ceremony.find(filter).sort({ startsAt: 1 }).limit(500).lean();
  return NextResponse.json({ ceremonies });
});

/**
 * POST /api/ceremonies — agenda cerimônia com bloqueio automático de conflito
 * (mesma sala OU mesmo veículo em horários sobrepostos — PRD 6.2).
 */
export const POST = withAuth(
  async (req, session) => {
    const plan = await getEffectivePlan(session.tenantId);
    if (plan === "free") {
      const count = await Ceremony.countDocuments({ tenantId: session.tenantId });
      if (count >= FREE_LIMITS.ceremonies) {
        return freeLimitResponse("cerimônias", FREE_LIMITS.ceremonies);
      }
    }

    const data = await parseBody(req, createSchema);
    const caseObjectId = toObjectId(data.caseId);
    if (!caseObjectId) return jsonError("Caso não encontrado", 404);

    const parentCase = await Case.findOne({ _id: caseObjectId, tenantId: session.tenantId });
    if (!parentCase) return jsonError("Caso não encontrado", 404);

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    const resourceOr: Record<string, unknown>[] = [];
    if (data.room?.trim()) resourceOr.push({ room: data.room.trim() });
    if (data.vehicle?.trim()) resourceOr.push({ vehicle: data.vehicle.trim() });

    if (resourceOr.length > 0) {
      const conflict = await Ceremony.findOne({
        tenantId: session.tenantId,
        status: "agendada",
        startsAt: { $lt: endsAt },
        endsAt: { $gt: startsAt },
        $or: resourceOr,
      }).lean<{ caseCode: string; room?: string; vehicle?: string; startsAt: Date }>();

      if (conflict) {
        const resource =
          conflict.room && data.room?.trim() === conflict.room
            ? `sala "${conflict.room}"`
            : `veículo "${conflict.vehicle}"`;
        return jsonError(
          `Conflito de agenda: a ${resource} já está reservada para o caso ${conflict.caseCode} neste horário`,
          409
        );
      }
    }

    const ceremony = await Ceremony.create({
      tenantId: session.tenantId,
      caseId: parentCase._id,
      caseCode: parentCase.code,
      deceasedName: parentCase.deceased?.name,
      type: data.type,
      startsAt,
      endsAt,
      room: data.room?.trim() || undefined,
      vehicle: data.vehicle?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    });

    parentCase.timeline.push({
      kind: "sistema",
      text: `Cerimônia agendada para ${startsAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
      userId: session.userId,
      userName: session.name,
    });
    await parentCase.save();

    return NextResponse.json({ id: ceremony._id.toString() }, { status: 201 });
  },
  { roles: ["atendente"] }
);
