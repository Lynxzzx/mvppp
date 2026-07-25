import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string; docId: string }> };

/** GET — download do documento. */
export const GET = withAuth<Ctx>(async (_req, session, ctx) => {
  const { id, docId } = await ctx.params;
  const objectId = toObjectId(id);
  if (!objectId) return jsonError("Documento não encontrado", 404);

  const doc = await Case.findOne(
    { _id: objectId, tenantId: session.tenantId },
    { documents: { $elemMatch: { _id: toObjectId(docId) } } }
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
});

const visibilitySchema = z.object({ visibleToFamily: z.boolean() });

/** PATCH — define se a família vê o documento no portal (PRD 6.6). */
export const PATCH = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id, docId } = await ctx.params;
    const { visibleToFamily } = await parseBody(req, visibilitySchema);
    const updated = await Case.findOneAndUpdate(
      { _id: toObjectId(id), tenantId: session.tenantId, "documents._id": toObjectId(docId) },
      { $set: { "documents.$.visibleToFamily": visibleToFamily } }
    );
    if (!updated) return jsonError("Documento não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: ["atendente"] }
);
