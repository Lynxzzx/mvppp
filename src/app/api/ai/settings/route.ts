import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, jsonError, parseBody, toObjectId } from "@/lib/api";
import {
  AI_FEATURES,
  AI_FEATURE_DESCRIPTION,
  AI_FEATURE_LABEL,
  isAiFeature,
} from "@/lib/ai/features";
import { resolveModel } from "@/lib/ai/openrouter";
import { getAiPlatformConfig } from "@/lib/ai/platform-config";
import { AiSettings } from "@/models/AiSettings";

/** Lista configurações efetivas do tenant (admin). */
export const GET = withAuth(
  async (_req, session) => {
    const oid = toObjectId(session.tenantId);
    const [tenantRows, globalRows] = await Promise.all([
      oid
        ? AiSettings.find({ tenantId: oid }).lean<
            { feature: string; model: string; note?: string; updatedAt?: Date }[]
          >()
        : Promise.resolve([]),
      AiSettings.find({ tenantId: null }).lean<
        { feature: string; model: string; note?: string }[]
      >(),
    ]);

    const byTenant = new Map(tenantRows.map((r) => [r.feature, r]));
    const byGlobal = new Map(globalRows.map((r) => [r.feature, r]));

    const features = await Promise.all(
      AI_FEATURES.map(async (feature) => {
        const tenant = byTenant.get(feature);
        const global = byGlobal.get(feature);
        const effectiveModel = await resolveModel(feature, session.tenantId);
        return {
          feature,
          label: AI_FEATURE_LABEL[feature],
          description: AI_FEATURE_DESCRIPTION[feature],
          model: tenant?.model ?? null,
          note: tenant?.note ?? "",
          globalModel: global?.model ?? null,
          effectiveModel,
          source: tenant?.model
            ? ("tenant" as const)
            : global?.model
              ? ("global" as const)
              : ("env" as const),
          updatedAt: tenant?.updatedAt ?? null,
        };
      })
    );

    const platform = await getAiPlatformConfig();
    return NextResponse.json({
      features,
      defaultModel: platform.defaultModel,
    });
  },
  { roles: [] }
);

const PutSchema = z.object({
  feature: z.string().refine(isAiFeature, "Funcionalidade inválida"),
  model: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional().nullable(),
});

/** Upsert da config do tenant para uma feature (admin). */
export const PUT = withAuth(
  async (req: NextRequest, session) => {
    const body = await parseBody(req, PutSchema);
    const oid = toObjectId(session.tenantId);
    if (!oid) return jsonError("Tenant inválido", 400);

    const doc = await AiSettings.findOneAndUpdate(
      { tenantId: oid, feature: body.feature },
      {
        $set: {
          model: body.model,
          note: body.note?.trim() || "",
          updatedBy: toObjectId(session.userId),
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      ok: true,
      setting: {
        feature: doc?.feature,
        model: doc?.model,
        note: doc?.note ?? "",
      },
    });
  },
  { roles: [] }
);
