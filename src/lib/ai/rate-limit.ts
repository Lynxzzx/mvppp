import { AiUsage } from "@/models/AiUsage";
import { PublicChatUsage } from "@/models/PublicChatUsage";
import { toObjectId } from "@/lib/api";
import { getAiPlatformConfig } from "@/lib/ai/platform-config";

function hourWindowKey(d = new Date()): string {
  return d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
}

export class AiRateLimitError extends Error {
  status = 429;
  constructor(message = "Limite de uso de IA atingido. Tente novamente em instantes.") {
    super(message);
    this.name = "AiRateLimitError";
  }
}

/** Limites do endpoint público (mais restritivos que o painel). */
const PUBLIC_CHAT_IP_LIMIT = 20;
const PUBLIC_CHAT_SLUG_LIMIT = 120;

/**
 * Incrementa o contador da janela atual.
 * Lança AiRateLimitError se o limite horário for ultrapassado.
 */
export async function assertAiRateLimit(tenantId: string): Promise<void> {
  const oid = toObjectId(tenantId);
  if (!oid) throw new AiRateLimitError("Tenant inválido para rate limit");

  const cfg = await getAiPlatformConfig();
  const limit = cfg.rateLimitPerHour > 0 ? cfg.rateLimitPerHour : 60;
  const windowKey = hourWindowKey();

  const doc = await AiUsage.findOneAndUpdate(
    { tenantId: oid, windowKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  ).lean<{ count: number }>();

  if ((doc?.count ?? 0) > limit) {
    throw new AiRateLimitError();
  }
}

async function bumpPublicKey(key: string, limit: number): Promise<void> {
  const windowKey = hourWindowKey();
  const doc = await PublicChatUsage.findOneAndUpdate(
    { key, windowKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  ).lean<{ count: number }>();

  if ((doc?.count ?? 0) > limit) {
    throw new AiRateLimitError(
      "Muitas mensagens neste chat. Aguarde um pouco ou fale pelo WhatsApp."
    );
  }
}

/**
 * Rate limit do chat público: por IP+slug e por slug (anti-abuso).
 */
export async function assertPublicChatRateLimit(
  slug: string,
  ip: string
): Promise<void> {
  const safeSlug = slug.toLowerCase().slice(0, 80);
  const safeIp = (ip || "unknown").slice(0, 64);
  await bumpPublicKey(`ip:${safeSlug}:${safeIp}`, PUBLIC_CHAT_IP_LIMIT);
  await bumpPublicKey(`slug:${safeSlug}`, PUBLIC_CHAT_SLUG_LIMIT);
}
