const requiredEnv = ["GOOGLE_API_KEY", "MONGODB_URI"];

export function validateEnvironment() {
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getRuntimeConfigSummary() {
  return {
    googleModel: process.env.GOOGLE_MODEL || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    googleEmbeddingModel:
      process.env.GOOGLE_EMBEDDING_MODEL || process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    mongoDatabase: process.env.MONGODB_DB_NAME || "medcode",
    vectorCollection: process.env.MONGODB_VECTOR_COLLECTION || "medicare_guidelines",
    vectorIndex: process.env.ATLAS_VECTOR_SEARCH_INDEX || "vector_index",
  };
}
