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
    units: { type: [UnitSchema], default: [] },
  },
  { timestamps: true }
);

export type TenantDoc = InferSchemaType<typeof TenantSchema> & { _id: mongoose.Types.ObjectId };

export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);
