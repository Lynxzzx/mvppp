import mongoose, { Schema, InferSchemaType } from "mongoose";

/** Fornecedor por categoria de item (PRD 6.3). */
const SupplierSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["urna", "caixao", "flor", "paramentacao", "veiculo", "outro"],
      required: true,
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ tenantId: 1, category: 1 });

export type SupplierDoc = InferSchemaType<typeof SupplierSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Supplier =
  mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
