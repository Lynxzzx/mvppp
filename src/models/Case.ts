import mongoose, { Schema, InferSchemaType } from "mongoose";

export type ServiceType = "velorio" | "sepultamento" | "cremacao";
export type CaseStatus = "novo" | "em_andamento" | "encerrado";

/**
 * Case = um atendimento, do primeiro contato ao encerramento (PRD 6.1).
 * family, deceased, checklist, timeline e documents são subdocumentos:
 * sempre lidos/escritos junto do caso (ver DECISIONS.md).
 * Os dados pessoais ficam agrupados em family/deceased para permitir
 * anonimização LGPD pontual.
 */
const ChecklistItemSchema = new Schema(
  {
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
    doneAt: { type: Date },
  },
  { _id: true }
);

const TimelineEntrySchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["criacao", "status", "nota", "documento", "sistema"],
      required: true,
    },
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CaseDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataBase64: { type: String, required: true, select: false },
    visibleToFamily: { type: Boolean, default: false },
    uploadedBy: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CaseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    unitId: { type: Schema.Types.ObjectId },
    code: { type: String, required: true },
    family: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      relationship: { type: String, trim: true },
      document: { type: String, trim: true },
    },
    deceased: {
      name: { type: String, required: true, trim: true },
      dateOfBirth: { type: Date },
      dateOfDeath: { type: Date },
      placeOfDeath: { type: String, trim: true },
    },
    serviceType: {
      type: String,
      enum: ["velorio", "sepultamento", "cremacao"],
      required: true,
    },
    status: {
      type: String,
      enum: ["novo", "em_andamento", "encerrado"],
      default: "novo",
    },
    assigneeId: { type: Schema.Types.ObjectId },
    assigneeName: { type: String },
    checklist: { type: [ChecklistItemSchema], default: [] },
    timeline: { type: [TimelineEntrySchema], default: [] },
    documents: { type: [CaseDocumentSchema], default: [] },
    closedAt: { type: Date },
    anonymizedAt: { type: Date },
  },
  { timestamps: true }
);

CaseSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
CaseSchema.index({ tenantId: 1, code: 1 }, { unique: true });
CaseSchema.index({ tenantId: 1, "deceased.name": 1 });

export type CaseDoc = InferSchemaType<typeof CaseSchema> & { _id: mongoose.Types.ObjectId };

export const Case = mongoose.models.Case || mongoose.model("Case", CaseSchema);
