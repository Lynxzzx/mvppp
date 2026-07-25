import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { setSessionCookie, Role } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { User } from "@/models/User";
import { Tenant } from "@/models/Tenant";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return jsonError("Dados inválidos", 400, body.error.flatten().fieldErrors);
    }
    await dbConnect();

    const user = await User.findOne({ email: body.data.email.toLowerCase(), active: true });
    if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
      return jsonError("E-mail ou senha incorretos", 401);
    }

    const tenant = await Tenant.findById(user.tenantId).lean<{ active?: boolean }>();
    if (tenant && tenant.active === false) {
      return jsonError("Conta da funerária suspensa. Fale com o suporte Veluxa.", 403);
    }

    await setSessionCookie({
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role as Role,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/login]", err);
    return jsonError("Erro ao entrar", 500);
  }
}
