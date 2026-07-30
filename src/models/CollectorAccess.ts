import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Acesso do cobrador externo via link (mesmo padrão do portal da família).
 * Sem app nativo: PWA/mobile browser.
 */
const CollectorAccessSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    token: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

CollectorAccessSchema.index({ tenantId: 1, active: 1 });

export type CollectorAccessDoc = InferSchemaType<typeof CollectorAccessSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CollectorAccess =
  mongoose.models.CollectorAccess ||
  mongoose.model("CollectorAccess", CollectorAccessSchema);
