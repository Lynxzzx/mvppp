import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { toObjectId, jsonError } from "@/lib/api";
import { FamilyPortalLink } from "@/models/FamilyPortalLink";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ token: string; docId: string }> };

/**
 * GET — download público de documento do portal da família (PRD 6.6).
 * Sem autenticação: o token do link é a credencial; só documentos marcados
 * como visíveis à família são servidos.
 */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token, docId } = await ctx.params;
    await dbConnect();

    const link = await FamilyPortalLink.findOne({ token, active: true }).lean<{
      tenantId: unknown;
      caseId: unknown;
      expiresAt?: Date;
    }>();
    if (!link) return jsonError("Link inválido", 404);
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return jsonError("Link expirado", 410);
    }

    const doc = await Case.findOne(
      { _id: link.caseId, tenantId: link.tenantId },
      { documents: { $elemMatch: { _id: toObjectId(docId), visibleToFamily: true } } }
    )
      .select("+documents.dataBase64")
      .lean<{ documents?: { name: string; mimeType: string; dataBase64: string }[] }>();

    const file = doc?.documents?.[0];
    if (!file) return jsonError("Documento não encontrado", 404);

    return new NextResponse(Buffer.from(file.dataBase64, "base64"), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      },
    });
  } catch (err) {
    console.error("[portal/documents]", err);
    return jsonError("Erro interno", 500);
  }
}
