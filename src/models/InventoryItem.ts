import mongoose, { Schema, InferSchemaType } from "mongoose";

export type ItemCategory =
  | "urna"
  | "caixao"
  | "flor"
  | "paramentacao"
  | "veiculo"
  | "outro";

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  urna: "Urna",
  caixao: "Caixão",
  flor: "Flor",
  paramentacao: "Paramentação",
  veiculo: "Veículo",
  outro: "Outro",
};

/** Item de estoque com nível mínimo para alerta (PRD 6.3). */
const InventoryItemSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["urna", "caixao", "flor", "paramentacao", "veiculo", "outro"],
      required: true,
    },
    quantity: { type: Number, default: 0, min: 0 },
    minQuantity: { type: Number, default: 0, min: 0 },
    supplierId: { type: Schema.Types.ObjectId },
    supplierName: { type: String },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ tenantId: 1, category: 1 });
InventoryItemSchema.index({ tenantId: 1, name: 1 });

export type InventoryItemDoc = InferSchemaType<typeof InventoryItemSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const InventoryItem =
  mongoose.models.InventoryItem || mongoose.model("InventoryItem", InventoryItemSchema);
