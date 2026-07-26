import mongoose, { Schema, InferSchemaType } from "mongoose";

/** Contador de uso de IA por tenant em janela horária (rate limit). */
const AiUsageSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    /** Ex.: 2026-07-26T13 */
    windowKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

AiUsageSchema.index({ tenantId: 1, windowKey: 1 }, { unique: true });
/** TTL opcional: limpa janelas antigas após 48h */
AiUsageSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 48 });

export type AiUsageDoc = InferSchemaType<typeof AiUsageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiUsage =
  mongoose.models.AiUsage || mongoose.model("AiUsage", AiUsageSchema);
