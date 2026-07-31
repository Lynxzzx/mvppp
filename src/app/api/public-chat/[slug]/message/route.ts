import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { dbConnect } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { PublicChatSession } from "@/models/PublicChatSession";
import { Tenant } from "@/models/Tenant";
import {
  buildKnowledgeContext,
  detectUrgency,
  urgencyHandoffMessage,
  whatsappChatUrl,
} from "@/lib/ai/public-chat";
import { publicChatMessages } from "@/lib/ai/prompts";
import {
  chatCompletion,
  AiProviderError,
  AiRateLimitError,
} from "@/lib/ai/openrouter";
import { assertPublicChatRateLimit } from "@/lib/ai/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = z.object({
  sessionId: z.string().trim().min(8).max(80).optional(),
  message: z.string().trim().min(1).max(2000),
});

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** POST — mensagem do visitante no chat público (RAG simples + guarda-corpos). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    await dbConnect();
    const { slug } = await ctx.params;
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return jsonError("Link inválido", 400);

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return jsonError("Mensagem inválida", 400);

    try {
      await assertPublicChatRateLimit(normalized, clientIp(req));
    } catch (err) {
      if (err instanceof AiRateLimitError) return jsonError(err.message, 429);
      throw err;
    }

    const kb = await ChatKnowledgeBase.findOne({ slug: normalized }).lean<{
      tenantId: { toString(): string };
      whatsappNumber?: string;
      isActive?: boolean;
      faq?: { question: string; answer: string }[];
      pricingInfo?: string;
      policies?: string;
      uploadedDocuments?: { fileName: string; extractedText?: string }[];
    }>();

    if (!kb?.isActive) return jsonError("Chat indisponível", 404);

    const tenant = await Tenant.findById(kb.tenantId)
      .select("name active")
      .lean<{ name: string; active?: boolean }>();
    if (!tenant || tenant.active === false) {
      return jsonError("Chat indisponível", 404);
    }

    const sessionId = parsed.data.sessionId || randomUUID();
    const userMessage = parsed.data.message;
    const urgent = detectUrgency(userMessage);

    let session = await PublicChatSession.findOne({
      tenantId: kb.tenantId,
      sessionId,
    });
    if (!session) {
      session = await PublicChatSession.create({
        tenantId: kb.tenantId,
        sessionId,
        messages: [],
      });
    }

    const history = (session.messages ?? [])
      .slice(-10)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const waUrl = whatsappChatUrl(
      kb.whatsappNumber ?? "",
      `Olá, vim pelo chat da ${tenant.name} no Veluxa.`
    );

    let assistantContent: string;
    let model: string | null = null;
    let usedFallback = false;

    if (urgent) {
      // Guarda-corpo: urgência → handoff sem inventar FAQ/preços
      assistantContent = urgencyHandoffMessage(tenant.name);
      session.handoffToWhatsapp = true;
    } else {
      const knowledge = buildKnowledgeContext(kb);
      const messages = publicChatMessages({
        tenantName: tenant.name,
        knowledge,
        history,
        userMessage,
      });

      try {
        const result = await chatCompletion({
          messages,
          tenantId: String(kb.tenantId),
          feature: "public-chat",
          userName: "visitante-publico",
        });
        assistantContent = result.content;
        model = result.model;
        usedFallback = result.usedFallback;
      } catch (err) {
        if (err instanceof AiRateLimitError) {
          return jsonError(err.message, 429);
        }
        if (err instanceof AiProviderError) {
          return jsonError(err.message, err.status);
        }
        throw err;
      }
    }

    session.messages.push(
      { role: "user", content: userMessage, timestamp: new Date() },
      { role: "assistant", content: assistantContent, timestamp: new Date() }
    );
    // Mantém histórico curto (privacidade + tamanho)
    if (session.messages.length > 40) {
      session.messages = session.messages.slice(-40);
    }
    await session.save();

    return NextResponse.json({
      sessionId,
      reply: assistantContent,
      model,
      usedFallback,
      urgent,
      suggestWhatsapp: urgent || !assistantContent,
      whatsappUrl: waUrl,
    });
  } catch (err) {
    console.error("[public-chat/message]", err);
    return jsonError("Erro interno", 500);
  }
}
