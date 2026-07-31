import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { Tenant } from "@/models/Tenant";
import { whatsappChatUrl } from "@/lib/ai/public-chat";

type Ctx = { params: Promise<{ slug: string }> };

/** GET — metadados públicos do chat (sem conteúdo da base). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await dbConnect();
    const { slug } = await ctx.params;
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return jsonError("Link inválido", 400);

    const kb = await ChatKnowledgeBase.findOne({ slug: normalized })
      .select("tenantId whatsappNumber isActive welcomeMessage")
      .lean<{
        tenantId: { toString(): string };
        whatsappNumber?: string;
        isActive?: boolean;
        welcomeMessage?: string;
      }>();

    if (!kb || !kb.isActive) {
      return jsonError("Chat indisponível", 404);
    }

    const tenant = await Tenant.findById(kb.tenantId)
      .select("name active")
      .lean<{ name: string; active?: boolean }>();

    if (!tenant || tenant.active === false) {
      return jsonError("Chat indisponível", 404);
    }

    const wa = whatsappChatUrl(
      kb.whatsappNumber ?? "",
      `Olá, vim pelo chat da ${tenant.name} no Veluxa.`
    );

    return NextResponse.json({
      slug: normalized,
      tenantName: tenant.name,
      welcomeMessage: kb.welcomeMessage ?? "",
      whatsappUrl: wa,
      hasWhatsapp: Boolean(wa),
    });
  } catch (err) {
    console.error("[public-chat]", err);
    return jsonError("Erro interno", 500);
  }
}
