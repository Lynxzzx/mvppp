import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, jsonError, parseBody, toObjectId } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { Tenant } from "@/models/Tenant";
import {
  normalizeWhatsappDigits,
  publicChatAppUrl,
  slugifyTenantName,
} from "@/lib/ai/public-chat";

const FaqSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(4000),
});

const PutSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (use letras minúsculas, números e hífens)")
    .optional(),
  whatsappNumber: z.string().trim().max(20).optional(),
  faq: z.array(FaqSchema).max(80).optional(),
  pricingInfo: z.string().max(20_000).optional(),
  policies: z.string().max(20_000).optional(),
  isActive: z.boolean().optional(),
  welcomeMessage: z.string().trim().max(500).optional(),
});

async function ensureKb(tenantId: string) {
  const oid = toObjectId(tenantId)!;
  let kb = await ChatKnowledgeBase.findOne({ tenantId: oid });
  if (kb) return kb;

  const tenant = await Tenant.findById(oid).select("name").lean<{ name: string }>();
  let base = slugifyTenantName(tenant?.name ?? "funeraria");
  let slug = base;
  let n = 2;
  while (await ChatKnowledgeBase.exists({ slug })) {
    slug = `${base}-${n++}`.slice(0, 80);
  }

  kb = await ChatKnowledgeBase.create({
    tenantId: oid,
    slug,
    isActive: false,
  });
  return kb;
}

function serialize(kb: {
  _id: unknown;
  slug: string;
  whatsappNumber?: string;
  faq?: { _id?: unknown; question: string; answer: string }[];
  pricingInfo?: string;
  policies?: string;
  uploadedDocuments?: {
    _id?: unknown;
    fileName: string;
    storageUrl: string;
    extractedText?: string;
    mimeType?: string;
    createdAt?: Date;
  }[];
  isActive?: boolean;
  welcomeMessage?: string;
  updatedAt?: Date;
}) {
  return {
    id: String(kb._id),
    slug: kb.slug,
    publicUrl: publicChatAppUrl(kb.slug),
    whatsappNumber: kb.whatsappNumber ?? "",
    faq: (kb.faq ?? []).map((f) => ({
      id: f._id ? String(f._id) : undefined,
      question: f.question,
      answer: f.answer,
    })),
    pricingInfo: kb.pricingInfo ?? "",
    policies: kb.policies ?? "",
    uploadedDocuments: (kb.uploadedDocuments ?? []).map((d) => ({
      id: d._id ? String(d._id) : undefined,
      fileName: d.fileName,
      storageUrl: d.storageUrl,
      extractedChars: (d.extractedText ?? "").length,
      mimeType: d.mimeType ?? "application/pdf",
      createdAt: d.createdAt ?? null,
    })),
    isActive: Boolean(kb.isActive),
    welcomeMessage: kb.welcomeMessage ?? "",
    updatedAt: kb.updatedAt ?? null,
  };
}

/** GET — base de conhecimento do chat da funerária (cria se não existir). */
export const GET = withAuth(
  async (_req, session) => {
    const kb = await ensureKb(session.tenantId);
    return NextResponse.json(serialize(kb.toObject()));
  },
  { roles: [] }
);

/** PUT — atualiza FAQ, preços, políticas, WhatsApp, slug e ativação. */
export const PUT = withAuth(
  async (req: NextRequest, session) => {
    const body = await parseBody(req, PutSchema);
    const kb = await ensureKb(session.tenantId);

    if (body.slug !== undefined && body.slug !== kb.slug) {
      const taken = await ChatKnowledgeBase.exists({
        slug: body.slug,
        tenantId: { $ne: toObjectId(session.tenantId) },
      });
      if (taken) return jsonError("Este link já está em uso por outra funerária", 409);
      kb.slug = body.slug;
    }

    if (body.whatsappNumber !== undefined) {
      kb.whatsappNumber = normalizeWhatsappDigits(body.whatsappNumber);
    }
    if (body.faq !== undefined) kb.faq = body.faq;
    if (body.pricingInfo !== undefined) kb.pricingInfo = body.pricingInfo;
    if (body.policies !== undefined) kb.policies = body.policies;
    if (body.isActive !== undefined) {
      if (body.isActive && !normalizeWhatsappDigits(kb.whatsappNumber || body.whatsappNumber || "")) {
        return jsonError(
          "Informe o WhatsApp de atendimento antes de ativar o chat público",
          400
        );
      }
      kb.isActive = body.isActive;
    }
    if (body.welcomeMessage !== undefined) kb.welcomeMessage = body.welcomeMessage;

    await kb.save();
    return NextResponse.json(serialize(kb.toObject()));
  },
  { roles: [] }
);
