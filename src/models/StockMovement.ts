import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Movimentação de estoque (entrada/saída), opcionalmente vinculada a um caso
 * (PRD 6.3). Coleção própria: cresce sem limite e é consultada por período.
 */
const StockMovementSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, required: true },
    itemName: { type: String, required: true },
    category: { type: String },
    type: { type: String, enum: ["entrada", "saida"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    caseId: { type: Schema.Types.ObjectId },
    caseCode: { type: String },
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ tenantId: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, itemId: 1, createdAt: -1 });

export type StockMovementDoc = InferSchemaType<typeof StockMovementSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StockMovement =
  mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
