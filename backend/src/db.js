import mongoose from "mongoose";

export async function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const dbName = process.env.MONGODB_DB_NAME || "medcode";
  await mongoose.connect(process.env.MONGODB_URI, { dbName });

  return mongoose.connection;
}
