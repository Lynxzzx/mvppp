import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Trilha de auditoria append-only para ações críticas (PRD seção 7):
 * exclusão de caso, alteração de contrato, anonimização LGPD, etc.
 */
const AuditLogSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
