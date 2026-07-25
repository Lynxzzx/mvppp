import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "velora_session";
const SESSION_DAYS = 7;

export type Role = "admin" | "atendente" | "financeiro";

export interface Session {
  userId: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definido");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const { userId, tenantId, role, name, email } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof tenantId !== "string") return null;
    return {
      userId,
      tenantId,
      role: role as Role,
      name: String(name ?? ""),
      email: String(email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Lê a sessão a partir do cookie (server components e route handlers). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(session: Session): Promise<void> {
  const token = await createSessionToken(session);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
