import { NextResponse } from "next/server";
import { z } from "zod";
import { withPlatformAuth } from "@/lib/platform-admin";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto-secret";
import {
  clearPlatformAiConfigCache,
  getAiPlatformConfig,
} from "@/lib/ai/platform-config";
import { AI_DEFAULT_MODEL } from "@/lib/ai/features";
import {
  PlatformSettings,
  PLATFORM_SETTINGS_KEY,
} from "@/models/PlatformSettings";

/** GET — configuração de IA da plataforma (chave mascarada). */
export const GET = withPlatformAuth(async () => {
  const doc = await PlatformSettings.findOne({ key: PLATFORM_SETTINGS_KEY }).lean<{
    openRouterApiKeyEnc?: string;
    openRouterDefaultModel?: string;
    openRouterRateLimitPerHour?: number;
    updatedAt?: Date;
    updatedBy?: string;
  }>();

  let hasKey = false;
  let maskedKey: string | null = null;
  if (doc?.openRouterApiKeyEnc) {
    try {
      const plain = decryptSecret(doc.openRouterApiKeyEnc);
      hasKey = Boolean(plain.trim());
      maskedKey = maskSecret(plain);
    } catch {
      hasKey = true;
      maskedKey = "•••••••• (não legível — regrave a chave)";
    }
  }

  const resolved = await getAiPlatformConfig();

  return NextResponse.json({
    openRouterApiKeyMasked: maskedKey,
    hasOpenRouterApiKey: hasKey,
    openRouterDefaultModel: doc?.openRouterDefaultModel ?? "",
    openRouterRateLimitPerHour: doc?.openRouterRateLimitPerHour ?? null,
    resolved: {
      apiKeySource: resolved.apiKeySource,
      apiKeyMasked: maskSecret(resolved.apiKey),
      defaultModel: resolved.defaultModel,
      defaultModelSource: resolved.defaultModelSource,
      rateLimitPerHour: resolved.rateLimitPerHour,
      configured: Boolean(resolved.apiKey),
    },
    builtinDefaultModel: AI_DEFAULT_MODEL,
    updatedAt: doc?.updatedAt ?? null,
    updatedBy: doc?.updatedBy ?? null,
  });
});

const PutSchema = z.object({
  openRouterApiKey: z.string().optional().nullable(),
  clearApiKey: z.boolean().optional(),
  openRouterDefaultModel: z.string().trim().max(200).optional().nullable(),
  openRouterRateLimitPerHour: z.number().int().min(1).max(10000).optional().nullable(),
});

/** PUT — salva chave/modelo/limite (chave criptografada). */
export const PUT = withPlatformAuth(async (req, session) => {
  const raw = await req.json().catch(() => ({}));
  const parsed = PutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const body = parsed.data;

  const existing = await PlatformSettings.findOne({ key: PLATFORM_SETTINGS_KEY });
  const $set: Record<string, unknown> = {
    updatedBy: session.username,
  };
  const $unset: Record<string, 1> = {};

  if (body.clearApiKey) {
    $unset.openRouterApiKeyEnc = 1;
  } else if (typeof body.openRouterApiKey === "string" && body.openRouterApiKey.trim()) {
    $set.openRouterApiKeyEnc = encryptSecret(body.openRouterApiKey.trim());
  }

  if (body.openRouterDefaultModel !== undefined) {
    const m = body.openRouterDefaultModel?.trim();
    if (m) $set.openRouterDefaultModel = m;
    else $unset.openRouterDefaultModel = 1;
  }

  if (body.openRouterRateLimitPerHour !== undefined) {
    if (body.openRouterRateLimitPerHour == null) {
      $unset.openRouterRateLimitPerHour = 1;
    } else {
      $set.openRouterRateLimitPerHour = body.openRouterRateLimitPerHour;
    }
  }

  const update: Record<string, unknown> = { $set };
  if (Object.keys($unset).length) update.$unset = $unset;

  await PlatformSettings.findOneAndUpdate(
    { key: PLATFORM_SETTINGS_KEY },
    update,
    { upsert: true, new: true }
  );

  clearPlatformAiConfigCache();

  return NextResponse.json({ ok: true });
});
