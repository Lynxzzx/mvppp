import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { PublicChatSession } from "@/models/PublicChatSession";
import { whatsappChatUrl } from "@/lib/ai/public-chat";
import { Tenant } from "@/models/Tenant";

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = z.object({
  sessionId: z.string().trim().min(8).max(80),
});

/** POST — marca transferência para WhatsApp (analytics / histórico). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    await dbConnect();
    const { slug } = await ctx.params;
    const normalized = slug.trim().toLowerCase();
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return jsonError("Sessão inválida", 400);

    const kb = await ChatKnowledgeBase.findOne({ slug: normalized, isActive: true })
      .select("tenantId whatsappNumber")
      .lean<{ tenantId: unknown; whatsappNumber?: string }>();
    if (!kb) return jsonError("Chat indisponível", 404);

    await PublicChatSession.updateOne(
      { tenantId: kb.tenantId, sessionId: parsed.data.sessionId },
      { $set: { handoffToWhatsapp: true } },
      { upsert: false }
    );

    const tenant = await Tenant.findById(kb.tenantId)
      .select("name")
      .lean<{ name: string }>();

    const url = whatsappChatUrl(
      kb.whatsappNumber ?? "",
      `Olá, vim pelo chat da ${tenant?.name ?? "funerária"} no Veluxa.`
    );

    return NextResponse.json({ ok: true, whatsappUrl: url });
  } catch (err) {
    console.error("[public-chat/handoff]", err);
    return jsonError("Erro interno", 500);
  }
}
