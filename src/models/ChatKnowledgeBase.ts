import mongoose, { Schema, InferSchemaType } from "mongoose";

const FaqItemSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { _id: true }
);

const UploadedDocumentSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true, maxlength: 240 },
    storageUrl: { type: String, required: true, trim: true },
    extractedText: { type: String, default: "", maxlength: 80_000 },
    mimeType: { type: String, trim: true, default: "application/pdf" },
    /** Conteúdo bruto para download interno; nunca exposto na API pública. */
    dataBase64: { type: String, select: false },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Base de conhecimento do chat público por funerária (1 documento / tenant).
 */
const ChatKnowledgeBaseSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
    },
    whatsappNumber: { type: String, trim: true, default: "", maxlength: 20 },
    faq: { type: [FaqItemSchema], default: [] },
    pricingInfo: { type: String, default: "", maxlength: 20_000 },
    policies: { type: String, default: "", maxlength: 20_000 },
    uploadedDocuments: { type: [UploadedDocumentSchema], default: [] },
    isActive: { type: Boolean, default: false },
    welcomeMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default:
        "Olá. Sou o assistente virtual desta funerária. Posso ajudar com planos, preços e informações gerais. Em urgências, use o botão do WhatsApp.",
    },
  },
  { timestamps: true }
);

ChatKnowledgeBaseSchema.index({ slug: 1, isActive: 1 });

export type ChatKnowledgeBaseDoc = InferSchemaType<typeof ChatKnowledgeBaseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatKnowledgeBase =
  mongoose.models.ChatKnowledgeBase ||
  mongoose.model("ChatKnowledgeBase", ChatKnowledgeBaseSchema);
