import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Tenant = uma funerária (ou rede). Unidades embutidas: sempre lidas junto
 * do tenant e em número pequeno (ver DECISIONS.md — multiunidade).
 */
const UnitSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  { _id: true }
);

const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, trim: true },
    subscriptionPlan: {
      type: String,
      enum: ["free", "essencial", "profissional", "rede"],
      default: "free",
    },
    planPaidUntil: { type: Date },
    /** Suspenso pela plataforma: bloqueia login dos usuários do tenant. */
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
    units: { type: [UnitSchema], default: [] },
    /** Dados bancários para remessa/retorno CNAB (faturamento). */
    bankSettings: {
      bankCode: { type: String, trim: true, default: "237" },
      agency: { type: String, trim: true },
      account: { type: String, trim: true },
      wallet: { type: String, trim: true, default: "09" },
      beneficiaryName: { type: String, trim: true },
      beneficiaryDocument: { type: String, trim: true },
      remessaSeq: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

export type TenantDoc = InferSchemaType<typeof TenantSchema> & { _id: mongoose.Types.ObjectId };

export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);
