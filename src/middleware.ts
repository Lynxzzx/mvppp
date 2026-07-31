import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyPlatformToken, PLATFORM_COOKIE } from "@/lib/platform-admin";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/registrar",
  "/portal",
  "/cobrador",
  "/chat",
  "/termos",
  "/privacidade",
  "/sysadmin/login",
];

/**
 * Protege páginas do painel das funerárias e do sysadmin da plataforma.
 * APIs têm verificação própria; portal da família é público (PRD 6.6).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // —— Painel da plataforma (/sysadmin) ——
  if (pathname.startsWith("/sysadmin")) {
    const platformToken = req.cookies.get(PLATFORM_COOKIE)?.value;
    const platformSession = platformToken ? await verifyPlatformToken(platformToken) : null;

    if (pathname === "/sysadmin/login") {
      if (platformSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/sysadmin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (!platformSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/sysadmin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // —— Painel das funerárias ——
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
