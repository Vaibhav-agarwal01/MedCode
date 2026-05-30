import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, createGuidelineVectorStore } from "../src/ai.js";

const codingItemSchema = z.object({
  code: z.string().describe("Billing code such as an ICD-10 or CPT code."),
  description: z.string().describe("Plain-language description of the assigned code."),
  source: z.string().describe("Diagnosis or procedure from the extracted JSON that supports this code."),
  confidence: z.enum(["high", "medium", "low"]),
});

const complianceSchema = z.object({
  icd10Codes: z.array(codingItemSchema),
  cptCodes: z.array(codingItemSchema),
  complianceStatus: z.enum(["Compliant", "Missing Documentation", "Needs Review"]),
  rationale: z.string().describe("Brief explanation of the coding and compliance decision."),
  missingDocumentation: z.array(z.string()).describe("Specific missing documentation requirements, if any."),
  supportingRules: z.array(z.string()).describe("Retrieved payer or Medicare rules used for the decision."),
});

function buildRetrievalQuery(extractedEntities) {
  const diagnoses = extractedEntities.diagnoses?.map((item) => item.name).join(", ") || "no diagnoses";
  const procedures = extractedEntities.procedures?.map((item) => item.name).join(", ") || "no procedures";

  return [
    "Medicare billing documentation requirements and ICD-10 CPT coding rules for:",
    `Diagnoses: ${diagnoses}`,
    `Procedures: ${procedures}`,
  ].join("\n");
}

function formatRetrievedDocuments(documents) {
  return documents
    .map((doc, index) => {
      const source = doc.metadata?.source || "unknown source";
      const chunk = doc.metadata?.chunkIndex ?? index;
      return `Rule ${index + 1} (${source}, chunk ${chunk}):\n${doc.pageContent}`;
    })
    .join("\n\n");
}

export async function runComplianceAgent({ clinicalNote, extractedEntities }) {
  if (!clinicalNote?.trim()) {
    throw new Error("clinicalNote is required");
  }

  if (!extractedEntities) {
    throw new Error("extractedEntities is required");
  }

  const vectorStore = createGuidelineVectorStore();
  const retrievalQuery = buildRetrievalQuery(extractedEntities);
  const retrievedDocuments = await vectorStore.similaritySearch(retrievalQuery, 4);
  const retrievedRules = retrievedDocuments.map((doc, index) => ({
    id: index + 1,
    text: doc.pageContent,
    metadata: doc.metadata,
  }));

  const model = createChatModel({ temperature: 0 });
  const complianceEvaluator = model.withStructuredOutput(complianceSchema, {
    name: "medical_coding_and_compliance_review",
    method: "jsonSchema",
    strict: true,
  });

  const compliance = await complianceEvaluator.invoke([
    new SystemMessage(
      [
        "You are Agent 2: a medical coder and payer documentation reviewer.",
        "Assign plausible ICD-10 and CPT codes from the clinical evidence.",
        "Use the retrieved rules as the compliance source of truth.",
        "If documentation is insufficient, set complianceStatus to Missing Documentation and list the exact gaps.",
      ].join(" "),
    ),
    new HumanMessage(
      [
        `Clinical note:\n${clinicalNote}`,
        `Extracted entities JSON:\n${JSON.stringify(extractedEntities, null, 2)}`,
        `Retrieved rules:\n${formatRetrievedDocuments(retrievedDocuments) || "No rules retrieved."}`,
      ].join("\n\n"),
    ),
  ]);

  return {
    ...compliance,
    retrievedRules,
  };
}
