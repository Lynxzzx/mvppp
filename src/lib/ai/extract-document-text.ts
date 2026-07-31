import { extractText, getDocumentProxy } from "unpdf";

const MAX_TEXT = 60_000;

/**
 * PDF.js (via unpdf) usa Math.sumPrecise em runtimes recentes.
 * Em Node anterior a 22.5 isso quebra a extração — polyfill mínimo.
 */
function ensureMathSumPrecise() {
  const math = Math as Math & { sumPrecise?: (...values: number[]) => number };
  if (typeof math.sumPrecise === "function") return;
  math.sumPrecise = (...values: number[]) =>
    values.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
}

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

  ensureMathSumPrecise();

  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const joined = (Array.isArray(text) ? text.join("\n") : String(text ?? ""))
      .replace(/\s+\n/g, "\n")
      .trim();

    if (!joined) {
      return "(Não foi possível extrair texto deste PDF — pode ser imagem/scan. Cole o conteúdo em Preços ou Políticas.)";
    }
    return joined.slice(0, MAX_TEXT);
  } catch (err) {
    console.error("[extract-document-text]", err);
    throw new Error(
      "Falha ao extrair texto do PDF. Tente outro arquivo ou cole o conteúdo em Preços/Políticas."
    );
  }
}
