import "dotenv/config";
import cors from "cors";
import express from "express";
import claimsRouter from "../routes/claims.js";
import { connectMongoDB } from "./db.js";
import { getRuntimeConfigSummary, validateEnvironment } from "./env.js";
import { normalizeError } from "./errors.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", claimsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "medcode-backend",
    config: getRuntimeConfigSummary(),
  });
});

app.use((err, _req, res, _next) => {
  const normalizedError = normalizeError(err);

  console.error({
    code: normalizedError.code,
    message: normalizedError.message,
    cause: normalizedError.cause?.message || err?.message,
  });

  res.status(normalizedError.statusCode).json({
    error: normalizedError.message,
    code: normalizedError.code,
  });
});

async function startServer() {
  try {
    validateEnvironment();
    await connectMongoDB();
    app.listen(port, () => {
      console.log(`MedCode API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start MedCode API:", error.message);
    process.exit(1);
  }
}

startServer();
