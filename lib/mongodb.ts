import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || ""

if (!MONGODB_URI) {
  // Intentionally do not throw here to keep build happy; API will error clearly.
  // console.warn("MONGODB_URI is not set. Set it in your .env.local or environment.")
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

export async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error("Missing MONGODB_URI. Add it to your environment.")
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Keep options minimal; modern mongoose picks sensible defaults
        // @ts-ignore
        bufferCommands: false,
      })
      .then((m) => m)
  }
  cached.conn = await cached.promise
  // Persist cache across hot-reloads in dev
  global.mongooseCache = cached
  return cached.conn
}

