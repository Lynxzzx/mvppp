import mongoose, { Schema, InferSchemaType } from "mongoose";

/**
 * Configuração global da plataforma (singleton key = "default").
 * API keys ficam criptografadas (AES-GCM com AUTH_SECRET).
 */
const PlatformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    openRouterApiKeyEnc: { type: String },
    openRouterDefaultModel: { type: String, trim: true },
    openRouterRateLimitPerHour: { type: Number, min: 1, max: 10000 },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export type PlatformSettingsDoc = InferSchemaType<typeof PlatformSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model("PlatformSettings", PlatformSettingsSchema);

export const PLATFORM_SETTINGS_KEY = "default";
