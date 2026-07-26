import mongoose, { Schema, InferSchemaType } from "mongoose";
import { AI_FEATURES } from "@/lib/ai/features";

/**
 * Configuração de modelo por funcionalidade de IA.
 * tenantId null = padrão global da plataforma (fallback antes do env).
 */
const AiSettingsSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    feature: {
      type: String,
      enum: AI_FEATURES,
      required: true,
    },
    model: { type: String, required: true, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    updatedBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

/** Um registro por (tenant|global) + feature. */
AiSettingsSchema.index({ tenantId: 1, feature: 1 }, { unique: true });

export type AiSettingsDoc = InferSchemaType<typeof AiSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiSettings =
  mongoose.models.AiSettings || mongoose.model("AiSettings", AiSettingsSchema);
