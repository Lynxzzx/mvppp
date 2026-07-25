import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api";
import { getEffectivePlan, freeLimitResponse } from "@/lib/entitlements";
import { FREE_LIMITS } from "@/lib/plans";
import { Case } from "@/models/Case";
import { nextSeq } from "@/models/Counter";
import { CHECKLIST_TEMPLATES } from "@/lib/checklists";

const createCaseSchema = z.object({
  family: z.object({
    name: z.string().min(2, "Informe o nome do responsável"),
    phone: z.string().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    relationship: z.string().optional(),
    document: z.string().optional(),
  }),
  deceased: z.object({
    name: z.string().min(2, "Informe o nome do falecido"),
    dateOfBirth: z.string().optional(),
    dateOfDeath: z.string().optional(),
    placeOfDeath: z.string().optional(),
  }),
  serviceType: z.enum(["velorio", "sepultamento", "cremacao"]),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
});

/** GET /api/cases — lista casos do tenant (filtros: status, q). */
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && ["novo", "em_andamento", "encerrado"].includes(status)) {
    filter.status = status;
  }
  if (q) {
    filter.$or = [
      { "deceased.name": { $regex: q, $options: "i" } },
      { "family.name": { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
    ];
  }

  // Projeção de inclusão: excluir "-documents" colide com o select:false
  // de documents.dataBase64 no schema (Path collision no MongoDB).
  const cases = await Case.find(filter)
    .select("code status serviceType deceased.name family.name unitId createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ cases });
});

/** POST /api/cases — cria caso com checklist do tipo de serviço (PRD 6.1). */
export const POST = withAuth(
  async (req, session) => {
    const plan = await getEffectivePlan(session.tenantId);
    if (plan === "free") {
      const count = await Case.countDocuments({ tenantId: session.tenantId });
      if (count >= FREE_LIMITS.cases) return freeLimitResponse("casos", FREE_LIMITS.cases);
    }

    const data = await parseBody(req, createCaseSchema);
    const seq = await nextSeq(session.tenantId, "case");
    const year = new Date().getFullYear();

    const created = await Case.create({
      tenantId: session.tenantId,
      code: `${year}-${String(seq).padStart(4, "0")}`,
      family: { ...data.family, email: data.family.email || undefined },
      deceased: {
        ...data.deceased,
        dateOfBirth: data.deceased.dateOfBirth ? new Date(data.deceased.dateOfBirth) : undefined,
        dateOfDeath: data.deceased.dateOfDeath ? new Date(data.deceased.dateOfDeath) : undefined,
      },
      serviceType: data.serviceType,
      status: "novo",
      assigneeId: data.assigneeId || session.userId,
      assigneeName: data.assigneeName || session.name,
      checklist: CHECKLIST_TEMPLATES[data.serviceType].map((label) => ({ label })),
      timeline: [
        {
          kind: "criacao",
          text: "Caso registrado",
          userId: session.userId,
          userName: session.name,
        },
      ],
    });

    return NextResponse.json({ id: created._id.toString(), code: created.code }, { status: 201 });
  },
  { roles: ["atendente"] }
);
