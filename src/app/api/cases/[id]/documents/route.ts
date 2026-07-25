import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError, toObjectId } from "@/lib/api";
import { Case } from "@/models/Case";

type Ctx = { params: Promise<{ id: string }> };

const MAX_SIZE = 2 * 1024 * 1024; // 2MB (ver DECISIONS.md)

const docSchema = z.object({
  name: z.string().min(1).max(200),
  mimeType: z.string().min(1),
  dataBase64: z.string().min(1),
  visibleToFamily: z.boolean().optional(),
});

/** POST /api/cases/[id]/documents — anexa documento ao caso (PRD 6.1). */
export const POST = withAuth<Ctx>(
  async (req, session, ctx) => {
    const { id } = await ctx.params;
    const objectId = toObjectId(id);
    if (!objectId) return jsonError("Caso não encontrado", 404);
    const data = await parseBody(req, docSchema);

    const size = Math.floor((data.dataBase64.length * 3) / 4);
    if (size > MAX_SIZE) return jsonError("Arquivo acima de 2MB", 413);

    const updated = await Case.findOneAndUpdate(
      { _id: objectId, tenantId: session.tenantId },
      {
        $push: {
          documents: {
            name: data.name,
            mimeType: data.mimeType,
            size,
            dataBase64: data.dataBase64,
            visibleToFamily: data.visibleToFamily ?? false,
            uploadedBy: session.name,
          },
          timeline: {
            kind: "documento",
            text: `Documento anexado: ${data.name}`,
            userId: session.userId,
            userName: session.name,
          },
        },
      }
    );
    if (!updated) return jsonError("Caso não encontrado", 404);
    return NextResponse.json({ ok: true }, { status: 201 });
  },
  { roles: ["atendente"] }
);
