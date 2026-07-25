import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Pagamento de assinatura de plano via MisticPay (PIX).
 * Quando COMPLETO, ativa o plano no Tenant por 30 dias.
 */
const PlanPaymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    plan: { type: String, enum: ["essencial", "profissional"], required: true },
    amountCents: { type: Number, required: true },
    ourTransactionId: { type: String, required: true, unique: true },
    misticTransactionId: { type: String, index: true },
    status: {
      type: String,
      enum: ["pendente", "completo", "falha"],
      default: "pendente",
    },
    qrCodeBase64: { type: String, select: false },
    copyPaste: { type: String },
    paidAt: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: true }
);

PlanPaymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export type PlanPaymentDoc = InferSchemaType<typeof PlanPaymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlanPayment =
  mongoose.models.PlanPayment || mongoose.model("PlanPayment", PlanPaymentSchema);
