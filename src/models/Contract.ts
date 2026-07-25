import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Contrato / plano funerário pré-pago (PRD 6.4).
 * Parcelas EMBUTIDAS: sempre lidas/escritas junto do contrato pai e em
 * quantidade pequena (ver DECISIONS.md).
 */
const InstallmentSchema = new Schema(
  {
    number: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amountCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendente", "pago", "atrasado"],
      default: "pendente",
    },
    paidAt: { type: Date },
  },
  { _id: true }
);

const ContractSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    code: { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    customerDocument: { type: String, trim: true },
    planName: { type: String, required: true, trim: true },
    totalCents: { type: Number, required: true, min: 0 },
    installmentsCount: { type: Number, required: true, min: 1 },
    adjustmentRule: { type: String, trim: true, default: "Sem reajuste" },
    status: {
      type: String,
      enum: ["ativo", "quitado", "cancelado"],
      default: "ativo",
    },
    caseId: { type: Schema.Types.ObjectId },
    caseCode: { type: String },
    installments: { type: [InstallmentSchema], default: [] },
  },
  { timestamps: true }
);

ContractSchema.index({ tenantId: 1, status: 1 });
ContractSchema.index({ tenantId: 1, code: 1 }, { unique: true });
ContractSchema.index({ tenantId: 1, customerName: 1 });

export type ContractDoc = InferSchemaType<typeof ContractSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Contract =
  mongoose.models.Contract || mongoose.model("Contract", ContractSchema);
