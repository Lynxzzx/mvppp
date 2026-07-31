import { AiUsage } from "@/models/AiUsage";
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
