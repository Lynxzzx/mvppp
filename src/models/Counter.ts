import mongoose, { Schema } from "mongoose";

/** Sequências atômicas por tenant (ex.: código do caso, número da cobrança). */
const CounterSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

CounterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

export async function nextSeq(tenantId: string, key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  ).lean<{ seq: number }>();
  return doc!.seq;
}
