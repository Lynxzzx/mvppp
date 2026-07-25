import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/velora";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache global para sobreviver a hot-reload em dev e reuso de lambda na Vercel
const globalWithMongoose = global as typeof globalThis & { _mongoose?: MongooseCache };
const cache: MongooseCache = globalWithMongoose._mongoose ?? { conn: null, promise: null };
globalWithMongoose._mongoose = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
