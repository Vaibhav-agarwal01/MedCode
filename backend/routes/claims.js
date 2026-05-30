import { Router } from "express";
import { runAppealAgent } from "../agents/appealAgent.js";
import { runComplianceAgent } from "../agents/complianceAgent.js";
import { runExtractionAgent } from "../agents/extractionAgent.js";
import { badRequest } from "../src/errors.js";

const router = Router();

router.post("/process-claim", async (req, res, next) => {
  try {
    const { clinicalNote } = req.body;

    if (!clinicalNote?.trim()) {
      throw badRequest("clinicalNote is required");
    }

    const extractedEntities = await runExtractionAgent(clinicalNote);
    const compliance = await runComplianceAgent({
      clinicalNote,
      extractedEntities,
    });

    return res.json({
      extractedEntities,
      claim: {
        icd10Codes: compliance.icd10Codes,
        cptCodes: compliance.cptCodes,
        complianceStatus: compliance.complianceStatus,
        rationale: compliance.rationale,
        missingDocumentation: compliance.missingDocumentation,
      },
      compliance,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/generate-appeal", async (req, res, next) => {
  try {
    const { claimData, denialReason, retrievedRules } = req.body;

    if (!claimData) {
      throw badRequest("claimData is required");
    }

    if (!denialReason?.trim()) {
      throw badRequest("denialReason is required");
    }

    const appealLetter = await runAppealAgent({
      claimData,
      denialReason,
      retrievedRules,
    });

    return res.json({ appealLetter });
  } catch (error) {
    return next(error);
  }
});

export default router;
