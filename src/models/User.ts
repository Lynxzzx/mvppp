import mongoose, { Schema, InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "atendente", "financeiro"],
      required: true,
      default: "atendente",
    },
    unitId: { type: Schema.Types.ObjectId },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ tenantId: 1, role: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
