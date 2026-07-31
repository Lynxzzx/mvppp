import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withAuth, jsonError, parseBody, toObjectId } from "@/lib/api";
import { ChatKnowledgeBase } from "@/models/ChatKnowledgeBase";
import { extractDocumentText } from "@/lib/ai/extract-document-text";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DOCS = 12;

const BodySchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(120),
  dataBase64: z.string().min(1),
});

/** POST — upload de PDF/TXT para a base do chat (extrai texto). */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await parseBody(req, BodySchema);
    const oid = toObjectId(session.tenantId)!;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(body.dataBase64, "base64");
    } catch {
      return jsonError("Arquivo inválido", 400);
    }
    if (!buffer.length) return jsonError("Arquivo vazio", 400);
    if (buffer.length > MAX_BYTES) {
      return jsonError("Arquivo maior que 2 MB", 400);
    }

    const kb = await ChatKnowledgeBase.findOne({ tenantId: oid });
    if (!kb) return jsonError("Configure o chat antes de enviar documentos", 400);
    if ((kb.uploadedDocuments?.length ?? 0) >= MAX_DOCS) {
      return jsonError(`Limite de ${MAX_DOCS} documentos atingido`, 400);
    }

    let extractedText: string;
    try {
      extractedText = await extractDocumentText(buffer, body.mimeType, body.fileName);
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Falha ao ler o documento",
        400
      );
    }

    // Gera _id antes do save — storageUrl é required e "" falha na validação.
    const docId = new mongoose.Types.ObjectId();
    const storageUrl = `/api/chat-kb/documents/${docId.toString()}`;

    kb.uploadedDocuments.push({
      _id: docId,
      fileName: body.fileName,
      storageUrl,
      extractedText,
      mimeType: body.mimeType,
      dataBase64: body.dataBase64,
    } as never);
    await kb.save();

    return NextResponse.json({
      id: docId.toString(),
      fileName: body.fileName,
      storageUrl,
      extractedChars: extractedText.length,
      mimeType: body.mimeType,
    });
  },
  { roles: [] }
);
