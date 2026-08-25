"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { CITIZEN_MESSAGES } from "../../content/en";
import { DEMO_INCIDENT_DRAFT } from "../../incident/demo-incident";
import {
  applyMissingAnswer,
  deriveMissingQuestions,
  type MissingQuestion,
} from "../../incident/missing-information";
import {
  generateNcrpFields,
  totalIncidentTransactionAmount,
} from "../../incident/ncrp-mapping";
import {
  IncidentDraftSchema,
  TranscriptionResultSchema,
  type IncidentDraft,
  type TranscriptionResult,
} from "../../incident/schema";
import {
  DEMO_REFUND_ACCOUNT,
  DEMO_RESTORATION_REQUEST_ID,
  deriveJourneyFinancialSummary,
  deriveJourneyTrail,
  type JourneyTrailItem,
} from "../../presentation/demo-journey";
import { formatCurrency } from "../../presentation/format";
import { DEMO_CASE_ACCESS, useDemoCase } from "../demo-case/demo-case-provider";
import { JourneyProgress, type JourneyProgressStep } from "./journey-progress";

type JourneyView =
  | "ACT"
  | "WHO_AFFECTED"
  | "REPORT_INPUT"
  | "ANALYSING"
  | "ANALYSIS_RESULT"
  | "MISSING_INFORMATION"
  | "REVIEW"
  | "COMPLAINT_REGISTERED"
  | "POST_SUBMISSION"
  | "FINANCIAL_TRAIL"
  | "MRM_REQUEST"
  | "MRM_SUBMITTED"
  | "ANALYSIS_ERROR";

type ReportingFor = "SELF" | "HELPING";

const DEMO_EVIDENCE = [
  { src: "/demo/whatsapp-investment-scam.png", alt: "Synthetic WhatsApp investment conversation" },
  { src: "/demo/upi-payments.png", alt: "Synthetic UPI payment records" },
] as const;

function StageLayout({
  progress,
  children,
  onRestart,
}: {
  progress: JourneyProgressStep;
  children: ReactNode;
  onRestart?: () => void;
}) {
  return (
    <section id={progress === "ACT" ? "full-flow" : undefined} className="journey-stage section-pad">
      <div className="shell reading-shell">
        <div className="journey-progress-row">
          <JourneyProgress current={progress} />
          {onRestart ? (
            <button className="text-button journey-restart" type="button" onClick={onRestart}>
              Restart demo
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function TrailState({ item }: { item: JourneyTrailItem }) {
  switch (item.state) {
    case "HELD":
      return <>Held at {item.institutionName}</>;
    case "RECEIVED":
      return <>Received under interim custody</>;
    case "EXITED":
      return <>Cash withdrawal recorded</>;
    case "NOT_SECURED":
      return <>Not currently secured</>;
    case "ATTRIBUTION_PENDING":
      return <>Attribution pending</>;
  }
}

function dateLabel(date: string | null): string {
  if (!date) return "Not provided";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

async function compressScreenshot(file: File): Promise<File> {
  if (file.size <= 1_500_000 || typeof createImageBitmap === "undefined") return file;

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function UrgentMoneyGuidance() {
  return (
    <aside className="urgent-guidance" aria-labelledby="urgent-money-heading">
      <h2 id="urgent-money-heading">Money was lost</h2>
      <p>If this happened recently, call 1930 now. You can continue preparing the online report here.</p>
      <a className="secondary-button" href="tel:1930">Call 1930</a>
    </aside>
  );
}

function EvidenceSafetyNotice() {
  return (
    <div className="safety-notice">
      <p><strong>Use synthetic or test information only.</strong></p>
      <p>Do not upload OTPs, PINs, passwords, CVVs or real sensitive financial documents. Files are not stored by this prototype.</p>
    </div>
  );
}

export function DemoJourney() {
  const router = useRouter();
  const { caseData, authenticateDemo, resetDemo } = useDemoCase();
  const [view, setView] = useState<JourneyView>("ACT");
  const [reportingFor, setReportingFor] = useState<ReportingFor>("SELF");
  const [draft, setDraft] = useState<IncidentDraft | null>(null);
  const [narrative, setNarrative] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Reading your evidence…");
  const [formError, setFormError] = useState<string | null>(null);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isDemoIncident, setIsDemoIncident] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const trail = deriveJourneyTrail(caseData);
  const summary = deriveJourneyFinancialSummary(caseData);

  useEffect(() => {
    if (view !== "ACT") {
      document.querySelector<HTMLElement>("#journey-stage-heading")?.focus();
    }
  }, [view]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((current) => {
        const next = current + 1;
        if (next >= 30 && recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
          recorderRef.current.stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
        }
        return Math.min(next, 30);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  function initialiseCase() {
    resetDemo();
    authenticateDemo(DEMO_CASE_ACCESS.acknowledgementNumber, DEMO_CASE_ACCESS.registeredMobile);
  }

  function restartJourney() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    initialiseCase();
    setView("ACT");
    setReportingFor("SELF");
    setDraft(null);
    setNarrative("");
    setScreenshots([]);
    setTranscription(null);
    setAudio(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    setFormError(null);
    setMissingAnswers({});
    setIsEditing(false);
    setIsDemoIncident(false);
  }

  function useDemoIncident() {
    initialiseCase();
    setLoadingMessage("Reading the synthetic evidence…");
    setView("ANALYSING");
    window.setTimeout(() => {
      setLoadingMessage("Organising the complaint…");
      window.setTimeout(() => {
        setDraft(structuredClone(DEMO_INCIDENT_DRAFT));
        setIsDemoIncident(true);
        setView("ANALYSIS_RESULT");
      }, 400);
    }, 450);
  }

  function chooseAffectedPerson(choice: ReportingFor) {
    setReportingFor(choice);
    setView("REPORT_INPUT");
  }

  async function startRecording() {
    setFormError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recorderChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setAudio(new Blob(recorderChunksRef.current, { type: recorder.mimeType }));
      };
      recorderRef.current = recorder;
      setAudio(null);
      setTranscription(null);
      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start();
    } catch {
      setFormError("Microphone access was unavailable. You can type, add test screenshots or use the demo incident.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  }

  function recordAgain() {
    setAudio(null);
    setTranscription(null);
    setRecordingSeconds(0);
  }

  async function handleScreenshots(event: ChangeEvent<HTMLInputElement>) {
    setFormError(null);
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > 2) {
      setFormError("Add no more than two screenshots.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
      setFormError("Screenshots must be PNG, JPEG or WebP images.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > 8 * 1024 * 1024)) {
      setFormError("Each screenshot must be under 8 MB before compression.");
      event.target.value = "";
      return;
    }
    setScreenshots(await Promise.all(selected.map(compressScreenshot)));
  }

  async function requestTranscription() {
    if (!audio) return;
    setFormError(null);
    setLoadingMessage("Listening to your statement…");
    setView("ANALYSING");
    try {
      const data = new FormData();
      data.append("audio", audio, "statement.webm");
      const response = await fetch("/api/transcribe", { method: "POST", body: data });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(typeof result === "object" && result && "error" in result ? String(result.error) : "Transcription failed.");
      setTranscription(TranscriptionResultSchema.parse(result));
      setView("REPORT_INPUT");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We couldn't transcribe this recording.");
      setView("REPORT_INPUT");
    }
  }

  async function buildComplaint() {
    if (audio && !transcription) {
      await requestTranscription();
      return;
    }
    if (!narrative.trim() && screenshots.length === 0 && !transcription) {
      setFormError("Speak, add a test screenshot or type what happened before continuing.");
      return;
    }

    setFormError(null);
    setLoadingMessage("Reading your evidence…");
    setView("ANALYSING");
    try {
      const data = new FormData();
      data.append("narrative", narrative);
      data.append("englishTranscript", transcription?.englishTranscript ?? "");
      data.append("reportingFor", reportingFor);
      screenshots.forEach((file) => data.append("screenshots", file, file.name));
      const response = await fetch("/api/analyze-incident", { method: "POST", body: data });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error("Analysis failed.");
      setDraft(IncidentDraftSchema.parse(result));
      setIsDemoIncident(false);
      setView("ANALYSIS_RESULT");
    } catch {
      setView("ANALYSIS_ERROR");
    }
  }

  function acceptAnalysis() {
    if (!draft) return;
    const questions = deriveMissingQuestions(draft);
    setView(questions.length > 0 ? "MISSING_INFORMATION" : "REVIEW");
  }

  function saveMissingAnswers(questions: MissingQuestion[]) {
    if (!draft) return;
    let updated = draft;
    for (const question of questions) {
      updated = applyMissingAnswer(updated, question.field, missingAnswers[question.field] ?? "");
    }
    setDraft(updated);
    setMissingAnswers({});
    setView(deriveMissingQuestions(updated).length > 0 ? "MISSING_INFORMATION" : "REVIEW");
  }

  function submitComplaint() {
    initialiseCase();
    setView("COMPLAINT_REGISTERED");
  }

  let content: ReactNode;

  switch (view) {
    case "ACT":
      content = (
        <StageLayout progress="ACT">
          <p className="prototype-label">Independent hackathon prototype</p>
          <h1>Report a financial cyber fraud</h1>
          <p className="lede">Tell us what happened. Speak in your language, upload test evidence or type. We’ll organise the information for you to review.</p>
          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={useDemoIncident}>Use demo incident</button>
            <button className="secondary-button" type="button" onClick={() => setView("WHO_AFFECTED")}>Try with test evidence</button>
          </div>
          <p className="journey-note">The demo incident works without external services.</p>
          <aside className="act-urgent">
            <p><strong>Lost money recently?</strong><br />Call 1930 now while you continue preparing your report.</p>
            <a href="tel:1930">Call 1930</a>
          </aside>
        </StageLayout>
      );
      break;

    case "WHO_AFFECTED":
      content = (
        <StageLayout progress="ACT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>Who was affected?</h1>
          <div className="choice-list" role="group" aria-label="Who was affected">
            <button className="choice-button" type="button" onClick={() => chooseAffectedPerson("SELF")}>
              <strong>Me</strong><span>I’m preparing my own report.</span>
            </button>
            <button className="choice-button" type="button" onClick={() => chooseAffectedPerson("HELPING")}>
              <strong>I’m helping someone</strong><span>The affected person reviews it before submission.</span>
            </button>
          </div>
          <p>You can help organise the evidence and prepare the report. No delegated account access is created.</p>
        </StageLayout>
      );
      break;

    case "REPORT_INPUT":
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>Tell us what happened</h1>
          <p className="lede">Use one method or combine them. You do not need to choose a fraud or bank category.</p>
          <UrgentMoneyGuidance />
          <EvidenceSafetyNotice />

          <div className="report-methods">
            <section aria-labelledby="speak-heading">
              <h2 id="speak-heading">Speak in any Indian language</h2>
              {!audio ? (
                <div className="recording-control">
                  <button className={isRecording ? "secondary-button" : "primary-button"} type="button" onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? "Stop recording" : "Start recording"}
                  </button>
                  <span className="recording-time" aria-live="polite">00:{String(recordingSeconds).padStart(2, "0")}</span>
                </div>
              ) : (
                <div>
                  <p><strong>Recording ready</strong> · {recordingSeconds || 1} seconds</p>
                  <button className="text-button" type="button" onClick={recordAgain}>Record again</button>
                </div>
              )}
              {transcription ? (
                <div className="transcript-result" aria-live="polite">
                  <h3>You said</h3>
                  <p lang={transcription.languageCode}>{transcription.originalTranscript}</p>
                  <h3>English interpretation</h3>
                  <p>{transcription.englishTranscript}</p>
                </div>
              ) : null}
            </section>

            <section aria-labelledby="upload-heading">
              <h2 id="upload-heading">Upload test evidence</h2>
              <label className="file-button" htmlFor="incident-screenshots">Add screenshots</label>
              <input id="incident-screenshots" className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleScreenshots} />
              <p className="form-hint">Maximum 2 images. PNG, JPEG or WebP.</p>
              {screenshots.length > 0 ? (
                <ul className="selected-files" aria-label="Selected screenshots">
                  {screenshots.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}
                </ul>
              ) : null}
            </section>

            <section aria-labelledby="type-heading">
              <h2 id="type-heading">Type</h2>
              <label className="visually-hidden" htmlFor="incident-narrative">What happened?</label>
              <textarea id="incident-narrative" rows={6} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Describe what happened in your own words (optional)." maxLength={8000} />
            </section>
          </div>

          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={buildComplaint}>
              {audio && !transcription ? "Transcribe statement" : "Build complaint"}
            </button>
            <button className="text-button" type="button" onClick={useDemoIncident}>Use demo incident</button>
          </div>
        </StageLayout>
      );
      break;

    case "ANALYSING":
      content = (
        <StageLayout progress="REPORT">
          <div className="loading-state" role="status" aria-live="polite">
            <span className="loading-marker" aria-hidden="true" />
            <h1 id="journey-stage-heading" tabIndex={-1}>{loadingMessage}</h1>
            <p>This may take a moment. Your uploaded files are not stored by this prototype.</p>
          </div>
        </StageLayout>
      );
      break;

    case "ANALYSIS_ERROR":
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>We couldn’t analyse this evidence</h1>
          <p>Try again, or continue with the precomputed synthetic incident so the journey is never blocked.</p>
          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={useDemoIncident}>Use demo incident</button>
            <button className="secondary-button" type="button" onClick={() => setView("REPORT_INPUT")}>Try again</button>
          </div>
        </StageLayout>
      );
      break;

    case "ANALYSIS_RESULT": {
      if (!draft) return null;
      const total = totalIncidentTransactionAmount(draft);
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>Here’s what we understood</h1>
          {draft.incident.moneyLost ? <UrgentMoneyGuidance /> : null}
          <dl className="understanding-summary">
            <div><dt>What happened</dt><dd>{draft.citizenSummary.incidentLabel}</dd></div>
            <div><dt>Money lost</dt><dd>{total > 0 ? formatCurrency(total) : "Not confirmed"}</dd></div>
            <div><dt>Contact</dt><dd>{draft.incident.occurredOn ?? "Not confirmed"}</dd></div>
            <div><dt>Date</dt><dd>{dateLabel(draft.incident.incidentDate)}</dd></div>
            <div><dt>Transactions found</dt><dd>{draft.transactions.length}</dd></div>
            <div><dt>Pieces of evidence</dt><dd>{draft.evidence.length}</dd></div>
            <div><dt>Suspect contacts found</dt><dd>{draft.suspectIdentifiers.length}</dd></div>
          </dl>

          <section className="mapping-section" aria-labelledby="mapping-heading">
            <h2 id="mapping-heading">Suggested official NCRP mapping</h2>
            <p><strong>{draft.officialMapping.categoryLabel ?? "Category not confirmed"}</strong><br />{draft.officialMapping.subCategoryLabel ?? "Sub-category not confirmed"}</p>
            <p className="form-hint">This is a suggested mapping for you to confirm. It is not a legal conclusion.</p>
          </section>

          {isEditing ? (
            <div className="edit-understanding">
              <div className="form-field">
                <label htmlFor="edit-label">Your description</label>
                <input id="edit-label" value={draft.citizenSummary.incidentLabel} onChange={(event) => setDraft({ ...draft, citizenSummary: { ...draft.citizenSummary, incidentLabel: event.target.value } })} />
              </div>
              <div className="form-field">
                <label htmlFor="edit-date">Incident date</label>
                <input id="edit-date" type="date" value={draft.incident.incidentDate ?? ""} onChange={(event) => setDraft({ ...draft, incident: { ...draft.incident, incidentDate: event.target.value || null } })} />
              </div>
              <div className="form-field">
                <label htmlFor="edit-place">Where it happened</label>
                <input id="edit-place" value={draft.incident.occurredOn ?? ""} onChange={(event) => setDraft({ ...draft, incident: { ...draft.incident, occurredOn: event.target.value || null } })} />
              </div>
              <button className="secondary-button" type="button" onClick={() => setIsEditing(false)}>Save changes</button>
            </div>
          ) : null}

          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={acceptAnalysis}>Looks right</button>
            <button className="text-button" type="button" onClick={() => setIsEditing((current) => !current)}>{isEditing ? "Close edit" : "Something wrong? Edit"}</button>
          </div>
        </StageLayout>
      );
      break;
    }

    case "MISSING_INFORMATION": {
      if (!draft) return null;
      const questions = deriveMissingQuestions(draft).slice(0, 3);
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>A few details are still needed</h1>
          <p>We’ll ask only for information that was not already captured.</p>
          <div className="missing-questions">
            {questions.map((question) => (
              <div className="form-field" key={question.field}>
                <label htmlFor={`missing-${question.field}`}>{question.question}</label>
                <input id={`missing-${question.field}`} type={question.inputType} value={missingAnswers[question.field] ?? ""} onChange={(event) => setMissingAnswers((current) => ({ ...current, [question.field]: event.target.value }))} />
              </div>
            ))}
          </div>
          <button className="primary-button" type="button" onClick={() => saveMissingAnswers(questions)}>Continue</button>
        </StageLayout>
      );
      break;
    }

    case "REVIEW": {
      if (!draft) return null;
      const total = totalIncidentTransactionAmount(draft);
      const generatedFields = generateNcrpFields(draft);
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>Review your report</h1>
          <div className="review-sections">
            <section><h2>What happened</h2><p>{draft.incident.narrative ?? draft.citizenSummary.shortSummary}</p></section>
            <section><h2>Money lost</h2><p><strong>{formatCurrency(total)}</strong><br />{draft.transactions.length} transactions</p></section>
            <section><h2>Evidence</h2><p>{draft.evidence.length} items included{transcription ? " · Voice statement" : ""}</p></section>
            <section><h2>Suspect information</h2><p>{draft.suspectIdentifiers.length > 0 ? draft.suspectIdentifiers.map((item) => `${item.type.toLowerCase()}: ${item.value}`).join(" · ") : "None supplied"}</p></section>
            <section><h2>Reporting as</h2><p>{draft.officialMapping.categoryLabel ?? "Not confirmed"}<br />{draft.officialMapping.subCategoryLabel ?? "Not confirmed"}</p></section>
            <section><h2>Your details</h2><p><strong>Asha Verma</strong><br />Karnataka<br />Registered mobile ••••••0024</p><p className="form-hint">In a live service, these details would come from the authenticated NCRP profile.</p></section>
          </div>

          <details className="detail-disclosure generated-fields">
            <summary>View generated NCRP fields</summary>
            <div className="detail-disclosure-content">
              <dl>
                {generatedFields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
              </dl>
            </div>
          </details>

          <button className="primary-button" type="button" onClick={submitComplaint}>Submit synthetic complaint</button>
          <p className="journey-note">This does not submit information to NCRP or any government system.</p>
        </StageLayout>
      );
      break;
    }

    case "COMPLAINT_REGISTERED":
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <p className="success-kicker">Synthetic submission complete</p>
          <h1 id="journey-stage-heading" tabIndex={-1}>Complaint registered</h1>
          <p className="journey-identifier">{caseData.complaint.acknowledgementId}</p>
          <p>The structured complaint can now enter the synthetic financial-fraud response journey.</p>
          <button className="primary-button" type="button" onClick={() => setView("POST_SUBMISSION")}>What happens now?</button>
        </StageLayout>
      );
      break;

    case "POST_SUBMISSION":
      content = (
        <StageLayout progress="REPORT" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>What happens now?</h1>
          <dl className="next-steps">
            <div><dt>Done</dt><dd>Complaint registered.</dd></div>
            <div><dt>Now</dt><dd>The financial-fraud response process can begin.</dd></div>
            <div><dt>Keep</dt><dd>Your original evidence and transaction details.</dd></div>
            <div><dt>Next</dt><dd>We’ll show how different parts of the reported amount move through this synthetic case.</dd></div>
          </dl>
          <button className="primary-button" type="button" onClick={() => setView("FINANCIAL_TRAIL")}>See the financial trail</button>
        </StageLayout>
      );
      break;

    case "FINANCIAL_TRAIL":
      content = (
        <StageLayout progress="RESTORE" onRestart={restartJourney}>
          <h1 id="journey-stage-heading" tabIndex={-1}>What happened to the reported ₹2,00,000?</h1>
          <p className="lede">Different portions of one fraud can end up in different financial situations.</p>
          <div className="journey-trail-list">
            {trail.map((item) => (
              <div key={item.id} className="journey-trail-item"><strong>{formatCurrency(item.amount)}</strong><span><TrailState item={item} /></span></div>
            ))}
          </div>
          <dl className="journey-total"><div><dt>Total reported</dt><dd>{formatCurrency(summary.reportedAmount)}</dd></div></dl>
          <p className="journey-held-note">₹1,15,000 is recorded as held or inside active financial processes. Held is not the same as received.</p>
          <button className="primary-button" type="button" onClick={() => setView("MRM_REQUEST")}>Continue to Money Restoration</button>
        </StageLayout>
      );
      break;

    case "MRM_REQUEST":
      content = (
        <StageLayout progress="RESTORE" onRestart={restartJourney}>
          <p className="journey-stage-label">Existing Money Restoration stage · Simplified for this synthetic demo</p>
          <h1 id="journey-stage-heading" tabIndex={-1}>Money Restoration request</h1>
          <p>The information already reviewed above is reused. There is no duplicate data entry.</p>
          <dl className="journey-facts">
            <div><dt>NCRP complaint</dt><dd>{caseData.complaint.acknowledgementId}</dd></div>
            <div><dt>Reported loss</dt><dd>{formatCurrency(summary.reportedAmount)}</dd></div>
            <div><dt>Held amounts entering restoration-related processing</dt><dd>{formatCurrency(summary.activeAmount)}</dd></div>
            <div><dt>Refund account</dt><dd>{DEMO_REFUND_ACCOUNT}</dd></div>
            <div><dt>Required documents</dt><dd>Ready</dd></div>
          </dl>
          <button className="primary-button" type="button" onClick={() => setView("MRM_SUBMITTED")}>Submit synthetic Money Restoration request</button>
        </StageLayout>
      );
      break;

    case "MRM_SUBMITTED":
      content = (
        <StageLayout progress="RESTORE" onRestart={restartJourney}>
          <p className="success-kicker">Synthetic submission complete</p>
          <h1 id="journey-stage-heading" tabIndex={-1}>Money Restoration request submitted</h1>
          <dl className="journey-facts"><div><dt>Request ID</dt><dd>{DEMO_RESTORATION_REQUEST_ID}</dd></div></dl>
          <p>The request can now move through the recorded police, bank and procedural steps.</p>
          <section className="journey-handoff" aria-labelledby="handoff-heading">
            <h2 id="handoff-heading">Now understand what happens to each amount</h2>
            <ul><li>Where is each amount now?</li><li>Who needs to act?</li><li>Do I need to do anything?</li></ul>
          </section>
          <button className="primary-button" type="button" onClick={() => router.push("/case")}>Continue to Financial Resolution</button>
        </StageLayout>
      );
      break;
  }

  return (
    <>
      {content}
      {view === "ANALYSIS_RESULT" && isDemoIncident ? (
        <section className="demo-evidence-preview section-pad" aria-labelledby="demo-evidence-heading">
          <div className="shell reading-shell">
            <h2 id="demo-evidence-heading">Synthetic evidence used in this demo</h2>
            <div className="evidence-preview-grid">
              {DEMO_EVIDENCE.map((item) => <Image key={item.src} src={item.src} alt={item.alt} width={360} height={360} sizes="(max-width: 520px) 46vw, 240px" />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
