"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { DEMO_INCIDENT_DRAFT } from "../../incident/demo-incident";
import {
  applyMissingAnswer,
  deriveMissingQuestions,
  type MissingQuestion,
} from "../../incident/missing-information";
import {
  IncidentDraftSchema,
  TranscriptionResultSchema,
  type IncidentDraft,
  type TranscriptionResult,
} from "../../incident/schema";
import { CITIZEN_MESSAGES } from "../../content/en";
import {
  DEMO_REFUND_ACCOUNT,
  DEMO_RESTORATION_REQUEST_ID,
  deriveJourneyFinancialSummary,
} from "../../presentation/demo-journey";
import { formatCurrency } from "../../presentation/format";
import { DEMO_CASE_ACCESS, useDemoCase } from "../demo-case/demo-case-provider";
import { JourneyProgress, type JourneyProgressStep } from "./journey-progress";
import {
  ReportWorkspace,
  type ReportMethod,
  type ReportWorkspaceMode,
} from "./report-workspace";

type JourneyView =
  | "REPORT_START"
  | "REPORT_INPUT"
  | "ANALYSING"
  | "ANALYSIS_RESULT"
  | "MISSING_INFORMATION"
  | "REVIEW"
  | "COMPLAINT_REGISTERED"
  | "POST_REPORT_HANDOFF"
  | "MRM_REQUEST"
  | "MRM_SUBMITTED"
  | "POST_MRM_HANDOFF"
  | "ANALYSIS_ERROR";

type ReportingFor = "SELF" | "HELPING";

function StageLayout({
  progress,
  children,
}: {
  progress: JourneyProgressStep;
  children: ReactNode;
}) {
  return (
    <section
      id={progress === "REPORT" ? "report-fraud" : undefined}
      className="journey-stage section-pad"
    >
      <div className="shell reading-shell">
        <JourneyProgress current={progress} />
        {children}
      </div>
    </section>
  );
}

async function compressScreenshot(file: File): Promise<File> {
  if (file.size <= 1_500_000 || typeof createImageBitmap === "undefined")
    return file;

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
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

function UrgentMoneyGuidance() {
  return (
    <p className="urgent-guidance">
      Lost money recently? Call <a href="tel:1930">1930</a> as soon as possible
      while you prepare the report.
    </p>
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
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(
    "Reading your evidence…",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>(
    {},
  );
  const [isDemoIncident, setIsDemoIncident] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const summary = deriveJourneyFinancialSummary(caseData);

  useEffect(() => {
    if (
      view === "REPORT_INPUT" ||
      view === "COMPLAINT_REGISTERED" ||
      view === "POST_REPORT_HANDOFF" ||
      view === "MRM_REQUEST" ||
      view === "MRM_SUBMITTED" ||
      view === "POST_MRM_HANDOFF"
    ) {
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
          recorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
          setIsRecording(false);
        }
        return Math.min(next, 30);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  function initialiseCase() {
    resetDemo();
    authenticateDemo(
      DEMO_CASE_ACCESS.acknowledgementNumber,
      DEMO_CASE_ACCESS.registeredMobile,
    );
  }

  function useDemoIncident() {
    initialiseCase();
    setNarrative(
      DEMO_INCIDENT_DRAFT.incident.narrative ??
        DEMO_INCIDENT_DRAFT.citizenSummary.shortSummary,
    );
    setScreenshots([]);
    setAudio(null);
    setTranscription(null);
    setFormError(null);
    setIsDemoIncident(true);
    setLoadingMessage("Organising your report…");
    setView("ANALYSING");
    window.setTimeout(() => {
      setDraft(structuredClone(DEMO_INCIDENT_DRAFT));
      setView("ANALYSIS_RESULT");
    }, 850);
  }

  async function startRecording() {
    setFormError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recorderChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recording = new Blob(recorderChunksRef.current, {
          type: recorder.mimeType,
        });
        setAudio(recording);
        void buildComplaint(recording);
      };
      recorderRef.current = recorder;
      setAudio(null);
      setTranscription(null);
      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start();
    } catch {
      setFormError(
        "Microphone access was unavailable. You can type, add test screenshots or use the demo incident.",
      );
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
    if (
      selected.some(
        (file) =>
          !["image/png", "image/jpeg", "image/webp"].includes(file.type),
      )
    ) {
      setFormError("Screenshots must be PNG, JPEG or WebP images.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > 8 * 1024 * 1024)) {
      setFormError("Each screenshot must be under 8 MB before compression.");
      event.target.value = "";
      return;
    }
    const preparedScreenshots = await Promise.all(
      selected.map(compressScreenshot),
    );
    setScreenshots(preparedScreenshots);
    void buildComplaint(undefined, preparedScreenshots);
  }

  async function transcribeRecording(
    recording: Blob | null,
  ): Promise<TranscriptionResult> {
    if (!recording) throw new Error("No recording is available.");
    const data = new FormData();
    data.append("audio", recording, "statement.webm");
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: data,
    });
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

  async function buildComplaint(
    recordingOverride?: Blob,
    screenshotOverride?: File[],
  ) {
    const recording = recordingOverride ?? audio;
    const evidence = screenshotOverride ?? screenshots;
    if (!narrative.trim() && evidence.length === 0 && !transcription) {
      if (!recording && evidence.length === 0) {
        setFormError(
          "Speak, add a test screenshot or type what happened before continuing.",
        );
        return;
      }
    }
    if (!reportingFor) {
      setFormError("Choose who you are reporting for before continuing.");
      return;
    }

    setFormError(null);
    setIsDemoIncident(false);
    setLoadingMessage(
      recording && !transcription
        ? "Reading your statement…"
        : "Organising your report…",
    );
    setView("ANALYSING");
    try {
      let preparedTranscription = transcription;
      if (recording && !preparedTranscription) {
        preparedTranscription = await transcribeRecording(recording);
        setTranscription(preparedTranscription);
      }

      setLoadingMessage("Organising your report…");
      const data = new FormData();
      data.append("narrative", narrative);
      data.append(
        "englishTranscript",
        preparedTranscription?.englishTranscript ?? "",
      );
      data.append("reportingFor", reportingFor);
      evidence.forEach((file) => data.append("screenshots", file, file.name));
      const response = await fetch("/api/analyze-incident", {
        method: "POST",
        body: data,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const serviceMessage =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : null;
        throw new Error(
          serviceMessage ??
            "We couldn’t organise the information. Your input is still here.",
        );
      }
      setDraft(IncidentDraftSchema.parse(result));
      setIsDemoIncident(false);
      setView("ANALYSIS_RESULT");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : null);
      setView("ANALYSIS_ERROR");
    }
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
    setView("ANALYSIS_RESULT");
  }

  function reviewReport() {
    if (!draft || deriveMissingQuestions(draft).length > 0) return;
    setFormError(null);
    setView("REVIEW");
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
          <p className="service-stage-label">
            {CITIZEN_MESSAGES.journey.existingNcrp.defaultMessage}
          </p>
          <h1>Report a financial cyber fraud</h1>
          <fieldset className="reporting-for-fieldset">
            <legend>Who are you reporting for?</legend>
            <div className="choice-list">
              <label
                className={
                  reportingFor === "SELF"
                    ? "choice-option choice-option-selected"
                    : "choice-option"
                }
              >
                <input
                  type="radio"
                  name="reporting-for"
                  value="SELF"
                  checked={reportingFor === "SELF"}
                  onChange={() => setReportingFor("SELF")}
                />
                <span>Myself</span>
              </label>
              <label
                className={
                  reportingFor === "HELPING"
                    ? "choice-option choice-option-selected"
                    : "choice-option"
                }
              >
                <input
                  type="radio"
                  name="reporting-for"
                  value="HELPING"
                  checked={reportingFor === "HELPING"}
                  onChange={() => setReportingFor("HELPING")}
                />
                <span>Someone else</span>
              </label>
            </div>
          </fieldset>
          {reportingFor === "HELPING" ? (
            <p className="form-hint">
              The affected person should review the information before
              submission.
            </p>
          ) : null}
          <UrgentMoneyGuidance />
          <button
            className="primary-button"
            type="button"
            disabled={!reportingFor}
            onClick={() => setView("REPORT_INPUT")}
          >
            Continue
          </button>
        </StageLayout>
      );
      break;

    case "REPORT_INPUT":
    case "ANALYSING":
    case "ANALYSIS_ERROR":
    case "ANALYSIS_RESULT":
    case "MISSING_INFORMATION":
    case "REVIEW": {
      const mode: ReportWorkspaceMode =
        view === "ANALYSING"
          ? "PROCESSING"
          : view === "ANALYSIS_ERROR"
            ? "ERROR"
            : view === "REVIEW"
              ? "REVIEW"
              : draft
                ? "READY"
                : "INPUT";
      content = (
        <ReportWorkspace
          mode={mode}
          reportMethod={reportMethod}
          narrative={narrative}
          screenshots={screenshots}
          transcription={transcription}
          hasAudio={Boolean(audio)}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          isDemoIncident={isDemoIncident}
          draft={draft}
          loadingMessage={loadingMessage}
          formError={formError}
          missingAnswers={missingAnswers}
          onReportMethodChange={setReportMethod}
          onNarrativeChange={setNarrative}
          onStartRecording={() => void startRecording()}
          onStopRecording={stopRecording}
          onRecordAgain={recordAgain}
          onScreenshotsChange={(event) => void handleScreenshots(event)}
          onOrganizeReport={() => void buildComplaint()}
          onUseDemoIncident={useDemoIncident}
          onMissingAnswerChange={(field, value) =>
            setMissingAnswers((current) => ({ ...current, [field]: value }))
          }
          onSaveMissingAnswer={saveMissingAnswer}
          onDraftChange={setDraft}
          onReview={reviewReport}
          onBackToEdit={() => setView("ANALYSIS_RESULT")}
          onSubmit={submitComplaint}
        />
      );
      break;
    }

    case "COMPLAINT_REGISTERED":
      content = (
        <StageLayout progress="RESTORE">
          <p className="service-stage-label">
            {CITIZEN_MESSAGES.journey.existingNcrp.defaultMessage}
          </p>
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {CITIZEN_MESSAGES.journey.complaintRegistered.defaultMessage}
          </h1>
          <p className="journey-identifier">
            {caseData.complaint.acknowledgementId}
          </p>
          <p>{CITIZEN_MESSAGES.journey.complaintResponse.defaultMessage}</p>
          <p>Keep your original evidence and transaction information.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView("POST_REPORT_HANDOFF")}
          >
            Continue
          </button>
        </StageLayout>
      );
      break;

    case "POST_REPORT_HANDOFF":
      content = (
        <StageLayout progress="RESTORE">
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {CITIZEN_MESSAGES.journey.afterReportingTitle.defaultMessage}
          </h1>
          <p>{CITIZEN_MESSAGES.journey.afterReportingResponse.defaultMessage}</p>
          <p>{CITIZEN_MESSAGES.journey.afterReportingRestoration.defaultMessage}</p>
          <p>{CITIZEN_MESSAGES.journey.afterReportingDemo.defaultMessage}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView("MRM_REQUEST")}
          >
            {CITIZEN_MESSAGES.journey.continueRestoration.defaultMessage}
          </button>
        </StageLayout>
      );
      break;

    case "MRM_REQUEST":
      content = (
        <StageLayout progress="RESTORE">
          <p className="service-stage-label">
            {CITIZEN_MESSAGES.journey.existingRestoration.defaultMessage}
          </p>
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {CITIZEN_MESSAGES.journey.restorationTitle.defaultMessage}
          </h1>
          <h2 className="journey-subheading">
            {CITIZEN_MESSAGES.journey.restorationRequestTitle.defaultMessage}
          </h2>
          <dl className="journey-facts">
            <div>
              <dt>{CITIZEN_MESSAGES.journey.ncrpComplaint.defaultMessage}</dt>
              <dd>{caseData.complaint.acknowledgementId}</dd>
            </div>
            <div>
              <dt>{CITIZEN_MESSAGES.journey.heldEntering.defaultMessage}</dt>
              <dd>{formatCurrency(summary.activeAmount)}</dd>
            </div>
            <div>
              <dt>{CITIZEN_MESSAGES.journey.refundAccount.defaultMessage}</dt>
              <dd>{DEMO_REFUND_ACCOUNT}</dd>
            </div>
            <div>
              <dt>{CITIZEN_MESSAGES.journey.documents.defaultMessage}</dt>
              <dd>{CITIZEN_MESSAGES.journey.ready.defaultMessage}</dd>
            </div>
          </dl>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView("MRM_SUBMITTED")}
          >
            {CITIZEN_MESSAGES.journey.submitRestoration.defaultMessage}
          </button>
        </StageLayout>
      );
      break;

    case "MRM_SUBMITTED":
      content = (
        <StageLayout progress="RESTORE">
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {CITIZEN_MESSAGES.journey.restorationSubmitted.defaultMessage}
          </h1>
          <p className="journey-identifier">{DEMO_RESTORATION_REQUEST_ID}</p>
          <p>{CITIZEN_MESSAGES.journey.requestResponse.defaultMessage}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView("POST_MRM_HANDOFF")}
          >
            {CITIZEN_MESSAGES.journey.seeWhatHappens.defaultMessage}
          </button>
        </StageLayout>
      );
      break;

    case "POST_MRM_HANDOFF":
      content = (
        <StageLayout progress="RESOLUTION">
          <p className="service-stage-label">
            {CITIZEN_MESSAGES.journey.proposedView.defaultMessage}
          </p>
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {CITIZEN_MESSAGES.journey.afterRestoration.defaultMessage}
          </h1>
          <p>{CITIZEN_MESSAGES.journey.handoffIntro.defaultMessage}</p>
          <ul className="journey-handoff-questions">
            <li>{CITIZEN_MESSAGES.journey.handoffWhere.defaultMessage}</li>
            <li>{CITIZEN_MESSAGES.journey.handoffWho.defaultMessage}</li>
            <li>{CITIZEN_MESSAGES.journey.handoffAction.defaultMessage}</li>
          </ul>
          <button
            className="primary-button"
            type="button"
            onClick={() => router.push("/case")}
          >
            {CITIZEN_MESSAGES.journey.openResolution.defaultMessage}
          </button>
        </StageLayout>
      );
      break;
  }

  return content;
}
