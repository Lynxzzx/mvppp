import { NextResponse } from "next/server";
import { clearPlatformCookie } from "@/lib/platform-admin";

export async function POST() {
  await clearPlatformCookie();
  return NextResponse.json({ ok: true });
}
