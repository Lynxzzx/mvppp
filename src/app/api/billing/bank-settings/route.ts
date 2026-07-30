import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody, jsonError } from "@/lib/api";
import { Tenant } from "@/models/Tenant";

export const GET = withAuth(async (_req, session) => {
  const tenant = await Tenant.findById(session.tenantId)
    .select("name cnpj bankSettings")
    .lean<{
      name: string;
      cnpj?: string;
      bankSettings?: Record<string, unknown>;
    }>();
  if (!tenant) return jsonError("Funerária não encontrada", 404);
  return NextResponse.json({
    name: tenant.name,
    cnpj: tenant.cnpj ?? "",
    bankSettings: {
      bankCode: tenant.bankSettings?.bankCode ?? "237",
      agency: tenant.bankSettings?.agency ?? "",
      account: tenant.bankSettings?.account ?? "",
      wallet: tenant.bankSettings?.wallet ?? "09",
      beneficiaryName: tenant.bankSettings?.beneficiaryName ?? tenant.name,
      beneficiaryDocument:
        tenant.bankSettings?.beneficiaryDocument ?? tenant.cnpj ?? "",
    },
  });
}, { roles: ["financeiro"], feature: "faturamento" });

const PutSchema = z.object({
  bankCode: z.string().trim().min(1).max(5),
  agency: z.string().trim().min(1).max(20),
  account: z.string().trim().min(1).max(20),
  wallet: z.string().trim().min(1).max(5).optional(),
  beneficiaryName: z.string().trim().min(2).max(80),
  beneficiaryDocument: z.string().trim().max(20).optional(),
});

export const PUT = withAuth(async (req: NextRequest, session) => {
  const body = await parseBody(req, PutSchema);
  await Tenant.updateOne(
    { _id: session.tenantId },
    {
      $set: {
        "bankSettings.bankCode": body.bankCode,
        "bankSettings.agency": body.agency,
        "bankSettings.account": body.account,
        "bankSettings.wallet": body.wallet || "09",
        "bankSettings.beneficiaryName": body.beneficiaryName,
        "bankSettings.beneficiaryDocument": body.beneficiaryDocument || "",
        cnpj: body.beneficiaryDocument || undefined,
      },
    }
  );
  return NextResponse.json({ ok: true });
}, { roles: ["admin"], feature: "faturamento" });
