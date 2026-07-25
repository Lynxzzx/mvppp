import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Case } from "@/models/Case";
import { FamilyPortalLink } from "@/models/FamilyPortalLink";

type Ctx = { params: Promise<{ id: string }> };

function portalUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/portal/${token}`;
}

/** GET /api/cases/[id]/portal-link — link atual do caso (se houver). */
export const GET = withAuth<Ctx>(async (_req, session, ctx) => {
  const { id } = await ctx.params;
  const link = await FamilyPortalLink.findOne({
    tenantId: session.tenantId,
    caseId: toObjectId(id),
    active: true,
  }).lean<{ token: string; expiresAt?: Date }>();
  if (!link) return NextResponse.json({ link: null });
  return NextResponse.json({
    link: { url: portalUrl(link.token), expiresAt: link.expiresAt ?? null },
  });
}, { feature: "portal" });

const createSchema = z.object({
  // Expiração em dias a partir de agora; padrão 30 (PRD 6.6 — configurável)
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/** POST /api/cases/[id]/portal-link — gera (ou regenera) o link único. */
export const POST = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const { expiresInDays } = await parseBody(req, createSchema);

    const found = await Case.findOne({ _id: objectId, tenantId: session.tenantId });
    if (!found) return jsonError("Caso não encontrado", 404);

    // Desativa links anteriores do caso e cria um novo token
    await FamilyPortalLink.updateMany(
      { tenantId: session.tenantId, caseId: objectId, active: true },
      { $set: { active: false } }
    );

    const days = expiresInDays ?? 30;
    const link = await FamilyPortalLink.create({
      tenantId: session.tenantId,
      caseId: objectId,
      token: randomBytes(24).toString("base64url"),
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      active: true,
      createdBy: session.name,
    });

    found.timeline.push({
      kind: "sistema",
      text: "Link do portal da família gerado",
      userId: session.userId,
      userName: session.name,
    });
    await found.save();

    return NextResponse.json(
      { link: { url: portalUrl(link.token), expiresAt: link.expiresAt } },
      { status: 201 }
    );
  },
  { roles: ["atendente"], feature: "portal" }
);
