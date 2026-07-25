import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Cookie separado da sessão das funerárias. */
export const PLATFORM_COOKIE = "veluxa_platform";
const SESSION_DAYS = 7;

export interface PlatformSession {
  username: string;
  kind: "platform";
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definido");
  return new TextEncoder().encode(`platform:${secret}`);
}

export function getPlatformCredentials(): { username: string; password: string } {
  return {
    username: process.env.PLATFORM_ADMIN_USER ?? "Lynx",
    password: process.env.PLATFORM_ADMIN_PASSWORD ?? "veluxa2026",
  };
}

export function verifyPlatformCredentials(username: string, password: string): boolean {
  const creds = getPlatformCredentials();
  return username === creds.username && password === creds.password;
}

export async function createPlatformToken(session: PlatformSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifyPlatformToken(token: string): Promise<PlatformSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "platform" || typeof payload.username !== "string") return null;
    return { username: payload.username, kind: "platform" };
  } catch {
    return null;
  }
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const store = await cookies();
  const token = store.get(PLATFORM_COOKIE)?.value;
  if (!token) return null;
  return verifyPlatformToken(token);
}

export async function setPlatformCookie(session: PlatformSession): Promise<void> {
  const token = await createPlatformToken(session);
  const store = await cookies();
  store.set(PLATFORM_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearPlatformCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PLATFORM_COOKIE);
}

/** Wrapper para rotas /api/platform/* */
export function withPlatformAuth(
  handler: (req: Request, session: PlatformSession) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      const session = await getPlatformSession();
      if (!session) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      const { dbConnect } = await import("@/lib/db");
      await dbConnect();
      return await handler(req, session);
    } catch (err) {
      console.error("[platform-api]", err);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  };
}
