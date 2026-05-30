import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Gavel,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MOCK_DENIAL_REASON =
  "Claim denied for insufficient documentation of medical necessity and missing support for billed diagnosis/procedure pairing.";
const SAMPLE_CLINICAL_NOTE =
  "Patient is a 67-year-old female with type 2 diabetes mellitus without complications and chronic right knee osteoarthritis. She reports persistent knee pain limiting ambulation and requires ongoing diabetes monitoring. Exam shows medial joint line tenderness and reduced range of motion of the right knee. Provider performed an established patient office visit, reviewed medication adherence, ordered A1C monitoring, and documented medical necessity for continued diabetes management and knee pain treatment.";

const loadingSteps = [
  "Agent 1 extracting clinical entities",
  "Agent 2 retrieving Medicare rules",
  "Agent 2 assigning ICD-10 and CPT codes",
  "Agent 2 validating documentation",
];

async function readJsonResponse(response, fallbackMessage) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <FileText className="h-10 w-10 text-stone-500" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-stone-950">Ready for a clinical note</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
        Processed claims, coding decisions, documentation status, and appeal output will appear here.
      </p>
    </div>
  );
}

function LoadingPanel({ step }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center border border-teal-200 bg-teal-50 p-8 text-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-teal-700" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-teal-950">{step}</h2>
      <div className="mt-6 grid w-full max-w-lg gap-2">
        {loadingSteps.map((item) => (
          <div
            key={item}
            className={`h-2 rounded-full ${item === step ? "bg-teal-700" : "bg-teal-100"}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Compliant"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Missing Documentation"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-stone-200 bg-stone-50 text-stone-700";

  return (
    <span className={`inline-flex items-center gap-2 border px-3 py-1 text-sm font-semibold ${tone}`}>
      {status === "Compliant" ? (
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      )}
      {status || "Needs Review"}
    </span>
  );
}

function CodeList({ title, codes }) {
  return (
    <section className="border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase text-stone-500">{title}</h3>
      <div className="mt-3 grid gap-3">
        {codes?.length ? (
          codes.map((item, index) => (
            <article key={`${item.code}-${index}`} className="border border-stone-200 bg-stone-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-base font-semibold text-teal-800">{item.code}</span>
                <span className="border border-stone-200 bg-white px-2 py-0.5 text-xs font-medium text-stone-600">
                  {item.confidence}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-stone-900">{item.description}</p>
              <p className="mt-1 text-xs leading-5 text-stone-600">{item.source}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-stone-500">No codes returned.</p>
        )}
      </div>
    </section>
  );
}

function EntitySummary({ extractedEntities }) {
  const diagnoses = extractedEntities?.diagnoses || [];
  const procedures = extractedEntities?.procedures || [];

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase text-stone-500">Diagnoses</h3>
        <ul className="mt-3 grid gap-2">
          {diagnoses.length ? (
            diagnoses.map((item, index) => (
              <li key={`${item.name}-${index}`} className="text-sm text-stone-700">
                <span className="font-semibold text-stone-950">{item.name}</span>
                <span className="block text-xs leading-5 text-stone-500">{item.evidence}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-stone-500">None extracted.</li>
          )}
        </ul>
      </div>
      <div className="border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase text-stone-500">Procedures</h3>
        <ul className="mt-3 grid gap-2">
          {procedures.length ? (
            procedures.map((item, index) => (
              <li key={`${item.name}-${index}`} className="text-sm text-stone-700">
                <span className="font-semibold text-stone-950">{item.name}</span>
                <span className="block text-xs leading-5 text-stone-500">{item.evidence}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-stone-500">None extracted.</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function ResultsPanel({ result, appealLetter, isAppealing, onSimulateDenial }) {
  const claim = result?.claim;
  const compliance = result?.compliance;

  return (
    <div className="grid gap-4">
      <section className="border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-stone-500">Claim Status</p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">Coding Review</h2>
          </div>
          <StatusBadge status={claim?.complianceStatus} />
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-700">{claim?.rationale}</p>
      </section>

      <EntitySummary extractedEntities={result?.extractedEntities} />

      <div className="grid gap-4 xl:grid-cols-2">
        <CodeList title="ICD-10 Codes" codes={claim?.icd10Codes} />
        <CodeList title="CPT Codes" codes={claim?.cptCodes} />
      </div>

      <section className="border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase text-stone-500">Documentation Gaps</h3>
        <ul className="mt-3 grid gap-2">
          {claim?.missingDocumentation?.length ? (
            claim.missingDocumentation.map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-stone-700">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                {item}
              </li>
            ))
          ) : (
            <li className="flex gap-2 text-sm leading-6 text-emerald-700">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              No missing documentation returned.
            </li>
          )}
        </ul>
      </section>

      <section className="border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-stone-500">Denial Simulation</p>
            <p className="mt-1 text-sm text-stone-600">{MOCK_DENIAL_REASON}</p>
          </div>
          <button
            type="button"
            onClick={onSimulateDenial}
            disabled={isAppealing}
            className="inline-flex min-h-11 items-center gap-2 bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isAppealing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Gavel className="h-4 w-4" aria-hidden="true" />
            )}
            {isAppealing ? "Drafting Appeal" : "Simulate Denial"}
          </button>
        </div>

        {appealLetter ? (
          <div className="mt-5 border border-teal-200 bg-teal-50 p-4">
            <h3 className="text-sm font-semibold uppercase text-teal-800">Appeal Letter</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-800">{appealLetter}</p>
          </div>
        ) : null}
      </section>

      {compliance?.retrievedRules?.length ? (
        <section className="border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase text-stone-500">Retrieved Rules</h3>
          <div className="mt-3 grid gap-2">
            {compliance.retrievedRules.map((rule) => (
              <details key={rule.id} className="border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                <summary className="cursor-pointer font-semibold text-stone-900">Rule {rule.id}</summary>
                <p className="mt-2 leading-6">{rule.text}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function App() {
  const [clinicalNote, setClinicalNote] = useState("");
  const [result, setResult] = useState(null);
  const [appealLetter, setAppealLetter] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAppealing, setIsAppealing] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);

  const currentLoadingStep = useMemo(() => loadingSteps[loadingIndex] || loadingSteps[0], [loadingIndex]);

  function loadSampleNote() {
    setClinicalNote(SAMPLE_CLINICAL_NOTE);
    setError("");
    setResult(null);
    setAppealLetter("");
  }

  async function processClaim() {
    if (!clinicalNote.trim()) {
      setError("Enter a clinical note before processing.");
      return;
    }

    setError("");
    setResult(null);
    setAppealLetter("");
    setIsProcessing(true);
    setLoadingIndex(0);

    const loadingTimer = window.setInterval(() => {
      setLoadingIndex((index) => Math.min(index + 1, loadingSteps.length - 1));
    }, 1800);

    try {
      const response = await fetch(`${API_BASE_URL}/api/process-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicalNote }),
      });

      const data = await readJsonResponse(response, "Claim processing failed.");

      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      window.clearInterval(loadingTimer);
      setIsProcessing(false);
    }
  }

  async function simulateDenial() {
    if (!result) {
      return;
    }

    setError("");
    setIsAppealing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimData: {
            extractedEntities: result.extractedEntities,
            claim: result.claim,
            compliance: result.compliance,
          },
          denialReason: MOCK_DENIAL_REASON,
          retrievedRules: result.compliance?.retrievedRules || [],
        }),
      });

      const data = await readJsonResponse(response, "Appeal generation failed.");

      setAppealLetter(data.appealLetter);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAppealing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f1] text-stone-950">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.35fr)] lg:px-6">
        <section className="flex min-h-[calc(100vh-2.5rem)] flex-col border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
            <div className="flex h-10 w-10 items-center justify-center bg-teal-700 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700">MedCode</p>
              <h1 className="text-xl font-semibold text-stone-950">Claims Negotiator</h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="clinical-note" className="text-sm font-semibold text-stone-800">
              Clinical Note
            </label>
            <button
              type="button"
              onClick={loadSampleNote}
              disabled={isProcessing}
              className="inline-flex min-h-9 items-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Sample Note
            </button>
          </div>
          <textarea
            id="clinical-note"
            value={clinicalNote}
            onChange={(event) => setClinicalNote(event.target.value)}
            placeholder="Paste the doctor's clinical note here..."
            className="mt-2 min-h-[360px] flex-1 resize-none border border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-900 outline-none focus:border-teal-600 focus:bg-white"
          />

          {error ? (
            <div className="mt-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={processClaim}
            disabled={isProcessing || !clinicalNote.trim()}
            className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isProcessing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {isProcessing ? "Processing Claim" : "Process Claim"}
          </button>
        </section>

        <section className="min-h-[calc(100vh-2.5rem)] overflow-hidden border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase text-stone-500">Dashboard</p>
              <h2 className="text-xl font-semibold text-stone-950">Claim Output</h2>
            </div>
            <ClipboardCheck className="h-6 w-6 text-teal-700" aria-hidden="true" />
          </div>

          <div className="h-[calc(100vh-7rem)] overflow-y-auto p-5">
            {isProcessing ? (
              <LoadingPanel step={currentLoadingStep} />
            ) : result ? (
              <ResultsPanel
                result={result}
                appealLetter={appealLetter}
                isAppealing={isAppealing}
                onSimulateDenial={simulateDenial}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
