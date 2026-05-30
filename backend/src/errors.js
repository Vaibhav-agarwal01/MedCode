export class ApiError extends Error {
  constructor(statusCode, code, message, cause) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
    this.isOperational = true;
  }
}

export function badRequest(message) {
  return new ApiError(400, "BAD_REQUEST", message);
}

function includesAny(value, needles) {
  const text = String(value || "").toLowerCase();
  return needles.some((needle) => text.includes(needle));
}

export function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const status = error?.status;
  const name = error?.name || "";
  const message = error?.message || "";
  const reason = error?.rateLimitReason || "";

  if (status === 429 || includesAny(`${name} ${message} ${reason}`, ["quota", "rate limit", "too many requests"])) {
    return new ApiError(
      429,
      "AI_QUOTA_EXHAUSTED",
      "Gemini quota is currently exhausted for this project or model. Wait for the quota window to reset, then try again.",
      error,
    );
  }

  if (includesAny(`${name} ${message}`, ["json", "structured", "schema", "parser", "parse"])) {
    return new ApiError(
      502,
      "AI_RESPONSE_INVALID",
      "The AI service returned a response that did not match the expected claim format. Please try again.",
      error,
    );
  }

  if (includesAny(`${name} ${message}`, ["google", "generativeai", "gemini", "fetch", "api key"])) {
    return new ApiError(
      502,
      "AI_SERVICE_ERROR",
      "The Gemini service could not complete the claim review. Check the API key, model access, or retry shortly.",
      error,
    );
  }

  if (includesAny(`${name} ${message}`, ["mongo", "atlas", "vector", "queryplanner", "connection"])) {
    return new ApiError(
      503,
      "RAG_STORE_ERROR",
      "The Medicare guideline search store is unavailable. Check MongoDB Atlas connectivity and the vector search index.",
      error,
    );
  }

  return new ApiError(500, "INTERNAL_SERVER_ERROR", "Internal server error", error);
}
