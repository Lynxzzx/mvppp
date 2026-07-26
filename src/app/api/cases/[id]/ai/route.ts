import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, jsonError, parseBody, toObjectId } from "@/lib/api";
import { isAiFeature } from "@/lib/ai/features";
import {
  chatCompletion,
  AiProviderError,
  AiRateLimitError,
} from "@/lib/ai/openrouter";
import { caseSummaryMessages, obituaryMessages } from "@/lib/ai/prompts";
import { Case } from "@/models/Case";
import type { ServiceType } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  feature: z.string().refine(isAiFeature, "Funcionalidade inválida"),
});

/** Gera texto de IA para o caso (necrológio ou resumo). */
export const POST = withAuth(
  async (req: NextRequest, session, ctx: Ctx) => {
    const { id } = await ctx.params;
    const caseId = toObjectId(id);
    if (!caseId) return jsonError("Caso inválido", 400);

    const body = await parseBody(req, BodySchema);
    const caseDoc = await Case.findOne({
      _id: caseId,
      tenantId: session.tenantId,
    })
      .select("code status serviceType family deceased timeline anonymizedAt")
      .lean<{
        code: string;
        status: string;
        serviceType: ServiceType;
        family: {
          name: string;
          phone?: string;
          email?: string;
          relationship?: string;
        };
        deceased: {
          name: string;
          dateOfBirth?: Date;
          dateOfDeath?: Date;
          placeOfDeath?: string;
        };
        timeline?: {
          kind: string;
          text: string;
          at: Date;
          userName?: string;
        }[];
        anonymizedAt?: Date;
      }>();

    if (!caseDoc) return jsonError("Caso não encontrado", 404);
    if (caseDoc.anonymizedAt) {
      return jsonError("Caso anonimizado — IA indisponível", 400);
    }

    const messages =
      body.feature === "obituary-draft"
        ? obituaryMessages(caseDoc)
        : caseSummaryMessages(caseDoc);

    try {
      const result = await chatCompletion({
        messages,
        tenantId: session.tenantId,
        feature: body.feature,
        userId: session.userId,
        userName: session.name,
      });

      return NextResponse.json({
        feature: body.feature,
        content: result.content,
        model: result.model,
        usedFallback: result.usedFallback,
      });
    } catch (err) {
      if (err instanceof AiRateLimitError) {
        return jsonError(err.message, 429);
      }
      if (err instanceof AiProviderError) {
        return jsonError(err.message, err.status);
      }
      throw err;
    }
  },
  { roles: ["admin", "atendente"] }
);
