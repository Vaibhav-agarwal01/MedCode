import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getGeminiEmbeddingModel } from "../src/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guidelinesPath = path.resolve(__dirname, "../data/medicare-guidelines.txt");
const dbName = process.env.MONGODB_DB_NAME || "medcode";
const collectionName = process.env.MONGODB_VECTOR_COLLECTION || "medicare_guidelines";
const indexName = process.env.ATLAS_VECTOR_SEARCH_INDEX || "vector_index";
const sourceName = "medicare-guidelines.txt";

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required`);
  }
}

export async function ingestGuidelines() {
  requireEnv("GOOGLE_API_KEY");
  requireEnv("MONGODB_URI");

  const rawText = await readFile(guidelinesPath, "utf8");

  if (!rawText.trim()) {
    throw new Error(`No guideline text found in ${guidelinesPath}`);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  const documents = await splitter.createDocuments([rawText], [
    {
      source: sourceName,
      documentType: "medicare-billing-guideline",
    },
  ]);

  documents.forEach((document, index) => {
    document.metadata.chunkIndex = index;
  });

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.deleteMany({ source: sourceName });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: getGeminiEmbeddingModel(),
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: "Medicare Billing Guidelines",
    });

    await MongoDBAtlasVectorSearch.fromDocuments(documents, embeddings, {
      collection,
      indexName,
      textKey: "text",
      embeddingKey: "embedding",
    });

    console.log(`Ingested ${documents.length} guideline chunks into ${dbName}.${collectionName}`);
    console.log(`Atlas Vector Search index expected: ${indexName}`);
    console.log("Vector index should target path 'embedding' with 3072 dimensions and cosine similarity.");
  } finally {
    await client.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestGuidelines().catch((error) => {
    console.error("Guideline ingestion failed:", error.message);
    process.exit(1);
  });
}
