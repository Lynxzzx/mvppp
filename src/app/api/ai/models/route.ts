import { NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { listOpenRouterModels, AiProviderError } from "@/lib/ai/openrouter";

/** Lista modelos do OpenRouter para o seletor de configurações (admin). */
export const GET = withAuth(
  async () => {
    try {
      const models = await listOpenRouterModels();
      return NextResponse.json({ models });
    } catch (err) {
      if (err instanceof AiProviderError) {
        return jsonError(err.message, err.status);
      }
      throw err;
    }
  },
  { roles: [] }
);
