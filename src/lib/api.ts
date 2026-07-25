import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession, Role, Session } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import type { Feature } from "@/lib/plans";

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Wrapper padrão dos route handlers autenticados.
 * Garante: conexão com o banco, sessão válida e (opcionalmente) papel autorizado.
 * O tenantId usado nas queries vem SEMPRE da sessão, nunca do cliente.
 */
export function withAuth<Ctx = unknown>(
  handler: (req: NextRequest, session: Session, ctx: Ctx) => Promise<NextResponse>,
  opts?: { roles?: Role[]; feature?: Feature }
) {
  return async (req: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    try {
      const session = await getSession();
      if (!session) return jsonError("Não autenticado", 401);
      if (opts?.roles && !opts.roles.includes(session.role) && session.role !== "admin") {
        return jsonError("Sem permissão para esta ação", 403);
      }
      await dbConnect();
      if (opts?.feature) {
        const blocked = await requireFeature(session.tenantId, opts.feature);
        if (blocked) return blocked;
      }
      return await handler(req, session, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return jsonError("Dados inválidos", 400, err.flatten().fieldErrors);
      }
      console.error("[api]", err);
      return jsonError("Erro interno", 500);
    }
  };
}

/** Faz parse + validação do corpo JSON com um schema Zod (lança ZodError). */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}

/** Converte string em ObjectId, retornando null se inválida. */
export function toObjectId(id: string | undefined | null): mongoose.Types.ObjectId | null {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}
