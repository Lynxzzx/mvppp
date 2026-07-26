import { AiSettings } from "@/models/AiSettings";
import { AuditLog } from "@/models/AuditLog";
import { toObjectId } from "@/lib/api";
import {
  type AiFeature,
  isRecommendedModel,
} from "@/lib/ai/features";
import { assertAiRateLimit, AiRateLimitError } from "@/lib/ai/rate-limit";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 45_000;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt?: string; completion?: string };
  provider: string;
  recommended: boolean;
};

export class AiProviderError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 502, code = "ai_error") {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
    this.code = code;
  }
}

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new AiProviderError(
      "IA não configurada (OPENROUTER_API_KEY ausente).",
      503,
      "ai_not_configured"
    );
  }
  return key;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://veluxa.app";
}

function defaultModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL?.trim() || "anthropic/claude-haiku-4.5";
}

function openRouterHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": appUrl(),
    "X-Title": "Veluxa",
  };
}

/**
 * Ordem: model explícito → config do tenant → config global → OPENROUTER_DEFAULT_MODEL.
 */
export async function resolveModel(
  feature: AiFeature,
  tenantId: string,
  override?: string | null
): Promise<string> {
  if (override?.trim()) return override.trim();

  const oid = toObjectId(tenantId);
  if (oid) {
    const tenantCfg = await AiSettings.findOne({ tenantId: oid, feature })
      .select("model")
      .lean<{ model: string }>();
    if (tenantCfg?.model) return tenantCfg.model;
  }

  const globalCfg = await AiSettings.findOne({ tenantId: null, feature })
    .select("model")
    .lean<{ model: string }>();
  if (globalCfg?.model) return globalCfg.model;

  return defaultModel();
}

async function chatCompletionsOnce(
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal
): Promise<{ content: string; model: string; usage?: unknown }> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
    signal,
  });

  const raw = await res.text();
  type CompletionJson = {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
    model?: string;
    usage?: unknown;
  };
  let data: CompletionJson | null = null;
  try {
    data = JSON.parse(raw) as CompletionJson;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error?.message || raw.slice(0, 200) || `HTTP ${res.status}`;
    const retryable = res.status >= 500 || res.status === 429 || res.status === 408;
    throw new AiProviderError(
      msg,
      retryable ? 502 : res.status === 401 ? 503 : 400,
      retryable ? "ai_upstream_retryable" : "ai_upstream"
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AiProviderError("Resposta vazia do modelo.", 502, "ai_empty");
  }

  return { content, model: data?.model || model, usage: data?.usage };
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AiProviderError) {
    return err.code === "ai_upstream_retryable" || err.code === "ai_empty";
  }
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

export type ChatCompletionParams = {
  messages: ChatMessage[];
  tenantId: string;
  feature: AiFeature;
  /** Força um model (pula resolução). */
  model?: string | null;
  userId?: string;
  userName?: string;
  /** Se false, não aplica rate limit (uso interno raro). */
  rateLimit?: boolean;
};

export type ChatCompletionResult = {
  content: string;
  model: string;
  usedFallback: boolean;
};

/**
 * Único ponto de saída para chat completions via OpenRouter.
 * Aplica rate limit, resolve modelo, faz fallback para OPENROUTER_DEFAULT_MODEL.
 */
export async function chatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResult> {
  const { messages, tenantId, feature, model: modelOverride, userId, userName } = params;

  if (params.rateLimit !== false) {
    await assertAiRateLimit(tenantId);
  }

  const primary = await resolveModel(feature, tenantId, modelOverride);
  const fallback = defaultModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let usedFallback = false;
  let result: { content: string; model: string; usage?: unknown };
  let status: "ok" | "fallback_ok" | "error" = "ok";
  let errorMessage: string | undefined;

  try {
    try {
      result = await chatCompletionsOnce(primary, messages, controller.signal);
    } catch (err) {
      if (primary !== fallback && isRetryable(err)) {
        usedFallback = true;
        status = "fallback_ok";
        result = await chatCompletionsOnce(fallback, messages, controller.signal);
      } else {
        throw err;
      }
    }
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : "erro desconhecido";
    const logTenant = toObjectId(tenantId);
    if (logTenant) {
      await AuditLog.create({
        tenantId: logTenant,
        userId: toObjectId(userId) ?? logTenant,
        userName: userName ?? "sistema",
        action: "ai.chat.error",
        entity: "AiCall",
        meta: {
          feature,
          model: primary,
          fallback,
          status,
          error: errorMessage,
        },
      }).catch(() => null);
    }
    if (err instanceof AiRateLimitError || err instanceof AiProviderError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiProviderError("Tempo esgotado na chamada de IA.", 504, "ai_timeout");
    }
    throw new AiProviderError(
      err instanceof Error ? err.message : "Falha na IA",
      502,
      "ai_error"
    );
  } finally {
    clearTimeout(timer);
  }

  const logTenant = toObjectId(tenantId);
  if (logTenant) {
    await AuditLog.create({
      tenantId: logTenant,
      userId: toObjectId(userId) ?? logTenant,
      userName: userName ?? "sistema",
      action: usedFallback ? "ai.chat.fallback" : "ai.chat.ok",
      entity: "AiCall",
      meta: {
        feature,
        model: result!.model,
        requestedModel: primary,
        usedFallback,
        usage: result!.usage,
        status,
      },
    }).catch(() => null);
  }

  console.info("[ai]", {
    feature,
    tenantId,
    model: result!.model,
    requestedModel: primary,
    usedFallback,
    status,
  });

  return {
    content: result!.content,
    model: result!.model,
    usedFallback,
  };
}

/** Lista modelos do OpenRouter (proxy server-side). */
export async function listOpenRouterModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: openRouterHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new AiProviderError(
      `Falha ao listar modelos (${res.status}).`,
      502,
      "ai_models_list"
    );
  }

  const data = (await res.json()) as {
    data?: {
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: { prompt?: string; completion?: string };
    }[];
  };

  const models = (data.data ?? []).map((m) => {
    const provider = m.id.includes("/") ? m.id.split("/")[0]! : "other";
    return {
      id: m.id,
      name: m.name || m.id,
      description: m.description,
      contextLength: m.context_length,
      pricing: m.pricing,
      provider,
      recommended: isRecommendedModel(m.id),
    } satisfies OpenRouterModel;
  });

  models.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return models;
}

export { AiRateLimitError };
