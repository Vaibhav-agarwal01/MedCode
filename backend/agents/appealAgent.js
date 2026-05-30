import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../src/ai.js";

function extractTextContent(message) {
  if (typeof message.content === "string") {
    return message.content;
  }

  return message.content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      return part.text || "";
    })
    .join("");
}

export async function runAppealAgent({ claimData, denialReason, retrievedRules = [] }) {
  if (!claimData) {
    throw new Error("claimData is required");
  }

  if (!denialReason?.trim()) {
    throw new Error("denialReason is required");
  }

  const model = createChatModel({ temperature: 0.2 });

  const response = await model.invoke([
    new SystemMessage(
      [
        "You are Agent 3: a healthcare claims appeal drafter.",
        "Draft a formal, professional appeal letter in exactly three paragraphs.",
        "Use precise, payer-facing language. Do not invent facts beyond the claim data and retrieved rules.",
      ].join(" "),
    ),
    new HumanMessage(
      [
        `Claim data:\n${JSON.stringify(claimData, null, 2)}`,
        `Mock denial reason:\n${denialReason}`,
        `Retrieved insurance or Medicare rules:\n${JSON.stringify(retrievedRules, null, 2)}`,
      ].join("\n\n"),
    ),
  ]);

  return extractTextContent(response).trim();
}
