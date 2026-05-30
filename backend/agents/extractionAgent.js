import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel } from "../src/ai.js";

const extractedEntitySchema = z.object({
  diagnoses: z.array(
    z.object({
      name: z.string().describe("Condition or diagnosis documented in the clinical note."),
      evidence: z.string().describe("Short quote or paraphrase from the note supporting this diagnosis."),
      acuity: z.string().describe("Acute, chronic, recurrent, or unspecified."),
      laterality: z.string().describe("Left, right, bilateral, or unspecified."),
    }),
  ),
  procedures: z.array(
    z.object({
      name: z.string().describe("Procedure, visit type, diagnostic test, or service documented in the note."),
      evidence: z.string().describe("Short quote or paraphrase from the note supporting this procedure."),
      bodySite: z.string().describe("Anatomic site or unspecified."),
    }),
  ),
  patientContext: z.object({
    age: z.string().describe("Patient age or unspecified."),
    sex: z.string().describe("Patient sex or unspecified."),
    relevantHistory: z.array(z.string()).describe("Relevant documented history; use an empty array if none appears."),
  }),
});

export async function runExtractionAgent(clinicalNote) {
  if (!clinicalNote?.trim()) {
    throw new Error("clinicalNote is required");
  }

  const model = createChatModel({ temperature: 0 });
  const extractor = model.withStructuredOutput(extractedEntitySchema, {
    name: "clinical_note_entity_extraction",
    method: "jsonSchema",
    strict: true,
  });

  return extractor.invoke([
    new SystemMessage(
      [
        "You are Agent 1 in a medical billing workflow.",
        "Extract only entities supported by the clinical note.",
        "Return diagnoses and procedures as arrays. Use empty arrays when no item is documented.",
        "Use 'unspecified' for required fields that are not documented.",
      ].join(" "),
    ),
    new HumanMessage(`Clinical note:\n\n${clinicalNote}`),
  ]);
}
