import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Cobrança (boleto simulado na v1 — PRD 6.5). Campos `gateway`/`externalId`
 * reservados para integração futura; `fiscalStatus` reservado para emissão
 * fiscal via parceiro (ver DECISIONS.md).
 */
const InvoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    number: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pendente", "paga", "cancelada"],
      default: "pendente",
    },
    paidAt: { type: Date },
    // Origem: caso ou parcela de contrato
    caseId: { type: Schema.Types.ObjectId },
    caseCode: { type: String },
    contractId: { type: Schema.Types.ObjectId },
    contractCode: { type: String },
    installmentNumber: { type: Number },
    // Boleto simulado
    boletoLine: { type: String },
    gateway: { type: String },
    externalId: { type: String },
    fiscalStatus: { type: String, default: "nao_emitida" },
  },
  { timestamps: true }
);

InvoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
InvoiceSchema.index({ tenantId: 1, number: 1 }, { unique: true });

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
