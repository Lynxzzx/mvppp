import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/** Deriva chave AES-256 a partir do AUTH_SECRET da aplicação. */
function aesKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definido");
  return createHash("sha256").update(`veluxa-secret:${secret}`).digest();
}

/** Criptografa texto sensível (API keys) para armazenamento no Mongo. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  if (buf.length < 28) throw new Error("Payload inválido");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", aesKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Ex.: sk-or-v1-abcd…xyz9 → sk-or-v1-••••xyz9 */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (v.length <= 8) return "••••••••";
  return `${v.slice(0, 7)}…${v.slice(-4)}`;
}
