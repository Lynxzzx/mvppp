import mongoose, { Schema, InferSchemaType } from "mongoose";

const PublicChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Histórico anônimo do chat público (sem PII além do texto digitado pelo visitante).
 */
const PublicChatSessionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    sessionId: { type: String, required: true, trim: true, maxlength: 80 },
    messages: { type: [PublicChatMessageSchema], default: [] },
    handoffToWhatsapp: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

PublicChatSessionSchema.index({ tenantId: 1, sessionId: 1 }, { unique: true });
/** Limpa sessões antigas após 30 dias. */
PublicChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type PublicChatSessionDoc = InferSchemaType<typeof PublicChatSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PublicChatSession =
  mongoose.models.PublicChatSession ||
  mongoose.model("PublicChatSession", PublicChatSessionSchema);
