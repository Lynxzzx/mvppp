import { extractText, getDocumentProxy } from "unpdf";

const MAX_TEXT = 60_000;

/**
 * Extrai texto de PDF (ou devolve plaintext). Usado no upload da base do chat.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();
  const isPdf =
    mimeType === "application/pdf" || lower.endsWith(".pdf");
  const isText =
    mimeType.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv");

  if (isText) {
    return buffer.toString("utf8").replace(/\0/g, "").slice(0, MAX_TEXT);
  }

  if (!isPdf) {
    throw new Error("Formato não suportado. Envie PDF ou TXT.");
  }

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = (Array.isArray(text) ? text.join("\n") : String(text ?? ""))
    .replace(/\s+\n/g, "\n")
    .trim();

  if (!joined) {
    return "(Não foi possível extrair texto deste PDF — pode ser imagem/scan. Cole o conteúdo em Preços ou Políticas.)";
  }
  return joined.slice(0, MAX_TEXT);
}
