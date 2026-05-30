import mongoose from "mongoose";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { TaskType } from "@google/generative-ai";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export function getGeminiEmbeddingModel() {
  const configuredModel =
    process.env.GOOGLE_EMBEDDING_MODEL || process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  return ["embedding-001", "text-embedding-004"].includes(configuredModel)
    ? "gemini-embedding-001"
    : configuredModel;
}

export function createChatModel(options = {}) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is required");
  }

  return new ChatGoogleGenerativeAI({
    model: process.env.GOOGLE_MODEL || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    temperature: options.temperature ?? 0,
    maxRetries: 2,
  });
}

export function createGuidelineVectorStore() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is required");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection is not ready");
  }

  const collectionName = process.env.MONGODB_VECTOR_COLLECTION || "medicare_guidelines";
  const collection = mongoose.connection.db.collection(collectionName);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: getGeminiEmbeddingModel(),
    taskType: TaskType.RETRIEVAL_QUERY,
  });

  return new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: process.env.ATLAS_VECTOR_SEARCH_INDEX || "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });
}
