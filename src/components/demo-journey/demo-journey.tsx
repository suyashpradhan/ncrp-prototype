"use client";

import posthog from "posthog-js";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  DEMO_INCIDENT_DRAFT,
  DEMO_NARRATIONS,
  DEMO_TYPED_DESCRIPTION,
  type DemoNarrationLanguage,
} from "../../incident/demo-incident";
import {
  buildSyntheticCaseFromComplaint,
  resolveReportedAmount,
} from "../../incident/complaint-case";
import {
  applyMissingAnswer,
  deriveMissingQuestions,
  type MissingQuestion,
} from "../../incident/missing-information";
import { normalizeIncidentDraft } from "../../incident/normalization";
import {
  buildNcrpCompatibleComplaint,
  requiredComplaintFieldsReady,
  type NcrpCompatibleComplaint,
} from "../../incident/ncrp-compatible-complaint";
import {
  IncidentDraftSchema,
  TranscriptionResultSchema,
  type IncidentDraft,
  type ReportFamily,
  type TranscriptionResult,
} from "../../incident/schema";
import { applyReportFamily } from "../../incident/classification";
import {
  SYNTHETIC_NCRP_PROFILE,
  createEmptyTestProfile,
} from "../../experience/profile";
import { useI18n } from "../../i18n/i18n-provider";
import { useJourneyNavigation } from "../../navigation/journey-navigation";
import { DEMO_CASE_ACCESS, useDemoCase } from "../demo-case/demo-case-provider";
import {
  ReportWorkspace,
  type ReportMethod,
  type ReportWorkspaceMode,
} from "./report-workspace";

type JourneyView =
  | "ENTRY"
  | "REPORT_INPUT"
  | "ANALYSING"
  | "ANALYSIS_RESULT"
  | "REVIEW"
  | "SUCCESS"
  | "ANALYSIS_ERROR";

async function compressScreenshot(file: File): Promise<File> {
  if (file.size <= 1_500_000 || typeof createImageBitmap === "undefined") {
    return file;
  }

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
  const { locale } = useI18n();
  return (
    <a className="landing-helpline" href="tel:1930">
      <span>
        {locale === "hi"
          ? "क्या हाल ही में पैसे गए हैं?"
          : "Lost money recently?"}
      </span>
      <strong>{locale === "hi" ? "अभी 1930 पर कॉल करें" : "Call 1930"}</strong>
    </a>
  );
}

function SachetPreview() {
  const { locale } = useI18n();
  const hi = locale === "hi";

  return (
    <aside
      className="sachet-preview"
      aria-label={
        hi
          ? "साझा जानकारी से तैयार रिपोर्ट का उदाहरण"
          : "Example of shared information becoming a prepared report"
      }
    >
      <p className="sachet-preview-label">
        {hi ? "आप क्या साझा करते हैं" : "What you share"}
      </p>
      <div className="sachet-preview-shared">
        <blockquote>
          {hi
            ? "“आज सुबह मुझे एसबीआई केवाईसी का संदेश मिला। लिंक खोलने के बाद ₹40,000 डेबिट हो गए।”"
            : "“I received an SBI KYC message this morning. After following the link, ₹40,000 was debited.”"}
        </blockquote>
        <div className="sachet-preview-evidence" aria-label={hi ? "जोड़े गए सबूत" : "Evidence added"}>
          <div>
            <span className="sachet-preview-file-icon" aria-hidden="true">▧</span>
            <strong>{hi ? "संदेश का स्क्रीनशॉट" : "Message screenshot"}</strong>
            <small>{hi ? "जोड़ा गया" : "Added"}</small>
          </div>
          <div>
            <span className="sachet-preview-file-icon" aria-hidden="true">▧</span>
            <strong>{hi ? "बैंक लेन-देन" : "Bank transaction"}</strong>
            <small>{hi ? "जोड़ा गया" : "Added"}</small>
          </div>
        </div>
      </div>

      <div className="sachet-preview-connector" aria-hidden="true">
        <span />
        <b>↓</b>
      </div>

      <p className="sachet-preview-label">
        {hi ? "रिपोर्ट तैयार" : "Report prepared"}
      </p>
      <div className="sachet-preview-report">
        <div className="sachet-preview-report-heading">
          <strong>{hi ? "वित्तीय धोखाधड़ी" : "Financial Fraud"}</strong>
          <b>₹40,000</b>
        </div>
        <dl>
          <div>
            <dt>{hi ? "बैंक" : "Bank"}</dt>
            <dd>{hi ? "एसबीआई" : "SBI"}</dd>
          </div>
          <div>
            <dt>{hi ? "समय" : "When"}</dt>
            <dd>{hi ? "22 अगस्त 2026 · लगभग सुबह 7:00 बजे" : "22 Aug 2026 · Around 7:00 AM"}</dd>
          </div>
          <div>
            <dt>{hi ? "लेन-देन संदर्भ" : "Transaction reference"}</dt>
            <dd>DEMO-UTR-40000-220826</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

export function DemoJourney() {
  const { locale, t } = useI18n();
  const { registerControls } = useJourneyNavigation();
  const {
    experienceMode,
    reporterProfile,
    beginExperience,
    hydrateComplaintCase,
    resetDemo,
  } = useDemoCase();
  const [view, setView] = useState<JourneyView>("ENTRY");
  const [reportMethod, setReportMethod] = useState<ReportMethod>("TYPE");
  const [draft, setDraft] = useState<IncidentDraft | null>(null);
  const [narrative, setNarrative] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(
    "workspace.readingEvidence",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>(
    {},
  );
  const [isDemoIncident, setIsDemoIncident] = useState(false);
  const [demoNarrationLanguage, setDemoNarrationLanguage] =
    useState<DemoNarrationLanguage>("hi-IN");
  const [selectedReportedAmount, setSelectedReportedAmount] = useState<
    number | null
  >(null);
  const [isTranscriptionError, setIsTranscriptionError] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string>(
    DEMO_CASE_ACCESS.acknowledgementNumber,
  );
  const viewRef = useRef<JourneyView>("ENTRY");
  const journeyHistoryRef = useRef<JourneyView[]>([]);
  const analysisRunRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const amountResolution =
    draft?.classification.reportFamily === "FINANCIAL_FRAUD"
      ? resolveReportedAmount(draft, selectedReportedAmount)
      : null;
  const baseProfile = reporterProfile ?? SYNTHETIC_NCRP_PROFILE;
  const activeProfile =
    experienceMode === "LIVE_TEST"
      ? {
          ...baseProfile,
          displayName: reporterName.trim(),
          source: "TEST_INPUT" as const,
        }
      : baseProfile;

  useEffect(() => {
    if (view !== "ENTRY") {
      document.querySelector<HTMLElement>("[data-journey-focus]")?.focus();
    }
  }, [view]);

  useEffect(() => {
    posthog.capture("sachet_journey_viewed", {
      journey_view: view,
      experience_mode: experienceMode ?? "NOT_SELECTED",
      locale,
    });
  }, [experienceMode, locale, view]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((current) => {
        const next = current + 1;
        if (next >= 120 && recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
          recorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
          setIsRecording(false);
        }
        return Math.min(next, 120);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  function resetInputs() {
    setDraft(null);
    setNarrative("");
    setReporterName("");
    setScreenshots([]);
    setAudio(null);
    setTranscription(null);
    setRecordingSeconds(0);
    setFormError(null);
    setMissingAnswers({});
    setSelectedReportedAmount(null);
    setIsTranscriptionError(false);
    setIsDemoIncident(false);
    setSubmittedReference(DEMO_CASE_ACCESS.acknowledgementNumber);
    setReportMethod("TYPE");
  }

  function setCurrentView(nextView: JourneyView) {
    viewRef.current = nextView;
    setView(nextView);
  }

  function navigateTo(nextView: JourneyView) {
    const currentView = viewRef.current;
    if (currentView === nextView) return;
    journeyHistoryRef.current.push(currentView);
    setCurrentView(nextView);
  }

  function replaceView(nextView: JourneyView) {
    while (
      journeyHistoryRef.current.at(-1) === nextView
    ) {
      journeyHistoryRef.current.pop();
    }
    setCurrentView(nextView);
  }

  function goBackInJourney() {
    if (viewRef.current === "ANALYSING") {
      analysisRunRef.current += 1;
    }
    const previousView = journeyHistoryRef.current.pop() ?? "ENTRY";
    setCurrentView(previousView);
  }

  function returnToReportDetails() {
    const reportIndex = journeyHistoryRef.current.lastIndexOf(
      "ANALYSIS_RESULT",
    );
    if (reportIndex >= 0) {
      journeyHistoryRef.current = journeyHistoryRef.current.slice(
        0,
        reportIndex,
      );
    }
    setCurrentView("ANALYSIS_RESULT");
  }

  function returnHome() {
    analysisRunRef.current += 1;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    resetDemo();
    resetInputs();
    journeyHistoryRef.current = [];
    setCurrentView("ENTRY");
  }

  useEffect(() => {
    if (view === "ENTRY") return;
    return registerControls({
      onBack: goBackInJourney,
      onHome: returnHome,
    });
  }, [registerControls, view]);

  function startReport() {
    resetDemo();
    resetInputs();
    beginExperience("LIVE_TEST", createEmptyTestProfile());
    journeyHistoryRef.current = ["ENTRY"];
    setCurrentView("REPORT_INPUT");
  }

  function useDemoIncident() {
    resetDemo();
    resetInputs();
    beginExperience("DEMO_CASE", SYNTHETIC_NCRP_PROFILE);
    setNarrative(DEMO_TYPED_DESCRIPTION);
    setDemoNarrationLanguage("hi-IN");
    setTranscription(DEMO_NARRATIONS["hi-IN"]);
    setRecordingSeconds(DEMO_NARRATIONS["hi-IN"].durationSeconds);
    setIsDemoIncident(true);
    setDraft(structuredClone(DEMO_INCIDENT_DRAFT));
    journeyHistoryRef.current = ["ENTRY"];
    setCurrentView("ANALYSIS_RESULT");
  }

  function chooseDemoNarration(language: DemoNarrationLanguage) {
    setDemoNarrationLanguage(language);
    setTranscription(DEMO_NARRATIONS[language]);
    setRecordingSeconds(DEMO_NARRATIONS[language].durationSeconds);
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
        const startedAt = recordingStartedAtRef.current ?? Date.now();
        const duration = Math.min(
          120,
          Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        );
        recordingStartedAtRef.current = null;
        setRecordingSeconds(duration);
        setAudio(recording);
      };
      recorderRef.current = recorder;
      setAudio(null);
      setTranscription(null);
      setRecordingSeconds(0);
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
      recorder.start();
    } catch {
      setFormError(
        locale === "hi"
          ? "माइक्रोफ़ोन उपलब्ध नहीं है। आप घटना लिख सकते हैं या सबूत जोड़ सकते हैं।"
          : "Microphone access is unavailable. You can type what happened or add evidence instead.",
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
    setIsTranscriptionError(false);
    setFormError(null);
  }

  async function handleScreenshots(event: ChangeEvent<HTMLInputElement>) {
    setFormError(null);
    const selected = Array.from(event.target.files ?? []);
    if (selected.length + screenshots.length > 2) {
      setFormError(
        locale === "hi"
          ? "अधिकतम दो स्क्रीनशॉट जोड़ें।"
          : "Add no more than two screenshots.",
      );
      event.target.value = "";
      return;
    }
    if (
      selected.some(
        (file) =>
          !["image/png", "image/jpeg", "image/webp"].includes(file.type),
      )
    ) {
      setFormError(
        locale === "hi"
          ? "PNG, JPEG या WebP चित्र जोड़ें।"
          : "Screenshots must be PNG, JPEG or WebP images.",
      );
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > 8 * 1024 * 1024)) {
      setFormError(
        locale === "hi"
          ? "हर चित्र 8 MB से छोटा होना चाहिए।"
          : "Each screenshot must be under 8 MB before compression.",
      );
      event.target.value = "";
      return;
    }
    const prepared = await Promise.all(selected.map(compressScreenshot));
    setScreenshots((current) => [...current, ...prepared]);
    event.target.value = "";
  }

  async function transcribeRecording(
    recording: Blob | null,
    durationSeconds: number,
  ): Promise<TranscriptionResult> {
    if (!recording) throw new Error("No recording is available.");
    const data = new FormData();
    data.append("audio", recording, "statement.webm");
    data.append("durationSeconds", String(durationSeconds));

    if (durationSeconds > 30) {
      setLoadingMessage("workspace.transcribingLong");
      const startResponse = await fetch("/api/transcribe-long/start", {
        method: "POST",
        body: data,
      });
      const startResult: unknown = await startResponse.json().catch(() => null);
      if (
        !startResponse.ok ||
        !startResult ||
        typeof startResult !== "object" ||
        !("jobId" in startResult)
      ) {
        throw new Error("We couldn't transcribe this recording.");
      }

      const jobId = String(startResult.jobId);
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5_000));
        const statusResponse = await fetch(
          `/api/transcribe-long/status?jobId=${encodeURIComponent(jobId)}`,
          { cache: "no-store" },
        );
        const statusResult: unknown = await statusResponse
          .json()
          .catch(() => null);
        if (
          !statusResponse.ok ||
          !statusResult ||
          typeof statusResult !== "object"
        ) {
          throw new Error("We couldn't transcribe this recording.");
        }
        const status =
          "status" in statusResult ? String(statusResult.status) : "FAILED";
        if (status === "FAILED")
          throw new Error("We couldn't transcribe this recording.");
        if (status === "COMPLETED") {
          const resultResponse = await fetch("/api/transcribe-long/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
          });
          const result: unknown = await resultResponse.json().catch(() => null);
          if (!resultResponse.ok)
            throw new Error("We couldn't transcribe this recording.");
          return TranscriptionResultSchema.parse(result);
        }
      }
      throw new Error("We couldn't transcribe this recording.");
    }

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

  async function buildComplaint() {
    if (experienceMode === "LIVE_TEST" && !reporterName.trim()) {
      setFormError(
        locale === "hi"
          ? "आगे बढ़ने से पहले अपना टेस्ट नाम लिखें।"
          : "Enter your test name before continuing.",
      );
      document.querySelector<HTMLInputElement>("#reporter-name")?.focus();
      return;
    }
    if (
      !narrative.trim() &&
      screenshots.length === 0 &&
      !transcription &&
      !audio
    ) {
      setFormError(
        locale === "hi"
          ? "आगे बढ़ने से पहले बोलें, लिखें या सबूत जोड़ें।"
          : "Speak, type what happened or add evidence before continuing.",
      );
      return;
    }

    setFormError(null);
    setIsTranscriptionError(false);
    setLoadingMessage(
      audio && !transcription
        ? "workspace.readingStatement"
        : "workspace.organisingReport",
    );
    const analysisRun = analysisRunRef.current + 1;
    analysisRunRef.current = analysisRun;
    if (viewRef.current === "ANALYSIS_ERROR") {
      replaceView("ANALYSING");
    } else {
      navigateTo("ANALYSING");
    }
    try {
      let preparedTranscription = transcription;
      if (audio && !preparedTranscription) {
        preparedTranscription = await transcribeRecording(
          audio,
          recordingSeconds,
        );
        if (analysisRunRef.current !== analysisRun) return;
        setTranscription(preparedTranscription);
      }

      setLoadingMessage("workspace.organisingReport");
      const data = new FormData();
      data.append("narrative", narrative);
      data.append(
        "englishTranscript",
        preparedTranscription?.englishTranscript ?? "",
      );
      data.append("reportingFor", "SELF");
      screenshots.forEach((file) =>
        data.append("screenshots", file, file.name),
      );
      const response = await fetch("/api/analyze-incident", {
        method: "POST",
        body: data,
      });
      const result: unknown = await response.json().catch(() => null);
      if (analysisRunRef.current !== analysisRun) return;
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
            "We couldn’t prepare the report. Everything you shared is still here.",
        );
      }
      setDraft(normalizeIncidentDraft(IncidentDraftSchema.parse(result)));
      setSelectedReportedAmount(null);
      replaceView("ANALYSIS_RESULT");
    } catch (error) {
      if (analysisRunRef.current !== analysisRun) return;
      setFormError(error instanceof Error ? error.message : null);
      setIsTranscriptionError(Boolean(audio && !transcription));
      replaceView("ANALYSIS_ERROR");
    }
  }

  function saveMissingAnswer(question: MissingQuestion, fallback?: string) {
    if (!draft) return;
    const answer = fallback ?? missingAnswers[question.field] ?? "";
    if (!answer.trim()) {
      setFormError(
        locale === "hi"
          ? "जानकारी लिखें या बताएं कि यह आपके पास नहीं है।"
          : "Enter the detail, or choose that you do not have it.",
      );
      return;
    }
    setDraft(applyMissingAnswer(draft, question.field, answer));
    setMissingAnswers({});
    setFormError(null);
  }

  function reviewReport() {
    const complaint = draft
      ? buildNcrpCompatibleComplaint({
          draft,
          profile: activeProfile,
          transcription,
          typedNarrative: narrative,
          isDemoIncident,
          screenshotNames: isDemoIncident
            ? [
                "Synthetic KYC message screenshot",
                "Synthetic bank transaction screenshot",
              ]
            : screenshots.map((file) => file.name),
          identityDocumentProvided: true,
        })
      : null;
    if (
      !draft ||
      deriveMissingQuestions(draft).length > 0 ||
      (amountResolution?.hasConflict && !amountResolution.selectedAmount) ||
      !complaint ||
      !requiredComplaintFieldsReady(complaint)
    )
      return;
    setFormError(null);
    navigateTo("REVIEW");
  }

  function changeReportFamily(
    reportFamily: Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const classification = applyReportFamily(
        reportFamily,
        current.classification,
      );
      return normalizeIncidentDraft({
        ...current,
        classification,
      });
    });
    setSelectedReportedAmount(null);
    setFormError(null);
  }

  function submitComplaint(complaint: NcrpCompatibleComplaint) {
    if (!draft) return;
    try {
      if (complaint.groups.declaration.accepted.status !== "CONFIRMED") {
        throw new Error("Confirm the synthetic declaration before submitting.");
      }
      if (draft.classification.reportFamily !== "FINANCIAL_FRAUD") {
        setSubmittedReference(`NCRP-DEMO-${Date.now().toString().slice(-8)}`);
        setFormError(null);
        navigateTo("SUCCESS");
        return;
      }
      const submittedAt = isDemoIncident
        ? "2026-08-22T02:30:00.000Z"
        : new Date().toISOString();
      const built = buildSyntheticCaseFromComplaint({
        incidentDraft: draft,
        syntheticCitizen: { displayName: activeProfile.displayName },
        acknowledgementId: DEMO_CASE_ACCESS.acknowledgementNumber,
        submittedAt,
        caseOrigin: isDemoIncident ? "DEMO_INCIDENT" : "LIVE_TEST",
        selectedReportedAmount,
      });
      hydrateComplaintCase(built.caseData, built.now);
      setSubmittedReference(built.caseData.complaint.acknowledgementId);
      setFormError(null);
      navigateTo("SUCCESS");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Check the report before submitting.",
      );
      replaceView("ANALYSIS_RESULT");
    }
  }

  let content: ReactNode;

  if (view === "ENTRY") {
    content = (
      <section className="service-entry section-pad">
        <div className="shell service-entry-inner">
          <div className="service-entry-layout">
            <div className="service-entry-copy">
              <h1>
                {locale === "hi"
                  ? "वित्तीय साइबर धोखाधड़ी की रिपोर्ट करें—हर जानकारी खुद भरे बिना।"
                  : "Report cyber fraud, without filling everything yourself."}
              </h1>
              <p className="service-entry-support">
                {locale === "hi"
                  ? "हमें बताएं कि क्या हुआ। हम आपकी जाँच के लिए रिपोर्ट तैयार करेंगे।"
                  : "Tell us what happened. We’ll prepare the report for you to review."}
              </p>
              <div className="service-entry-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={startReport}
                >
                  {locale === "hi" ? "रिपोर्ट शुरू करें" : "Start a report"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={useDemoIncident}
                >
                  {locale === "hi" ? "डेमो देखें" : "Try demo"}
                </button>
              </div>
              <UrgentMoneyGuidance />
              <p className="landing-capability-line">
                {locale === "hi"
                  ? "हमें बताएं कि क्या हुआ → हम रिपोर्ट तैयार करते हैं → आप जाँचते हैं"
                  : "Tell us what happened → We prepare the report → You review"}
              </p>
            </div>
            <SachetPreview />
          </div>
        </div>
      </section>
    );
  } else if (
    view === "REPORT_INPUT" ||
    view === "ANALYSING" ||
    view === "ANALYSIS_ERROR" ||
    view === "ANALYSIS_RESULT" ||
    view === "REVIEW"
  ) {
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
        reporterName={reporterName}
        screenshots={screenshots}
        transcription={transcription}
        hasAudio={Boolean(audio)}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        isDemoIncident={isDemoIncident}
        experienceMode={experienceMode}
        reporterProfile={activeProfile}
        identityDocumentProvided
        demoNarrationLanguage={demoNarrationLanguage}
        isTranscriptionError={isTranscriptionError}
        draft={draft}
        loadingMessage={loadingMessage}
        formError={formError}
        missingAnswers={missingAnswers}
        amountResolution={amountResolution}
        reportReference={submittedReference}
        onReportMethodChange={setReportMethod}
        onNarrativeChange={setNarrative}
        onReporterNameChange={setReporterName}
        onStartRecording={() => void startRecording()}
        onStopRecording={stopRecording}
        onRecordAgain={recordAgain}
        onScreenshotsChange={(event) => void handleScreenshots(event)}
        onRemoveScreenshot={(index) =>
          setScreenshots((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
          )
        }
        onOrganizeReport={() => void buildComplaint()}
        onUseDemoIncident={useDemoIncident}
        onMissingAnswerChange={(field, value) =>
          setMissingAnswers((current) => ({ ...current, [field]: value }))
        }
        onSaveMissingAnswer={saveMissingAnswer}
        onDraftChange={setDraft}
        onReportedAmountSelect={setSelectedReportedAmount}
        onReportFamilyChange={changeReportFamily}
        onDemoNarrationLanguageChange={chooseDemoNarration}
        onReview={reviewReport}
        onBackToEdit={returnToReportDetails}
        onSubmit={submitComplaint}
      />
    );
  } else {
    content = (
      <section
        className="journey-stage section-pad"
        data-journey-focus
        tabIndex={-1}
      >
        <div className="shell reading-shell complaint-success-content">
          <span className="success-mark" aria-hidden="true">
            ✓
          </span>
          <h1>
            {locale === "hi"
              ? "रिपोर्ट सफलतापूर्वक तैयार हुई"
              : "Report prepared successfully"}
          </h1>
          <p className="journey-identifier">{submittedReference}</p>
          <p>
            {locale === "hi"
              ? "यह डेमो शिकायत किसी सरकारी सेवा को नहीं भेजी गई।"
              : "This demo complaint was not sent to a government service."}
          </p>
          <div className="entry-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigateTo("REVIEW")}
            >
              {locale === "hi" ? "रिपोर्ट देखें" : "View report"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={returnHome}
            >
              {locale === "hi" ? "फिर से शुरू करें" : "Start again"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return content;
}
