import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  setPlatformCookie,
  verifyPlatformCredentials,
} from "@/lib/platform-admin";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Informe usuário e senha" }, { status: 400 });
  }
  if (!verifyPlatformCredentials(body.data.username, body.data.password)) {
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }
  await setPlatformCookie({ username: body.data.username, kind: "platform" });
  return NextResponse.json({ ok: true });
}
