import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Rate limit do chat público por chave (slug+IP ou slug) em janela horária.
 * Mais restritivo que o uso interno de IA.
 */
const PublicChatUsageSchema = new Schema(
  {
    key: { type: String, required: true },
    windowKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

PublicChatUsageSchema.index({ key: 1, windowKey: 1 }, { unique: true });
PublicChatUsageSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 48 });

export type PublicChatUsageDoc = InferSchemaType<typeof PublicChatUsageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PublicChatUsage =
  mongoose.models.PublicChatUsage ||
  mongoose.model("PublicChatUsage", PublicChatUsageSchema);
