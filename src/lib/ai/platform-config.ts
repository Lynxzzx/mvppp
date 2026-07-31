import { dbConnect } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto-secret";
import { AI_DEFAULT_MODEL } from "@/lib/ai/features";
import {
  PlatformSettings,
  PLATFORM_SETTINGS_KEY,
} from "@/models/PlatformSettings";

export type ResolvedAiPlatformConfig = {
  apiKey: string | null;
  defaultModel: string;
  rateLimitPerHour: number;
  /** Origem da API key: painel sysadmin ou variável de ambiente. */
  apiKeySource: "database" | "env" | "none";
  defaultModelSource: "database" | "env" | "builtin";
};

let cache: { at: number; value: ResolvedAiPlatformConfig } | null = null;
const CACHE_MS = 15_000;

export function clearPlatformAiConfigCache() {
  cache = null;
}

/**
 * Resolve config de IA: Mongo (sysadmin) tem prioridade sobre .env.
 */
export async function getAiPlatformConfig(): Promise<ResolvedAiPlatformConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  await dbConnect();
  const doc = await PlatformSettings.findOne({ key: PLATFORM_SETTINGS_KEY })
    .select("openRouterApiKeyEnc openRouterDefaultModel openRouterRateLimitPerHour")
    .lean<{
      openRouterApiKeyEnc?: string;
      openRouterDefaultModel?: string;
      openRouterRateLimitPerHour?: number;
    }>();

  let apiKey: string | null = null;
  let apiKeySource: ResolvedAiPlatformConfig["apiKeySource"] = "none";

  if (doc?.openRouterApiKeyEnc) {
    try {
      apiKey = decryptSecret(doc.openRouterApiKeyEnc).trim() || null;
      if (apiKey) apiKeySource = "database";
    } catch {
      apiKey = null;
    }
  }

  if (!apiKey) {
    const envKey = process.env.OPENROUTER_API_KEY?.trim();
    if (envKey) {
      apiKey = envKey;
      apiKeySource = "env";
    }
  }

  let defaultModel = AI_DEFAULT_MODEL;
  let defaultModelSource: ResolvedAiPlatformConfig["defaultModelSource"] = "builtin";
  if (doc?.openRouterDefaultModel?.trim()) {
    defaultModel = doc.openRouterDefaultModel.trim();
    defaultModelSource = "database";
  } else if (process.env.OPENROUTER_DEFAULT_MODEL?.trim()) {
    defaultModel = process.env.OPENROUTER_DEFAULT_MODEL.trim();
    defaultModelSource = "env";
  }

  const envLimit = Number(process.env.OPENROUTER_RATE_LIMIT_PER_HOUR ?? 60);
  const rateLimitPerHour =
    typeof doc?.openRouterRateLimitPerHour === "number" &&
    doc.openRouterRateLimitPerHour > 0
      ? doc.openRouterRateLimitPerHour
      : Number.isFinite(envLimit) && envLimit > 0
        ? envLimit
        : 60;

  const value: ResolvedAiPlatformConfig = {
    apiKey,
    defaultModel,
    rateLimitPerHour,
    apiKeySource,
    defaultModelSource,
  };
  cache = { at: Date.now(), value };
  return value;
}
