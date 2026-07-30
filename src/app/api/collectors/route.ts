import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { withAuth, parseBody, jsonError } from "@/lib/api";
import { CollectorAccess } from "@/models/CollectorAccess";

export const GET = withAuth(async (_req, session) => {
  const list = await CollectorAccess.find({ tenantId: session.tenantId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return NextResponse.json({
    collectors: list.map((c) => ({
      id: String(c._id),
      name: c.name,
      phone: c.phone,
      active: c.active,
      expiresAt: c.expiresAt,
      url: `${base}/cobrador/${c.token}`,
      createdAt: c.createdAt,
    })),
  });
}, { roles: ["admin", "financeiro"], feature: "contratos" });

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = await parseBody(req, CreateSchema);
  const token = randomBytes(24).toString("base64url");
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86400000)
    : undefined;

  const doc = await CollectorAccess.create({
    tenantId: session.tenantId,
    token,
    name: body.name,
    phone: body.phone,
    expiresAt,
    createdBy: session.userId,
    active: true,
  });

  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return NextResponse.json(
    {
      id: doc._id.toString(),
      url: `${base}/cobrador/${token}`,
      token,
    },
    { status: 201 }
  );
}, { roles: ["admin"], feature: "contratos" });
