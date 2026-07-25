import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/registrar", "/portal"];

/**
 * Protege as páginas internas do painel. As rotas de API têm a própria
 * verificação (withAuth); o portal da família é público por design (PRD 6.6).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!isPublic && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("de", pathname);
    return NextResponse.redirect(url);
  }

  if (session && (pathname === "/login" || pathname === "/registrar")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Tudo exceto API, assets estáticos e arquivos públicos
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
