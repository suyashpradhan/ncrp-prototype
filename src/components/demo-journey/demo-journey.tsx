"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { appName } from "../../config/brand";
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
import {
  IncidentDraftSchema,
  TranscriptionResultSchema,
  type IncidentDraft,
  type TranscriptionResult,
} from "../../incident/schema";
import { normalizeIncidentDraft } from "../../incident/normalization";
import {
  buildNcrpCompatibleComplaint,
  requiredComplaintFieldsReady,
  type NcrpCompatibleComplaint,
} from "../../incident/ncrp-compatible-complaint";
import { CITIZEN_MESSAGES } from "../../content/en";
import {
  createEmptyTestProfile,
  SYNTHETIC_NCRP_PROFILE,
  type ReporterProfile,
} from "../../experience/profile";
import { useI18n } from "../../i18n/i18n-provider";
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
  | "ENTRY"
  | "REPORT_START"
  | "REPORT_INPUT"
  | "ANALYSING"
  | "ANALYSIS_RESULT"
  | "MISSING_INFORMATION"
  | "REVIEW"
  | "COMPLAINT_REGISTERED"
  | "MRM_REQUEST"
  | "MRM_SUBMITTED"
  | "ANALYSIS_ERROR";

type ReportingFor = "SELF" | "HELPING";

function StageLayout({
  progress,
  completeCurrent = false,
  children,
}: {
  progress: JourneyProgressStep;
  completeCurrent?: boolean;
  children: ReactNode;
}) {
  const { locale } = useI18n();
  return (
    <section
      id={progress === "REPORT" ? "report-fraud" : undefined}
      className="journey-stage section-pad"
      data-journey-focus
      tabIndex={-1}
    >
      <div className="shell reading-shell">
        <JourneyProgress current={progress} completeCurrent={completeCurrent} />
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
  const { t } = useI18n();
  return (
    <aside className="landing-helpline" aria-label={t("header.helpline")}>
      <p>{t("entry.urgentQuestion")}</p>
      <a href="tel:1930">
        <strong>☎ 1930</strong>
        <span>{t("entry.urgentAction")}</span>
        <small>{t("header.official")}</small>
      </a>
    </aside>
  );
}

export function DemoJourney() {
  const router = useRouter();
  const { locale, m, t } = useI18n();
  const {
    caseData,
    experienceMode,
    reporterProfile,
    beginExperience,
    setReporterProfile,
    hydrateComplaintCase,
    resetDemo,
  } = useDemoCase();
  const [view, setView] = useState<JourneyView>("ENTRY");
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
    "workspace.readingEvidence",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>(
    {},
  );
  const [isDemoIncident, setIsDemoIncident] = useState(false);
  const [demoNarrationLanguage, setDemoNarrationLanguage] =
    useState<DemoNarrationLanguage>("hi-IN");
  const [testProfile, setTestProfile] = useState<ReporterProfile>(() =>
    createEmptyTestProfile(),
  );
  const [selectedReportedAmount, setSelectedReportedAmount] = useState<
    number | null
  >(null);
  const [isTranscriptionError, setIsTranscriptionError] = useState(false);
  const [identityDocumentProvided, setIdentityDocumentProvided] =
    useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [reduceHeroMotion, setReduceHeroMotion] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const summary = deriveJourneyFinancialSummary(caseData);
  const amountResolution = draft
    ? resolveReportedAmount(draft, selectedReportedAmount)
    : null;

  useEffect(() => {
    if (
      view === "REPORT_INPUT" ||
      view === "COMPLAINT_REGISTERED" ||
      view === "MRM_REQUEST" ||
      view === "MRM_SUBMITTED"
    ) {
      document.querySelector<HTMLElement>("[data-journey-focus]")?.focus();
    }
  }, [view]);

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

  useEffect(() => {
    if (view !== "ENTRY") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceHeroMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    if (media.matches)
      return () => media.removeEventListener("change", updatePreference);

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % 3);
    }, 2700);
    return () => {
      media.removeEventListener("change", updatePreference);
      window.clearInterval(timer);
    };
  }, [view]);

  function useDemoIncident() {
    resetDemo();
    beginExperience("DEMO_CASE", SYNTHETIC_NCRP_PROFILE);
    setReportingFor("SELF");
    setDraft(null);
    setNarrative(DEMO_TYPED_DESCRIPTION);
    setScreenshots([]);
    setAudio(null);
    setDemoNarrationLanguage("hi-IN");
    setTranscription(DEMO_NARRATIONS["hi-IN"]);
    setRecordingSeconds(DEMO_NARRATIONS["hi-IN"].durationSeconds);
    setFormError(null);
    setIsTranscriptionError(false);
    setSelectedReportedAmount(null);
    setMissingAnswers({});
    setIsDemoIncident(true);
    setIdentityDocumentProvided(true);
    setLoadingMessage("workspace.organisingSample");
    setView("ANALYSING");
    window.setTimeout(() => {
      setDraft(structuredClone(DEMO_INCIDENT_DRAFT));
      setView("ANALYSIS_RESULT");
    }, 850);
  }

  function startLiveTest() {
    resetDemo();
    beginExperience("LIVE_TEST", null);
    setReportingFor(null);
    setTestProfile(createEmptyTestProfile());
    setDraft(null);
    setNarrative("");
    setScreenshots([]);
    setAudio(null);
    setTranscription(null);
    setRecordingSeconds(0);
    setIsDemoIncident(false);
    setIdentityDocumentProvided(false);
    setFormError(null);
    setView("REPORT_START");
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
        void buildComplaint(recording, undefined, duration);
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
    setIsTranscriptionError(false);
    setFormError(null);
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

  async function buildComplaint(
    recordingOverride?: Blob,
    screenshotOverride?: File[],
    durationOverride?: number,
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
    setIsTranscriptionError(false);
    setIsDemoIncident(false);
    setLoadingMessage(
      recording && !transcription
        ? "workspace.readingStatement"
        : "workspace.organisingReport",
    );
    setView("ANALYSING");
    try {
      let preparedTranscription = transcription;
      if (recording && !preparedTranscription) {
        preparedTranscription = await transcribeRecording(
          recording,
          durationOverride ?? recordingSeconds,
        );
        setTranscription(preparedTranscription);
      }

      setLoadingMessage("workspace.organisingReport");
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
      const preparedDraft = normalizeIncidentDraft(
        IncidentDraftSchema.parse(result),
      );
      setDraft(preparedDraft);
      setSelectedReportedAmount(null);
      setIsDemoIncident(false);
      setView("ANALYSIS_RESULT");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : null);
      setIsTranscriptionError(Boolean(recording && !transcription));
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
    const activeProfile = reporterProfile ?? testProfile;
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
          identityDocumentProvided,
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
    setView("REVIEW");
  }

  function submitComplaint(complaint: NcrpCompatibleComplaint) {
    if (!draft) return;
    try {
      if (complaint.groups.declaration.accepted.status !== "CONFIRMED") {
        throw new Error("Confirm the synthetic declaration before submitting.");
      }
      const submittedAt = isDemoIncident
        ? "2026-08-22T02:30:00.000Z"
        : new Date().toISOString();
      const activeProfile = reporterProfile ?? testProfile;
      const built = buildSyntheticCaseFromComplaint({
        incidentDraft: draft,
        syntheticCitizen: {
          displayName: activeProfile.displayName || "Synthetic tester",
        },
        acknowledgementId: DEMO_CASE_ACCESS.acknowledgementNumber,
        submittedAt,
        caseOrigin: isDemoIncident ? "DEMO_INCIDENT" : "LIVE_TEST",
        selectedReportedAmount,
      });
      hydrateComplaintCase(built.caseData, built.now);
      setFormError(null);
      setView("COMPLAINT_REGISTERED");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Check the report amount before submitting.",
      );
      setView("ANALYSIS_RESULT");
    }
  }

  let content: ReactNode;

  switch (view) {
    case "ENTRY": {
      const heroWords = [
        "entry.heroReport",
        "entry.heroPrevent",
        "entry.heroUnderstand",
      ] as const;
      const heroPhrasesHi = [
        "entry.heroReportHi",
        "entry.heroPreventHi",
        "entry.heroUnderstandHi",
      ] as const;
      const activeHeroIndex = reduceHeroMotion ? 0 : heroIndex;
      content = (
        <section
          className="service-entry section-pad"
          data-journey-focus
          tabIndex={-1}
        >
          <div className="shell reading-shell service-entry-inner">
            <p className="landing-welcome">
              {locale === "hi"
                ? `${appName(locale)} ${t("entry.welcome")}`
                : `${t("entry.welcome")} ${appName(locale)}`}
            </p>
            <h1 className="landing-headline">
              <span className="sr-only">
                {locale === "hi"
                  ? t(heroPhrasesHi[activeHeroIndex])
                  : `${t("entry.heroPrefix")} ${t(heroWords[activeHeroIndex])} ${t("entry.heroSuffix")}`}
              </span>
              {locale === "hi" ? (
                <span
                  className="hero-rotating-phrase"
                  aria-hidden="true"
                  key={heroPhrasesHi[activeHeroIndex]}
                >
                  {t(heroPhrasesHi[activeHeroIndex])}
                </span>
              ) : (
                <span aria-hidden="true">
                  {t("entry.heroPrefix")}{" "}
                  <span
                    className="hero-rotating-word"
                    key={heroWords[activeHeroIndex]}
                  >
                    {t(heroWords[activeHeroIndex])}
                  </span>
                  <br />
                  {t("entry.heroSuffix")}
                </span>
              )}
            </h1>
            <div className="service-entry-actions">
              <button
                className="primary-button"
                type="button"
                onClick={startLiveTest}
              >
                {t("entry.live")}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={useDemoIncident}
              >
                {t("entry.demo")}
              </button>
            </div>
            <p className="service-disclosure">{t("entry.note")}</p>
            <UrgentMoneyGuidance />
            <section
              className="landing-benefits"
              aria-labelledby="landing-benefits-title"
            >
              <h2 id="landing-benefits-title">{t("entry.benefitsTitle")}</h2>
              <ol className="entry-benefits">
                <li>{t("entry.stepSpeak")}</li>
                <li>{t("entry.stepEvidence")}</li>
                <li>{t("entry.stepReview")}</li>
              </ol>
            </section>
          </div>
        </section>
      );
      break;
    }

    case "REPORT_START":
      content = (
        <StageLayout progress="REPORT">
          <p className="service-stage-label">
            {m(CITIZEN_MESSAGES.journey.existingNcrp)}
          </p>
          <h1>{t("entry.heading")}</h1>
          <fieldset className="reporting-for-fieldset">
            <legend>{t("report.forWhom")}</legend>
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
                <span>{t("report.myself")}</span>
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
                <span>{t("report.someoneElse")}</span>
              </label>
            </div>
          </fieldset>
          {reportingFor === "HELPING" ? (
            <p className="form-hint">{t("report.helpingHint")}</p>
          ) : null}
          <section
            className="test-profile-section"
            aria-labelledby="test-profile-heading"
          >
            <div className="test-profile-heading-row">
              <div>
                <h2 id="test-profile-heading">{t("profile.heading")}</h2>
                <p>{t("profile.support")}</p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setTestProfile(SYNTHETIC_NCRP_PROFILE);
                  setReporterProfile(SYNTHETIC_NCRP_PROFILE);
                }}
              >
                {t("profile.useSynthetic")}
              </button>
            </div>
            <div className="test-profile-fields">
              <label>
                <span>{t("profile.name")}</span>
                <input
                  value={testProfile.displayName}
                  onChange={(event) =>
                    setTestProfile({
                      ...testProfile,
                      displayName: event.target.value,
                      source: "TEST_INPUT",
                    })
                  }
                />
              </label>
              <label>
                <span>{t("profile.state")}</span>
                <input
                  value={testProfile.state}
                  onChange={(event) =>
                    setTestProfile({
                      ...testProfile,
                      state: event.target.value,
                      source: "TEST_INPUT",
                    })
                  }
                />
              </label>
              <label>
                <span>{t("profile.mobile")}</span>
                <input
                  value={testProfile.registeredMobile}
                  onChange={(event) =>
                    setTestProfile({
                      ...testProfile,
                      registeredMobile: event.target.value,
                      source: "TEST_INPUT",
                    })
                  }
                />
              </label>
            </div>
            <p className="profile-source-label">
              {testProfile.source === "SIMULATED_NCRP_PROFILE"
                ? t("profile.fromSimulated")
                : t("profile.fromTest")}
            </p>
            <div className="synthetic-identity-choice">
              <div>
                <h3>{t("field.identityDocument")}</h3>
                <p>
                  {locale === "hi"
                    ? "दिखाए गए एनसीआरपी शिकायत प्रवाह के लिए जरूरी।"
                    : "Required for the represented NCRP complaint flow."}
                </p>
              </div>
              {identityDocumentProvided ? (
                <p className="synthetic-identity-ready">
                  ✓ {t("field.syntheticIdentity")}
                </p>
              ) : (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIdentityDocumentProvided(true)}
                >
                  {locale === "hi"
                    ? "काल्पनिक पहचान दस्तावेज़ उपयोग करें"
                    : "Use synthetic identity document"}
                </button>
              )}
              <p className="form-hint">
                {locale === "hi"
                  ? "यह प्रोटोटाइप असली सरकारी पहचान दस्तावेज़ एकत्र नहीं करता।"
                  : "This prototype does not collect real government identity documents."}
              </p>
            </div>
          </section>
          <UrgentMoneyGuidance />
          <button
            className="primary-button"
            type="button"
            disabled={
              !reportingFor ||
              !testProfile.displayName.trim() ||
              !testProfile.state.trim() ||
              !testProfile.registeredMobile.trim() ||
              !identityDocumentProvided
            }
            onClick={() => {
              setReporterProfile(testProfile);
              setView("REPORT_INPUT");
            }}
          >
            {t("report.continue")}
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
          experienceMode={experienceMode}
          reporterProfile={reporterProfile ?? testProfile}
          identityDocumentProvided={identityDocumentProvided}
          demoNarrationLanguage={demoNarrationLanguage}
          isTranscriptionError={isTranscriptionError}
          draft={draft}
          loadingMessage={loadingMessage}
          formError={formError}
          missingAnswers={missingAnswers}
          amountResolution={amountResolution}
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
          onReportedAmountSelect={setSelectedReportedAmount}
          onDemoNarrationLanguageChange={chooseDemoNarration}
          onReview={reviewReport}
          onBackToEdit={() => setView("ANALYSIS_RESULT")}
          onSubmit={submitComplaint}
        />
      );
      break;
    }

    case "COMPLAINT_REGISTERED":
      content = (
        <StageLayout progress="RESOLUTION" completeCurrent>
          <div className="complaint-success-content">
            <p className="success-mark" aria-hidden="true">
              ✓
            </p>
            <h1 id="journey-stage-heading" tabIndex={-1}>
              {t("complaint.registered")}
            </h1>
            <p className="journey-identifier">
              {caseData.complaint.acknowledgementId}
            </p>
            <p className="complaint-success-body">{t("complaint.response")}</p>
            <div className="entry-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  resetDemo();
                  setView("ENTRY");
                }}
              >
                {t("complaint.startAnother")}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setView("REVIEW")}
              >
                {t("complaint.viewPrepared")}
              </button>
            </div>
          </div>
        </StageLayout>
      );
      break;

    case "MRM_REQUEST":
      content = (
        <StageLayout progress="RESTORE">
          <p className="service-stage-label">{t("mrm.existing")}</p>
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {t("mrm.title")}
          </h1>
          <h2 className="journey-subheading">{t("mrm.request")}</h2>
          <dl className="journey-facts">
            <div>
              <dt>{t("mrm.complaint")}</dt>
              <dd>{caseData.complaint.acknowledgementId}</dd>
            </div>
            <div>
              <dt>{t("mrm.reported")}</dt>
              <dd>{formatCurrency(summary.reportedAmount)}</dd>
            </div>
            <div>
              <dt>{t("mrm.held")}</dt>
              <dd>{formatCurrency(summary.activeAmount)}</dd>
            </div>
            <div>
              <dt>{t("mrm.refund")}</dt>
              <dd>{DEMO_REFUND_ACCOUNT}</dd>
            </div>
            <div>
              <dt>{t("mrm.documents")}</dt>
              <dd>{t("mrm.ready")}</dd>
            </div>
          </dl>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView("MRM_SUBMITTED")}
          >
            {t("mrm.submit")}
          </button>
        </StageLayout>
      );
      break;

    case "MRM_SUBMITTED":
      content = (
        <StageLayout progress="RESTORE">
          <p className="success-mark" aria-hidden="true">
            ✓
          </p>
          <h1 id="journey-stage-heading" tabIndex={-1}>
            {t("mrm.submitted")}
          </h1>
          <p className="journey-identifier">{DEMO_RESTORATION_REQUEST_ID}</p>
          <p>{t("mrm.response")}</p>
          <p>{t("mrm.split")}</p>
          <p>{t("mrm.questions")}</p>
          <ul className="journey-handoff-questions">
            <li>{t("mrm.where")}</li>
            <li>{t("mrm.who")}</li>
            <li>{t("mrm.action")}</li>
          </ul>
          <p className="service-stage-label">{t("mrm.proposed")}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => router.push("/case")}
          >
            {t("mrm.open")}
          </button>
        </StageLayout>
      );
      break;
  }

  return content;
}
