import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";

const registerSchema = z.object({
  tenantName: z.string().min(2, "Informe o nome da funerária"),
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres"),
});

/** Cria um novo tenant (funerária) com o primeiro usuário admin. */
export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return jsonError("Dados inválidos", 400, body.error.flatten().fieldErrors);
    }
    await dbConnect();

    const existing = await User.findOne({ email: body.data.email.toLowerCase() }).lean();
    if (existing) return jsonError("Já existe uma conta com este e-mail", 409);

    const tenant = await Tenant.create({
      name: body.data.tenantName,
      units: [{ name: "Matriz" }],
    });

    const user = await User.create({
      tenantId: tenant._id,
      name: body.data.name,
      email: body.data.email,
      passwordHash: await bcrypt.hash(body.data.password, 10),
      role: "admin",
      unitId: tenant.units[0]._id,
    });

    await setSessionCookie({
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      role: "admin",
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[auth/register]", err);
    return jsonError("Erro ao criar conta", 500);
  }
}
