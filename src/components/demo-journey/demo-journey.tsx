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
  | "REPORT_START"
  | "REPORT_INPUT"
  | "ANALYSING"
  | "ANALYSIS_RESULT"
  | "MISSING_INFORMATION"
  | "REVIEW"
  | "COMPLAINT_REGISTERED"
  | "FINANCIAL_TRAIL"
  | "MRM_REQUEST"
  | "MRM_SUBMITTED"
  | "ANALYSIS_ERROR";

type ReportingFor = "SELF" | "HELPING";
type ReportMethod = "SPEAK" | "UPLOAD" | "TYPE";

const DEMO_EVIDENCE = [
  { src: "/demo/whatsapp-investment-scam.png", alt: "Synthetic WhatsApp investment conversation" },
  { src: "/demo/upi-payments.png", alt: "Synthetic UPI payment records" },
] as const;

function StageLayout({
  progress,
  children,
}: {
  progress: JourneyProgressStep;
  children: ReactNode;
}) {
  return (
    <section id={progress === "REPORT" ? "report-fraud" : undefined} className="journey-stage section-pad">
      <div className="shell reading-shell">
        <JourneyProgress current={progress} />
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
    <p className="urgent-guidance">
      If money was lost recently, call <a href="tel:1930">1930</a> as soon as possible.
    </p>
  );
}

function EvidenceSafetyNotice() {
  return (
    <div className="safety-notice">
      <p>Use synthetic or test information only. Do not upload OTPs, PINs or passwords.</p>
    </div>
  );
}

export function DemoJourney() {
  const router = useRouter();
  const { caseData, authenticateDemo, resetDemo } = useDemoCase();
  const [view, setView] = useState<JourneyView>("REPORT_START");
  const [reportingFor, setReportingFor] = useState<ReportingFor | null>(null);
  const [reportMethod, setReportMethod] = useState<ReportMethod>("SPEAK");
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
  const [missingQuestionTotal, setMissingQuestionTotal] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDemoIncident, setIsDemoIncident] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const trail = deriveJourneyTrail(caseData);
  const summary = deriveJourneyFinancialSummary(caseData);

  useEffect(() => {
    if (view !== "REPORT_START") {
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

  function useDemoIncident() {
    initialiseCase();
    setLoadingMessage("Reading your information…");
    setView("ANALYSING");
    window.setTimeout(() => {
      setLoadingMessage("Organising your report…");
      window.setTimeout(() => {
        setDraft(structuredClone(DEMO_INCIDENT_DRAFT));
        setIsDemoIncident(true);
        setView("ANALYSIS_RESULT");
      }, 400);
    }, 450);
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

  async function transcribeRecording(): Promise<TranscriptionResult> {
    if (!audio) throw new Error("No recording is available.");
    const data = new FormData();
    data.append("audio", audio, "statement.webm");
    const response = await fetch("/api/transcribe", { method: "POST", body: data });
    const result: unknown = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof result === "object" && result && "error" in result
          ? String(result.error)
          : "We couldn't read this recording.",
      );
    }
    return TranscriptionResultSchema.parse(result);
  }

  async function buildComplaint() {
    if (!narrative.trim() && screenshots.length === 0 && !transcription) {
      if (!audio) {
        setFormError("Speak, add a test screenshot or type what happened before continuing.");
        return;
      }
    }
    if (!reportingFor) {
      setFormError("Choose who you are reporting for before continuing.");
      return;
    }

    setFormError(null);
    setLoadingMessage(audio && !transcription ? "Reading your statement…" : "Reading your information…");
    setView("ANALYSING");
    try {
      let preparedTranscription = transcription;
      if (audio && !preparedTranscription) {
        preparedTranscription = await transcribeRecording();
        setTranscription(preparedTranscription);
      }

      setLoadingMessage("Organising your report…");
      const data = new FormData();
      data.append("narrative", narrative);
      data.append("englishTranscript", preparedTranscription?.englishTranscript ?? "");
      data.append("reportingFor", reportingFor);
      screenshots.forEach((file) => data.append("screenshots", file, file.name));
      const response = await fetch("/api/analyze-incident", { method: "POST", body: data });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error("Analysis failed.");
      setDraft(IncidentDraftSchema.parse(result));
      setIsDemoIncident(false);
      setView("ANALYSIS_RESULT");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : null);
      setView("ANALYSIS_ERROR");
    }
  }

  function acceptAnalysis() {
    if (!draft) return;
    const questions = deriveMissingQuestions(draft);
    setMissingQuestionTotal(questions.length);
    setView(questions.length > 0 ? "MISSING_INFORMATION" : "REVIEW");
  }

  function saveMissingAnswer(question: MissingQuestion, fallback?: string) {
    if (!draft) return;
    const answer = fallback ?? missingAnswers[question.field] ?? "";
    if (!answer.trim()) {
      setFormError("Enter the detail, or choose that you do not have it.");
      return;
    }
    const updated = applyMissingAnswer(draft, question.field, answer);
    setDraft(updated);
    setMissingAnswers({});
    setFormError(null);
    setView(deriveMissingQuestions(updated).length > 0 ? "MISSING_INFORMATION" : "REVIEW");
  }

  function submitComplaint() {
    initialiseCase();
    setView("COMPLAINT_REGISTERED");
  }

  let content: ReactNode;

  switch (view) {
    case "REPORT_START":
      content = (
        <StageLayout progress="REPORT">
          <h1>Report a financial cyber fraud</h1>
          <p className="lede">Tell us what happened. We’ll help organise the information needed for the report.</p>
          <fieldset className="reporting-for-fieldset">
            <legend>Who are you reporting for?</legend>
            <div className="choice-list">
              <label className={reportingFor === "SELF" ? "choice-option choice-option-selected" : "choice-option"}>
                <input type="radio" name="reporting-for" value="SELF" checked={reportingFor === "SELF"} onChange={() => setReportingFor("SELF")} />
                <span>Myself</span>
              </label>
              <label className={reportingFor === "HELPING" ? "choice-option choice-option-selected" : "choice-option"}>
                <input type="radio" name="reporting-for" value="HELPING" checked={reportingFor === "HELPING"} onChange={() => setReportingFor("HELPING")} />
                <span>Someone else</span>
              </label>
            </div>
          </fieldset>
          {reportingFor === "HELPING" ? (
            <p className="form-hint">The affected person should review the information before submission.</p>
          ) : null}
          <UrgentMoneyGuidance />
          <button className="primary-button" type="button" disabled={!reportingFor} onClick={() => setView("REPORT_INPUT")}>Continue</button>
        </StageLayout>
      );
      break;

    case "REPORT_INPUT":
      content = (
        <StageLayout progress="REPORT">
          <h1 id="journey-stage-heading" tabIndex={-1}>Tell us what happened</h1>
          <p className="lede">Choose the easiest way to share the information.</p>

          <div className="report-tabs" role="group" aria-label="Ways to share what happened">
            {([
              ["SPEAK", "Speak"],
              ["UPLOAD", "Upload evidence"],
              ["TYPE", "Type"],
            ] as const).map(([method, label]) => (
              <button
                key={method}
                id={`report-tab-${method.toLowerCase()}`}
                className="report-tab"
                type="button"
                aria-pressed={reportMethod === method}
                onClick={() => setReportMethod(method)}
              >
                {label}
              </button>
            ))}
          </div>

          {reportMethod === "SPEAK" ? (
            <section id="report-panel-speak" className="report-method-panel" aria-labelledby="speak-heading">
              <h2 id="speak-heading">Speak in your language</h2>
              <p>You can describe what happened naturally. We’ll organise the important details for you.</p>
              {!audio ? (
                <>
                  <div className="recording-control">
                    <button className={isRecording ? "secondary-button" : "primary-button"} type="button" onClick={isRecording ? stopRecording : startRecording}>
                      {isRecording ? "Stop recording" : "Start recording"}
                    </button>
                    <span className="recording-time" aria-live="polite">00:{String(recordingSeconds).padStart(2, "0")}</span>
                  </div>
                  <button className="text-button demo-incident-button" type="button" onClick={useDemoIncident}>Use demo incident</button>
                </>
              ) : (
                <>
                  <div className="input-added-state" role="status">
                    <p><strong>Statement added ✓</strong></p>
                    <p>{transcription?.languageCode === "hi-IN" ? "Hindi" : "Recording"} · {recordingSeconds || 1} seconds</p>
                    <button className="text-button" type="button" onClick={recordAgain}>Record again</button>
                  </div>
                  <button className="text-button method-switch" type="button" onClick={() => setReportMethod("UPLOAD")}>Add evidence</button>
                  <button className="primary-button" type="button" onClick={buildComplaint}>Continue</button>
                </>
              )}
            </section>
          ) : null}

          {reportMethod === "UPLOAD" ? (
            <section id="report-panel-upload" className="report-method-panel" aria-labelledby="report-tab-upload">
              <h2>Add evidence</h2>
              <p>Upload screenshots of transactions, chats or payment confirmations.</p>
              <label className="file-button" htmlFor="incident-screenshots">Choose screenshots</label>
              <input id="incident-screenshots" className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleScreenshots} />
              <p className="form-hint">Maximum 2 synthetic or demo screenshots.</p>
              <EvidenceSafetyNotice />
              {screenshots.length > 0 ? (
                <p className="input-added-state" role="status"><strong>{screenshots.length} {screenshots.length === 1 ? "screenshot" : "screenshots"} added ✓</strong></p>
              ) : null}
              <button className="primary-button" type="button" onClick={buildComplaint}>Continue</button>
            </section>
          ) : null}

          {reportMethod === "TYPE" ? (
            <section id="report-panel-type" className="report-method-panel" aria-labelledby="report-tab-type">
              <h2>Describe what happened</h2>
              <label className="visually-hidden" htmlFor="incident-narrative">What happened?</label>
              <textarea id="incident-narrative" rows={7} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="I received a WhatsApp message about an investment opportunity…" maxLength={8000} />
              <button className="primary-button" type="button" onClick={buildComplaint}>Continue</button>
            </section>
          ) : null}

          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
        </StageLayout>
      );
      break;

    case "ANALYSING":
      content = (
        <StageLayout progress="REVIEW">
          <div className="loading-state" role="status" aria-live="polite">
            <span className="loading-marker" aria-hidden="true" />
            <h1 id="journey-stage-heading" tabIndex={-1}>{loadingMessage}</h1>
          </div>
        </StageLayout>
      );
      break;

    case "ANALYSIS_ERROR":
      content = (
        <StageLayout progress="REVIEW">
          <h1 id="journey-stage-heading" tabIndex={-1}>We couldn’t analyse this evidence</h1>
          <p>Try again, or continue with the synthetic demo incident.</p>
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
        <StageLayout progress="REVIEW">
          <h1 id="journey-stage-heading" tabIndex={-1}>Here’s what we understood</h1>
          <div className="understanding-lead">
            <h2>{draft.citizenSummary.incidentLabel}</h2>
            <p className="understanding-amount">{total > 0 ? `${formatCurrency(total)} lost` : "Amount not confirmed"}</p>
            <p>{dateLabel(draft.incident.incidentDate)}</p>
            <p>{draft.transactions.length} transactions · {draft.evidence.length} evidence items</p>
          </div>

          <section className="mapping-section" aria-labelledby="mapping-heading">
            <h2 id="mapping-heading">Reporting category</h2>
            <p><strong>{draft.officialMapping.categoryLabel ?? "Category not confirmed"}</strong><br />{draft.officialMapping.subCategoryLabel ?? "Sub-category not confirmed"}</p>
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
              <button className="secondary-button" type="button" onClick={() => setIsEditing(false)}>Save</button>
            </div>
          ) : null}

          <details className="detail-disclosure extracted-details">
            <summary>View extracted details</summary>
            <div className="detail-disclosure-content">
              <dl className="understanding-summary">
                <div><dt>Where it happened</dt><dd>{draft.incident.occurredOn ?? "Not confirmed"}</dd></div>
                <div><dt>Suspect details found</dt><dd>{draft.suspectIdentifiers.length}</dd></div>
              </dl>
              {isDemoIncident ? (
                <div className="evidence-preview-grid" aria-label="Synthetic evidence used in this demo">
                  {DEMO_EVIDENCE.map((item) => <Image key={item.src} src={item.src} alt={item.alt} width={360} height={360} sizes="(max-width: 520px) 46vw, 240px" />)}
                </div>
              ) : null}
            </div>
          </details>

          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={acceptAnalysis}>Confirm details</button>
            <button className="text-button" type="button" onClick={() => setIsEditing((current) => !current)}>{isEditing ? "Close" : "Edit"}</button>
          </div>
        </StageLayout>
      );
      break;
    }

    case "MISSING_INFORMATION": {
      if (!draft) return null;
      const questions = deriveMissingQuestions(draft);
      const question = questions[0];
      if (!question) return null;
      const questionNumber = Math.max(1, missingQuestionTotal - questions.length + 1);
      content = (
        <StageLayout progress="REVIEW">
          <p className="question-count">{questionNumber} of {missingQuestionTotal}</p>
          <h1 id="journey-stage-heading" tabIndex={-1}>One detail is still needed</h1>
          <div className="missing-questions form-field">
            <label htmlFor={`missing-${question.field}`}>{question.question}</label>
            <input id={`missing-${question.field}`} type={question.inputType} value={missingAnswers[question.field] ?? ""} onChange={(event) => setMissingAnswers({ [question.field]: event.target.value })} />
          </div>
          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={() => saveMissingAnswer(question)}>Continue</button>
            <button className="text-button" type="button" onClick={() => saveMissingAnswer(question, "I don't have this information")}>I don’t have this information</button>
          </div>
        </StageLayout>
      );
      break;
    }

    case "REVIEW": {
      if (!draft) return null;
      const total = totalIncidentTransactionAmount(draft);
      const generatedFields = generateNcrpFields(draft);
      content = (
        <StageLayout progress="REVIEW">
          <h1 id="journey-stage-heading" tabIndex={-1}>Review your report</h1>
          <div className="review-summary">
            <h2>{draft.citizenSummary.incidentLabel}</h2>
            <p>{dateLabel(draft.incident.incidentDate)}</p>
            <p><strong>{formatCurrency(total)} lost</strong><br />{draft.transactions.length} transactions</p>
            <p><strong>Evidence</strong><br />{transcription ? "Voice statement · " : ""}{draft.evidence.length} evidence items</p>
            <p><strong>Reporting as</strong><br />{draft.officialMapping.categoryLabel ?? "Not confirmed"}<br />{draft.officialMapping.subCategoryLabel ?? "Not confirmed"}</p>
            <p><strong>Reporter</strong><br />Asha Verma · Karnataka</p>
          </div>

          <details className="detail-disclosure generated-fields">
            <summary>View all report details</summary>
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
        <StageLayout progress="REVIEW">
          <h1 id="journey-stage-heading" tabIndex={-1}>Complaint registered</h1>
          <p className="journey-identifier">{caseData.complaint.acknowledgementId}</p>
          <p>Your report has entered the financial-fraud response process.</p>
          <p>Keep your original evidence and transaction details.</p>
          <button className="primary-button" type="button" onClick={() => setView("FINANCIAL_TRAIL")}>Continue</button>
        </StageLayout>
      );
      break;

    case "FINANCIAL_TRAIL":
      content = (
        <StageLayout progress="RESTORE">
          <h1 id="journey-stage-heading" tabIndex={-1}>Some of your money has been identified</h1>
          <div className="journey-trail-list">
            {trail.map((item) => (
              <div key={item.id} className="journey-trail-item"><strong>{formatCurrency(item.amount)}</strong><span><TrailState item={item} /></span></div>
            ))}
          </div>
          <p className="journey-held-note"><strong>{formatCurrency(summary.activeAmount)}</strong> is currently within an active financial process.</p>
          <button className="primary-button" type="button" onClick={() => setView("MRM_REQUEST")}>Continue</button>
        </StageLayout>
      );
      break;

    case "MRM_REQUEST":
      content = (
        <StageLayout progress="RESTORE">
          <h1 id="journey-stage-heading" tabIndex={-1}>Request money restoration</h1>
          <dl className="journey-facts">
            <div><dt>Eligible held amount</dt><dd>{formatCurrency(summary.activeAmount)}</dd></div>
            <div><dt>Refund account</dt><dd>{DEMO_REFUND_ACCOUNT}</dd></div>
            <div><dt>Required information</dt><dd>Ready</dd></div>
          </dl>
          <button className="primary-button" type="button" onClick={() => setView("MRM_SUBMITTED")}>Submit synthetic restoration request</button>
        </StageLayout>
      );
      break;

    case "MRM_SUBMITTED":
      content = (
        <StageLayout progress="RESTORE">
          <h1 id="journey-stage-heading" tabIndex={-1}>Restoration request submitted</h1>
          <p className="journey-identifier">{DEMO_RESTORATION_REQUEST_ID}</p>
          <p>Your request will now move through the relevant police, bank and legal steps.</p>
          <button className="primary-button" type="button" onClick={() => router.push("/case")}>Track progress</button>
        </StageLayout>
      );
      break;
  }

  return (
    content
  );
}
