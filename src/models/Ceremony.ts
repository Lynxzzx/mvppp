import mongoose, { Schema, InferSchemaType } from "mongoose";

/** Cerimônia vinculada a um caso, com sala e veículo (PRD 6.2). */
const CeremonySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    caseId: { type: Schema.Types.ObjectId, required: true },
    caseCode: { type: String, required: true },
    deceasedName: { type: String },
    type: {
      type: String,
      enum: ["velorio", "sepultamento", "cremacao"],
      required: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    room: { type: String, trim: true },
    vehicle: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["agendada", "realizada", "cancelada"],
      default: "agendada",
    },
  },
  { timestamps: true }
);

CeremonySchema.index({ tenantId: 1, startsAt: 1 });
CeremonySchema.index({ tenantId: 1, caseId: 1 });

export type CeremonyDoc = InferSchemaType<typeof CeremonySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Ceremony =
  mongoose.models.Ceremony || mongoose.model("Ceremony", CeremonySchema);
