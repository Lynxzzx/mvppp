import { NextRequest, NextResponse } from "next/server";
import { withAuth, jsonError, toObjectId } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";

type Ctx = { params: Promise<{ id: string }> };

/** GET — download do documento (admin). */
export const GET = withAuth(
  async (_req: NextRequest, session, ctx: Ctx) => {
    const { id } = await ctx.params;
    const docId = toObjectId(id);
    if (!docId) return jsonError("Documento inválido", 400);

    const kb = await ChatKnowledgeBase.findOne({
      tenantId: session.tenantId,
      "uploadedDocuments._id": docId,
    })
      .select("+uploadedDocuments.dataBase64")
      .lean<{
        uploadedDocuments?: {
          _id: { equals(id: unknown): boolean };
          fileName: string;
          mimeType?: string;
          dataBase64?: string;
        }[];
      }>();

    const file = kb?.uploadedDocuments?.find((d) => d._id.equals(docId));
    if (!file?.dataBase64) return jsonError("Documento não encontrado", 404);

    return new NextResponse(Buffer.from(file.dataBase64, "base64"), {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      },
    });
  },
  { roles: [] }
);

/** DELETE — remove documento da base. */
export const DELETE = withAuth(
  async (_req: NextRequest, session, ctx: Ctx) => {
    const { id } = await ctx.params;
    const docId = toObjectId(id);
    if (!docId) return jsonError("Documento inválido", 400);

    const res = await ChatKnowledgeBase.updateOne(
      { tenantId: session.tenantId },
      { $pull: { uploadedDocuments: { _id: docId } } }
    );

    if (!res.modifiedCount) return jsonError("Documento não encontrado", 404);
    return NextResponse.json({ ok: true });
  },
  { roles: [] }
);
