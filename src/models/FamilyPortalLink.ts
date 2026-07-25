import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Link único do portal da família, sem senha (PRD 6.6).
 * Consultado pelo token (rota pública); o tenantId vem do próprio documento.
 */
const FamilyPortalLinkSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    caseId: { type: Schema.Types.ObjectId, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

FamilyPortalLinkSchema.index({ tenantId: 1, caseId: 1 });

export type FamilyPortalLinkDoc = InferSchemaType<typeof FamilyPortalLinkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FamilyPortalLink =
  mongoose.models.FamilyPortalLink ||
  mongoose.model("FamilyPortalLink", FamilyPortalLinkSchema);
