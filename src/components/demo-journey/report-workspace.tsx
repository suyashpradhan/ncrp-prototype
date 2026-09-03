"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  deriveMissingQuestions,
  type MissingQuestion,
} from "../../incident/missing-information";
import { containsSensitiveDetail } from "../../incident/sensitive-text";
import type {
  IncidentDraft,
  ReportFamily,
  TranscriptionResult,
} from "../../incident/schema";
import {
  DEMO_NARRATIONS,
  type DemoNarrationLanguage,
} from "../../incident/demo-incident";
import type { ReportedAmountResolution } from "../../incident/complaint-case";
import {
  NCRP_FIELD_DEFINITIONS,
  buildNcrpCompatibleComplaint,
  complaintFieldApplies,
  complaintFieldIsRequired,
  complaintRequiredFieldStatus,
  type NcrpCompatibleComplaint,
} from "../../incident/ncrp-compatible-complaint";
import type { ExperienceMode, ReporterProfile } from "../../experience/profile";
import { useI18n } from "../../i18n/i18n-provider";
import {
  CITIZEN_DOES_NOT_HAVE,
  deriveReportGroups,
  type ReportFieldView,
  type ReportGroupView,
} from "../../presentation/report-details";
import { formatCurrency } from "../../presentation/format";
import { deriveEvidenceContributions } from "../../presentation/evidence-contributions";
import { deriveIncidentTimeline } from "../../presentation/incident-timeline";
import {
  deriveReportReadiness,
  type ReportReadiness,
} from "../../presentation/report-readiness";
import { ComplaintPacket } from "./complaint-packet";
import { ImmediateHandoff } from "./immediate-handoff";
import { IncidentTimeline } from "./incident-timeline";
import { JourneyProgress } from "./journey-progress";

export type ReportWorkspaceMode =
  | "INPUT"
  | "PROCESSING"
  | "READY"
  | "ERROR"
  | "REVIEW";
export type ReportMethod = "SPEAK" | "UPLOAD" | "TYPE";

const DEMO_EVIDENCE = [
  {
    id: "demo-message",
    src: "/demo/evidence/kyc-message-demo.png",
    altKey: "workspace.demoMessage",
    labelKey: "workspace.demoMessage",
    typeKey: "workspace.evidenceMessageType",
  },
  {
    id: "demo-transaction",
    src: "/demo/evidence/bank-transaction-demo.png",
    altKey: "workspace.demoBank",
    labelKey: "workspace.demoBank",
    typeKey: "workspace.evidenceTransactionType",
  },
] as const;

const SOURCE_VISIBLE_FIELD_IDS = new Set([
  "category",
  "transaction-0-utr",
  "reporter-name",
]);

type ReportWorkspaceProps = {
  mode: ReportWorkspaceMode;
  reportMethod: ReportMethod;
  narrative: string;
  reporterName: string;
  screenshots: File[];
  transcription: TranscriptionResult | null;
  hasAudio: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  isDemoIncident: boolean;
  experienceMode: ExperienceMode | null;
  reporterProfile: ReporterProfile;
  identityDocumentProvided: boolean;
  isReportStale: boolean;
  demoNarrationLanguage: DemoNarrationLanguage;
  isTranscriptionError: boolean;
  draft: IncidentDraft | null;
  loadingMessage: string;
  formError: string | null;
  missingAnswers: Record<string, string>;
  amountResolution: ReportedAmountResolution | null;
  reportReference: string;
  onReportMethodChange: (method: ReportMethod) => void;
  onNarrativeChange: (value: string) => void;
  onReporterNameChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRecordAgain: () => void;
  onScreenshotsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: (index: number) => void;
  onOrganizeReport: () => void;
  onUseDemoIncident: () => void;
  onMissingAnswerChange: (
    field: MissingQuestion["field"],
    value: string,
  ) => void;
  onSaveMissingAnswer: (question: MissingQuestion, fallback?: string) => void;
  onDraftChange: (draft: IncidentDraft) => void;
  onReportedAmountSelect: (amount: number) => void;
  onReportFamilyChange: (
    reportFamily: Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">,
  ) => void;
  onDemoNarrationLanguageChange: (language: DemoNarrationLanguage) => void;
  onReview: () => void;
  onBackToEdit: () => void;
  onSubmit: (complaint: NcrpCompatibleComplaint) => void;
};

function languageLabel(languageCode: string): string {
  const labels: Record<string, string> = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "kn-IN": "Kannada",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
  };
  return labels[languageCode] ?? "Original language";
}

function EvidenceRows({
  screenshots,
  isDemoIncident,
  onRemoveScreenshot,
  compact = false,
}: {
  screenshots: File[];
  isDemoIncident: boolean;
  onRemoveScreenshot: (index: number) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [activeDemoEvidence, setActiveDemoEvidence] = useState<
    (typeof DEMO_EVIDENCE)[number] | null
  >(null);
  const [activeUploadedEvidence, setActiveUploadedEvidence] =
    useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (
      (activeDemoEvidence || activeUploadedEvidence) &&
      dialog &&
      !dialog.open
    ) {
      dialog.showModal();
    }
  }, [activeDemoEvidence, activeUploadedEvidence]);

  useEffect(() => {
    if (!activeUploadedEvidence) {
      setUploadedPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(activeUploadedEvidence);
    setUploadedPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [activeUploadedEvidence]);

  function closeEvidence() {
    dialogRef.current?.close();
    setActiveDemoEvidence(null);
    setActiveUploadedEvidence(null);
  }

  if (!isDemoIncident && screenshots.length === 0) return null;

  const evidenceCount = isDemoIncident
    ? DEMO_EVIDENCE.length
    : screenshots.length;
  const rows = (
    <ul className="report-source-files">
      {isDemoIncident
        ? DEMO_EVIDENCE.map((item) => (
            <li className="report-source-file-preview" key={item.src}>
              <button
                className="evidence-preview-trigger"
                type="button"
                data-evidence-id={item.id}
                aria-haspopup="dialog"
                aria-label={`${t("workspace.openEvidence")}: ${t(item.labelKey)}`}
                onClick={() => setActiveDemoEvidence(item)}
              >
                <Image
                  src={item.src}
                  alt=""
                  width={72}
                  height={54}
                  sizes="72px"
                />
                <span className="evidence-row-copy">
                  <strong>{t(item.labelKey)}</strong>
                  <small>{t(item.typeKey)}</small>
                </span>
                <span className="evidence-row-action">
                  {t("workspace.view")}
                </span>
              </button>
            </li>
          ))
        : screenshots.map((file, index) => (
            <li
              className="report-source-file-preview uploaded-evidence-row"
              key={`${file.name}-${file.lastModified}`}
            >
              <button
                className="evidence-preview-trigger"
                type="button"
                data-evidence-id={`uploaded-${index}`}
                aria-haspopup="dialog"
                aria-label={`${t("workspace.openEvidence")}: ${file.name}`}
                onClick={() => setActiveUploadedEvidence(file)}
              >
                <span className="evidence-file-icon" aria-hidden="true">
                  ▧
                </span>
                <span className="evidence-row-copy">
                  <strong>{file.name}</strong>
                  <small>{file.type.replace("image/", "").toUpperCase()}</small>
                </span>
                <span className="evidence-row-action">
                  {t("workspace.view")}
                </span>
              </button>
              {!compact ? (
                <button
                  className="text-button evidence-remove-button"
                  type="button"
                  onClick={() => onRemoveScreenshot(index)}
                >
                  {t("field.remove")}
                </button>
              ) : null}
            </li>
          ))}
    </ul>
  );

  const preview =
    activeDemoEvidence || activeUploadedEvidence ? (
      <dialog
        ref={dialogRef}
        className="evidence-preview-dialog"
        aria-label={
          activeDemoEvidence
            ? t(activeDemoEvidence.labelKey)
            : activeUploadedEvidence?.name
        }
        onCancel={(event) => {
          event.preventDefault();
          closeEvidence();
        }}
        onClick={(event) => {
          if (event.currentTarget === event.target) closeEvidence();
        }}
      >
        <div className="evidence-preview-dialog-header">
          <div>
            <small>
              {activeDemoEvidence
                ? t("workspace.syntheticEvidence")
                : t("workspace.evidence")}
            </small>
            <strong>
              {activeDemoEvidence
                ? t(activeDemoEvidence.labelKey)
                : activeUploadedEvidence?.name}
            </strong>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={closeEvidence}
            autoFocus
          >
            {t("workspace.closeEvidence")}
          </button>
        </div>
        {activeDemoEvidence ? (
          <Image
            className="ph-no-capture"
            src={activeDemoEvidence.src}
            alt={t(activeDemoEvidence.altKey)}
            width={520}
            height={620}
            sizes="(max-width: 600px) calc(100vw - 40px), 520px"
          />
        ) : uploadedPreviewUrl && activeUploadedEvidence ? (
          // Blob URLs are local browser resources and cannot use next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="uploaded-evidence-preview ph-no-capture"
            src={uploadedPreviewUrl}
            alt={activeUploadedEvidence.name}
          />
        ) : null}
      </dialog>
    ) : null;

  if (compact) {
    return (
      <details className="report-source-block compact-source-disclosure">
        <summary>
          <span>{t("workspace.evidence")}</span>
          <strong>
            {evidenceCount} {t("workspace.screenshots")}
          </strong>
        </summary>
        {rows}
        {preview}
      </details>
    );
  }

  return (
    <div className="report-source-block">
      <h3>{t("workspace.evidenceAdded")}</h3>
      {rows}
      {preview}
    </div>
  );
}

function EvidenceContributions({
  draft,
  screenshots,
  isDemoIncident,
}: {
  draft: IncidentDraft;
  screenshots: File[];
  isDemoIncident: boolean;
}) {
  const { locale } = useI18n();
  const items = deriveEvidenceContributions(draft, {
    locale,
    isDemoIncident,
    screenshotNames: screenshots.map((file) => file.name),
  });
  if (items.length === 0) return null;

  return (
    <section
      className="evidence-contributions"
      aria-labelledby="evidence-contributions-heading"
    >
      <div className="evidence-contributions-heading">
        <p className="report-field-label">
          {locale === "hi" ? "सबूत का उपयोग" : "Evidence used"}
        </p>
        <h3 id="evidence-contributions-heading">
          {locale === "hi"
            ? "आपके सबूत से रिपोर्ट में क्या जोड़ा गया"
            : "What we used from your evidence"}
        </h3>
      </div>
      <div className="evidence-contribution-list">
        {items.map((item) => (
          <article className="evidence-contribution" key={item.evidenceId}>
            <div className="evidence-contribution-title">
              <div>
                <strong>{item.evidenceLabel}</strong>
                <span>{item.evidenceType}</span>
              </div>
              <small>
                {item.contributions.length > 0
                  ? locale === "hi"
                    ? `${item.contributions.length} जानकारियाँ उपयोग हुईं`
                    : `${item.contributions.length} ${item.contributions.length === 1 ? "detail" : "details"} used`
                  : locale === "hi"
                    ? "रिपोर्ट के साथ जोड़ा गया"
                    : "Attached to the report"}
              </small>
            </div>

            {item.contributions.length > 0 ? (
              <dl>
                {item.contributions.map((fact) => (
                  <div key={`${item.evidenceId}-${fact.fieldKey}`}>
                    <dt>
                      <span className="ready-mark" aria-hidden="true">
                        ✓
                      </span>{" "}
                      {fact.label}
                    </dt>
                    <dd>{fact.displayValue}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>
                {locale === "hi"
                  ? "हमने इस सबूत को आपकी रिपोर्ट के साथ जोड़ दिया है।"
                  : "We’ve attached this evidence to your report."}
              </p>
            )}

            <button
              className="text-button"
              type="button"
              aria-haspopup="dialog"
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>(
                    `[data-evidence-id="${item.evidenceId}"]`,
                  )
                  ?.click()
              }
            >
              {locale === "hi" ? "सबूत देखें" : "View evidence"} →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceSummary({
  narrative,
  transcription,
  screenshots,
  isDemoIncident,
  recordingSeconds,
  demoNarrationLanguage,
  onDemoNarrationLanguageChange,
  onRemoveScreenshot,
  compact = false,
}: Pick<
  ReportWorkspaceProps,
  | "narrative"
  | "transcription"
  | "screenshots"
  | "isDemoIncident"
  | "recordingSeconds"
  | "demoNarrationLanguage"
  | "onDemoNarrationLanguageChange"
  | "onRemoveScreenshot"
> & { compact?: boolean }) {
  const { locale, t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const showWrittenStatement =
    narrative.trim() && (isDemoIncident || !transcription);
  const displayedNarrative = isDemoIncident
    ? locale === "hi"
      ? "मुझे एसबीआई केवाईसी अपडेट करने का संदेश मिला। मैंने निर्देश माने और बाद में मेरे खाते से ₹40,000 ट्रांसफर हो गए।"
      : narrative
    : narrative;
  const demoNarration = DEMO_NARRATIONS[demoNarrationLanguage];

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackSeconds(0);
    audioRef.current?.load();
  }, [demoNarrationLanguage]);

  const formatPlayback = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  return (
    <div
      className="report-sources"
      aria-label={t("workspace.informationShared")}
    >
      {isDemoIncident ? (
        <div className="report-source-block demo-narration-block">
          <div className="demo-narration-heading">
            <div>
              <h3>{t("workspace.sampleNarration")}</h3>
              <p className="source-meta">
                {demoNarration.nativeLabel} ·{" "}
                {t("workspace.approxSeconds", {
                  seconds: demoNarration.durationSeconds,
                })}
              </p>
            </div>
            <button
              className="secondary-button compact-audio-button"
              type="button"
              onClick={() => {
                const player = audioRef.current;
                if (!player) return;
                if (player.paused) void player.play();
                else player.pause();
              }}
            >
              {isPlaying
                ? t("workspace.pauseSample")
                : t("workspace.playSample")}
              <span className="audio-progress" aria-hidden="true">
                {formatPlayback(playbackSeconds)} /{" "}
                {formatPlayback(demoNarration.durationSeconds)}
              </span>
            </button>
          </div>
          <audio
            ref={audioRef}
            src={demoNarration.audioPath}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={(event) =>
              setPlaybackSeconds(event.currentTarget.currentTime)
            }
          />
          <p className="demo-language-label">{t("workspace.sampleLanguage")}</p>
          <div
            className="demo-narration-languages"
            role="group"
            aria-label={t("workspace.changeLanguage")}
          >
            {(Object.keys(DEMO_NARRATIONS) as DemoNarrationLanguage[]).map(
              (language) => (
                <button
                  key={language}
                  type="button"
                  aria-pressed={demoNarrationLanguage === language}
                  onClick={() => onDemoNarrationLanguageChange(language)}
                >
                  {DEMO_NARRATIONS[language].nativeLabel}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}
      {transcription ? (
        compact ? (
          <details className="report-source-block compact-source-disclosure transcript-result">
            <summary>
              <span>
                {isDemoIncident
                  ? t("workspace.transcript")
                  : `${languageLabel(transcription.languageCode)} ${locale === "hi" ? "बयान" : "voice statement"}`}
              </span>
              <strong>
                {t("workspace.approxSeconds", {
                  seconds: recordingSeconds || 1,
                })}
              </strong>
            </summary>
            <p className="source-transcript">
              {transcription.originalTranscript}
            </p>
            {transcription.englishTranscript !==
            transcription.originalTranscript ? (
              <details className="translation-disclosure">
                <summary>{t("workspace.viewEnglish")}</summary>
                <p>{transcription.englishTranscript}</p>
              </details>
            ) : null}
          </details>
        ) : (
          <div className="report-source-block transcript-result">
            <h3>
              {isDemoIncident
                ? t("workspace.transcript")
                : t("workspace.yourStatement")}
            </h3>
            <p className="source-transcript">
              {transcription.originalTranscript}
            </p>
            <p className="source-meta">
              {isDemoIncident
                ? `${DEMO_NARRATIONS[demoNarrationLanguage].nativeLabel} · ${t("workspace.approxSeconds", { seconds: recordingSeconds || 1 })}`
                : `${languageLabel(transcription.languageCode)} · ${recordingSeconds || 1} ${locale === "hi" ? "सेकंड" : "seconds"}`}
            </p>
            {transcription.englishTranscript !==
            transcription.originalTranscript ? (
              <details className="translation-disclosure">
                <summary>{t("workspace.viewEnglish")}</summary>
                <p>{transcription.englishTranscript}</p>
              </details>
            ) : null}
          </div>
        )
      ) : null}

      {showWrittenStatement ? (
        compact ? (
          <details className="report-source-block compact-source-disclosure">
            <summary>
              <span>
                {isDemoIncident
                  ? t("workspace.typedDescription")
                  : t("workspace.yourStatement")}
              </span>
              <strong>{t("workspace.viewStatement")}</strong>
            </summary>
            <p className="source-transcript">{displayedNarrative}</p>
          </details>
        ) : isDemoIncident ? (
          <details className="report-source-block compact-source-disclosure typed-description-disclosure">
            <summary>
              <span>{t("workspace.typedDescription")}</span>
              <strong>{t("workspace.viewStatement")} ↓</strong>
            </summary>
            <p className="source-transcript">{displayedNarrative}</p>
          </details>
        ) : (
          <div className="report-source-block">
            <h3>
              {isDemoIncident
                ? t("workspace.typedDescription")
                : t("workspace.yourStatement")}
            </h3>
            <p className="source-transcript">{displayedNarrative}</p>
          </div>
        )
      ) : null}

      <EvidenceRows
        screenshots={screenshots}
        isDemoIncident={isDemoIncident}
        onRemoveScreenshot={onRemoveScreenshot}
        compact={compact}
      />
    </div>
  );
}

function ReportInputPane(props: ReportWorkspaceProps) {
  const { t } = useI18n();
  const processing = props.mode === "PROCESSING";

  return (
    <section
      className="report-input-pane"
      aria-labelledby="journey-stage-heading"
    >
      <h1 id="journey-stage-heading" tabIndex={-1}>
        {props.mode === "REVIEW" || props.mode === "READY"
          ? t("workspace.yourInformation")
          : t("workspace.tell")}
      </h1>
      <p className="pane-intro">
        {props.mode === "REVIEW" || props.mode === "READY"
          ? t("workspace.reviewIntro")
          : t("workspace.intro")}
      </p>

      {props.mode !== "REVIEW" && props.experienceMode !== "DEMO_CASE" ? (
        <div className="incident-composer">
          <div className="reporter-name-field">
            <label htmlFor="reporter-name">
              {t("workspace.reporterNameQuestion")}
            </label>
            <input
              id="reporter-name"
              data-report-field-id="reporter-name"
              type="text"
              autoComplete="name"
              value={props.reporterName}
              disabled={processing}
              onChange={(event) =>
                props.onReporterNameChange(event.target.value)
              }
              placeholder={t("workspace.reporterNamePlaceholder")}
              maxLength={120}
            />
            <small>{t("workspace.reporterNameHelp")}</small>
          </div>
          <label className="visually-hidden" htmlFor="incident-narrative">
            {t("workspace.whatHappened")}
          </label>
            <textarea
              id="incident-narrative"
              data-report-field-id="incident-narrative"
            rows={8}
            value={props.narrative}
            disabled={processing}
            onChange={(event) => props.onNarrativeChange(event.target.value)}
            placeholder={t("workspace.placeholder")}
            maxLength={8000}
          />
          <div className="composer-actions">
            <button
              className={
                props.isRecording
                  ? "recording-button recording-button-active"
                  : "recording-button"
              }
              type="button"
              disabled={processing}
              onClick={
                props.isRecording
                  ? props.onStopRecording
                  : props.hasAudio
                    ? props.onRecordAgain
                    : props.onStartRecording
              }
            >
              <span aria-hidden="true">●</span>
              {props.isRecording
                ? t("workspace.stopRecording")
                : props.hasAudio
                  ? t("workspace.recordAgain")
                  : t("workspace.speak")}
            </button>
            <label
              className="evidence-add-button"
              htmlFor="incident-screenshots"
              data-report-field-id="source-evidence"
              tabIndex={0}
              role="button"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  document
                    .querySelector<HTMLInputElement>("#incident-screenshots")
                    ?.click();
                }
              }}
            >
              <span aria-hidden="true">＋</span> {t("workspace.addEvidence")}
            </label>
            <input
              id="incident-screenshots"
              className="visually-hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={processing}
              onChange={props.onScreenshotsChange}
            />
            {props.isRecording || props.hasAudio ? (
              <span className="recording-time" aria-live="polite">
                {Math.floor(props.recordingSeconds / 60)}:
                {String(props.recordingSeconds % 60).padStart(2, "0")} / 2:00
              </span>
            ) : null}
          </div>
          <p className="composer-safety">{t("workspace.safety")}</p>
        </div>
      ) : props.mode === "REVIEW" ? (
        <p className="review-source-intro">{t("workspace.reviewIntro")}</p>
      ) : null}

      <SourceSummary
        narrative={props.narrative}
        transcription={props.transcription}
        screenshots={props.screenshots}
        isDemoIncident={props.isDemoIncident}
        recordingSeconds={props.recordingSeconds}
        demoNarrationLanguage={props.demoNarrationLanguage}
        onDemoNarrationLanguageChange={props.onDemoNarrationLanguageChange}
        onRemoveScreenshot={props.onRemoveScreenshot}
        compact={props.mode === "REVIEW" || Boolean(props.draft)}
      />
      {props.formError && props.mode !== "ERROR" ? (
        <p className="form-error" role="alert">
          {props.formError}
        </p>
      ) : null}
    </section>
  );
}

function MissingFieldEditor({
  field,
  value,
  onChange,
  onSave,
}: {
  field: ReportFieldView;
  value: string;
  onChange: (value: string) => void;
  onSave: (fallback?: string) => void;
}) {
  const { locale, t } = useI18n();
  const question = field.missingQuestion;
  const [chooseAnotherYear, setChooseAnotherYear] = useState(false);
  const [showOtherCompromiseBasis, setShowOtherCompromiseBasis] = useState(false);
  if (!question) return null;

  if (question.field === "incidentDateYear") {
    const suggestedYear = new Date().getFullYear();
    return (
      <div
        className="report-missing-editor"
        data-missing-field={question.field}
        data-report-field-id={field.id}
      >
        <p className="partial-date-value">{field.value}</p>
        <p className="report-field-state">
          {locale === "hi" ? "पुष्टि जरूरी है" : "Needs confirmation"}
        </p>
        <p>
          {locale === "hi"
            ? `क्या यह ${field.value} ${suggestedYear} की घटना है?`
            : `Was this ${field.value} ${suggestedYear}?`}
        </p>
        <div className="inline-field-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onSave(String(suggestedYear))}
          >
            {t("field.yes")}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setChooseAnotherYear(true)}
          >
            {locale === "hi" ? "दूसरा साल चुनें" : "Choose another year"}
          </button>
        </div>
        {chooseAnotherYear ? (
          <div className="year-confirmation-input">
            <label htmlFor="missing-incidentDateYear">
              {locale === "hi" ? "साल" : "Year"}
            </label>
            <input
              id="missing-incidentDateYear"
              type="number"
              min="2000"
              max="2100"
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => onSave()}
            >
              {locale === "hi" ? "साल सहेजें" : "Save year"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (
    question.field === "recoveryInformationChanged" ||
    question.field === "moneyLost" ||
    question.field === "delayInReporting"
  ) {
    return (
      <div
        className="report-missing-editor"
        data-missing-field={question.field}
        data-report-field-id={field.id}
      >
        <p className="report-field-state">
          {locale === "hi" ? question.questionHi : question.question}
        </p>
        <div className="inline-field-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onSave("yes")}
          >
            {question.field === "moneyLost"
              ? locale === "hi" ? "हाँ, पैसे दिए या डेबिट हुए" : "Yes, money was paid or debited"
              : t("field.yes")}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onSave("no")}
          >
            {t("field.no")}
          </button>
          {question.field === "moneyLost" ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onSave("unknown")}
            >
              {locale === "hi" ? "मुझे पक्का नहीं पता" : "I'm not sure"}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (question.field === "accountCompromiseBasis") {
    const options = locale === "hi"
      ? [
          "रिकवरी जानकारी बदल गई",
          "अनजान लॉगिन या सुरक्षा चेतावनी",
          "मेरी जानकारी के बिना संदेश या सेटिंग बदली",
          "मैं केवल पासवर्ड भूल गया/गई",
        ]
      : [
          "Recovery details changed",
          "Unfamiliar login or security alert",
          "Messages or settings changed without me",
          "I simply forgot the password",
        ];
    return (
      <div
        className="report-missing-editor"
        data-missing-field={question.field}
        data-report-field-id={field.id}
      >
        <p className="report-field-state">
          {locale === "hi" ? question.questionHi : question.question}
        </p>
        <div className="clarification-options">
          {options.map((option) => (
            <button className="secondary-button" type="button" key={option} onClick={() => onSave(option)}>
              {option}
            </button>
          ))}
          <button className="secondary-button" type="button" onClick={() => setShowOtherCompromiseBasis(true)}>
            {locale === "hi" ? "कुछ और" : "Something else"}
          </button>
        </div>
        {showOtherCompromiseBasis ? (
          <div className="year-confirmation-input">
            <label htmlFor="missing-accountCompromiseBasis">
              {locale === "hi" ? "क्या हुआ?" : "What happened?"}
            </label>
            <input
              id="missing-accountCompromiseBasis"
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <button className="secondary-button" type="button" onClick={() => onSave()}>
              {t("field.save")}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="report-missing-editor"
      data-missing-field={question.field}
      data-report-field-id={field.id}
    >
      <label htmlFor={`missing-${question.field}`}>
        {locale === "hi" ? question.questionHi : question.question}
      </label>
      {field.helpText ? (
        <p className="report-field-help">{field.helpText}</p>
      ) : null}
      <input
        id={`missing-${question.field}`}
        type={question.inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="inline-field-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onSave()}
        >
          {t("field.save")}
        </button>
        {question.field === "transactionIdOrUtr" ? (
          <button
            className="text-button"
            type="button"
            onClick={() => onSave(CITIZEN_DOES_NOT_HAVE)}
          >
            {locale === "hi"
              ? "मेरे पास यह जानकारी नहीं है"
              : "I don’t have this"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReportFieldRow({
  field,
  missingValue,
  onMissingValueChange,
  onSaveMissing,
  narrativeEditing,
  onNarrativeEdit,
}: {
  field: ReportFieldView;
  missingValue: string;
  onMissingValueChange: (value: string) => void;
  onSaveMissing: (fallback?: string) => void;
  narrativeEditing: boolean;
  onNarrativeEdit: () => void;
}) {
  const { t } = useI18n();
  const showSource = SOURCE_VISIBLE_FIELD_IDS.has(field.id);
  if (field.missingQuestion) {
    const isPartialDate = field.missingQuestion.field === "incidentDateYear";
    return (
      <div
        className="report-field report-field-missing"
        data-field-id={field.id}
        data-report-field-id={field.id}
      >
        <p className="report-field-label">{field.label}</p>
        {!isPartialDate ? (
          <p className="report-field-state">{t("field.needsInput")}</p>
        ) : null}
        <MissingFieldEditor
          field={field}
          value={missingValue}
          onChange={onMissingValueChange}
          onSave={onSaveMissing}
        />
      </div>
    );
  }

  return (
    <div
      className="report-field"
      data-field-id={field.id}
      data-report-field-id={field.id}
    >
      <p className="report-field-label">{field.label}</p>
      <p className="report-field-value">
        {field.value}
        {field.state === "READY" ? (
          <span className="ready-mark" aria-label={t("field.ready")}>
            ✓
          </span>
        ) : null}
      </p>
      {field.helpText ? (
        <p className="report-field-help">{field.helpText}</p>
      ) : null}
      {field.source && showSource ? (
        <p className="report-field-source">{field.source}</p>
      ) : null}
      {field.kind === "NARRATIVE" && !narrativeEditing ? (
        <button
          className="text-button field-edit-button"
          type="button"
          onClick={onNarrativeEdit}
        >
          {t("field.edit")}
        </button>
      ) : null}
    </div>
  );
}

function NarrativeEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const { locale, t } = useI18n();
  const [narrative, setNarrative] = useState(value);

  return (
    <div className="report-inline-edit">
      <label className="visually-hidden" htmlFor="edit-incident-narrative">
        {t("field.description")}
      </label>
      <textarea
        id="edit-incident-narrative"
        rows={6}
        value={narrative}
        onChange={(event) => setNarrative(event.target.value)}
      />
      <div className="inline-field-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onSave(narrative)}
        >
          {t("field.save")}
        </button>
        <button className="text-button" type="button" onClick={onCancel}>
          {t("field.cancel")}
        </button>
      </div>
    </div>
  );
}

function ReportGroup({
  group,
  draft,
  missingAnswers,
  onMissingAnswerChange,
  onSaveMissingAnswer,
  onDraftChange,
  showMissingEditors = true,
  screenshots,
  isDemoIncident,
}: {
  group: ReportGroupView;
  draft: IncidentDraft;
  missingAnswers: Record<string, string>;
  onMissingAnswerChange: ReportWorkspaceProps["onMissingAnswerChange"];
  onSaveMissingAnswer: ReportWorkspaceProps["onSaveMissingAnswer"];
  onDraftChange: ReportWorkspaceProps["onDraftChange"];
  showMissingEditors?: boolean;
  screenshots: File[];
  isDemoIncident: boolean;
}) {
  const { locale, t } = useI18n();
  const [narrativeEditing, setNarrativeEditing] = useState(false);

  const renderField = (item: ReportFieldView) =>
    item.missingQuestion && !showMissingEditors ? null : (
      <ReportFieldRow
        key={item.id}
        field={item}
        missingValue={
          item.missingQuestion
            ? (missingAnswers[item.missingQuestion.field] ?? "")
            : ""
        }
        onMissingValueChange={(value) => {
          if (item.missingQuestion)
            onMissingAnswerChange(item.missingQuestion.field, value);
        }}
        onSaveMissing={(fallback) => {
          if (item.missingQuestion)
            onSaveMissingAnswer(item.missingQuestion, fallback);
        }}
        narrativeEditing={narrativeEditing}
        onNarrativeEdit={() => setNarrativeEditing(true)}
      />
    );

  const allFields = group.sections.flatMap((section) => section.fields);
  const getField = (id: string) => allFields.find((field) => field.id === id);

  const editors = (
    <>
      {narrativeEditing && group.id === "INCIDENT" ? (
        <NarrativeEditor
          value={draft.incident.narrative ?? ""}
          onCancel={() => setNarrativeEditing(false)}
          onSave={(narrative) => {
            onDraftChange({
              ...draft,
              incident: { ...draft.incident, narrative: narrative || null },
            });
            setNarrativeEditing(false);
          }}
        />
      ) : null}
    </>
  );

  if (group.id === "INCIDENT") {
    const subcategory = getField("subcategory");
    const date = getField("incident-date");
    const time = getField("incident-time");
    const channel = getField("occurred-on");
    const narrative = getField("incident-description");
    const reportedAmount =
      draft.incident.reportedAmount ??
      draft.transactions.reduce(
        (total, transaction) => total + (transaction.amount ?? 0),
        0,
      );
    const summaryIds = new Set([
      "subcategory",
      "incident-date",
      "incident-time",
      "occurred-on",
      "incident-description",
    ]);
    const supportingFields = allFields.filter(
      (field) => !summaryIds.has(field.id),
    );

    return (
      <div
        className="report-group report-group-incident"
        data-group-id={group.id}
      >
        {editors}
        <section className="incident-overview" aria-label={group.label}>
          <h3>{subcategory?.value}</h3>
          <div className="incident-overview-meta">
            {reportedAmount > 0 ? (
              <strong>
                {formatCurrency(reportedAmount)}{" "}
                {locale === "hi" ? "का नुकसान" : "lost"}
              </strong>
            ) : draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
              draft.incident.financialLossState === "NO" ? (
              <strong>
                {locale === "hi" ? "पैसे गए: नहीं" : "Money lost: No"}
              </strong>
            ) : null}
            <span>{channel?.value}</span>
            <span>
              {date?.value}
              {time?.value ? ` · ${time.value}` : ""}
            </span>
          </div>
        </section>
        {narrative ? (
          <section className="incident-description-block">
            <div className="section-heading-with-action">
              <h3>{narrative.label}</h3>
              {!narrativeEditing ? (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setNarrativeEditing(true)}
                >
                  {t("field.edit")} →
                </button>
              ) : null}
            </div>
            {!narrativeEditing ? <p>{narrative.value}</p> : null}
          </section>
        ) : null}
        {allFields.filter((field) => field.missingQuestion).map(renderField)}
        <details className="report-summary-disclosure">
          <summary>
            {t("workspace.officialDetails")} <span aria-hidden="true">→</span>
          </summary>
          <div className="report-summary-disclosure-content">
            {supportingFields
              .filter((field) => !field.missingQuestion)
              .map(renderField)}
          </div>
        </details>
      </div>
    );
  }

  if (group.id === "TRANSACTIONS") {
    const transactionSections = group.sections.filter(
      (section) =>
        section.id.startsWith("transaction-") &&
        section.id !== "transaction-summary",
    );
    const totalField = group.sections.find(
      (section) => section.id === "transaction-summary",
    )?.fields[0];
    return (
      <div
        className="report-group report-group-transactions"
        data-group-id={group.id}
      >
        {transactionSections.length > 1 && totalField
          ? renderField(totalField)
          : null}
        {transactionSections.map((section, index) => {
          const bySuffix = (suffix: string) =>
            section.fields.find((field) => field.id.endsWith(suffix));
          const amount = bySuffix("-amount");
          const institution = bySuffix("-institution");
          const date = bySuffix("-date");
          const time = bySuffix("-time");
          const secondary = section.fields.filter(
            (field) =>
              ![amount?.id, institution?.id, date?.id, time?.id].includes(
                field.id,
              ),
          );
          const summaryMissing = [amount, institution, date, time].filter(
            (field): field is ReportFieldView =>
              Boolean(field?.missingQuestion),
          );
          return (
            <section className="transaction-card" key={section.id}>
              <p className="transaction-label">
                {section.title ?? t("field.transaction", { number: index + 1 })}
              </p>
              <strong className="transaction-amount">{amount?.value}</strong>
              <p className="transaction-institution">{institution?.value}</p>
              <p className="transaction-date">
                {date?.value}
                {time?.value ? ` · ${time.value}` : ""}
              </p>
              {summaryMissing.map(renderField)}
              <div className="transaction-secondary-fields">
                {secondary.map(renderField)}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  if (group.id === "EVIDENCE_SUSPECT") {
    const evidenceFields =
      group.sections.find((section) => section.id === "evidence")?.fields ?? [];
    const evidenceFacts =
      group.sections.find((section) => section.id === "evidence-facts")
        ?.fields ?? [];
    const suspectFields = (
      group.sections.find((section) => section.id === "suspect")?.fields ?? []
    ).filter((field) => field.state !== "NOT_PROVIDED_OPTIONAL");
    const claimedIssue = evidenceFacts.find((field) =>
      /KYC|केवाईसी/i.test(field.value),
    );
    const transactionFound = evidenceFacts.find((field) =>
      field.value.includes("₹40,000"),
    );
    return (
      <div
        className="report-group report-group-evidence"
        data-group-id={group.id}
      >
        <section className="evidence-prepared-summary">
          <p className="report-field-label">{t("field.evidenceSupplied")}</p>
          <strong>
            {t("workspace.evidenceItems", { count: evidenceFields.length })}
          </strong>
        </section>
        <EvidenceContributions
          draft={draft}
          screenshots={screenshots}
          isDemoIncident={isDemoIncident}
        />
        {suspectFields.length > 0 ? (
          <section className="information-found">
            <h3>{t("workspace.informationFound")}</h3>
            <div className="information-found-grid">
              {suspectFields.map(renderField)}
              {claimedIssue ? (
                <div className="report-field">
                  <p className="report-field-label">
                    {t("workspace.claimedIssue")}
                  </p>
                  <p className="report-field-value">
                    {claimedIssue.value} <span className="ready-mark">✓</span>
                  </p>
                </div>
              ) : null}
              {transactionFound ? (
                <div className="report-field">
                  <p className="report-field-label">
                    {t("workspace.transactionFound")}
                  </p>
                  <p className="report-field-value">
                    {transactionFound.value}{" "}
                    <span className="ready-mark">✓</span>
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        <details className="report-summary-disclosure">
          <summary>
            {t("workspace.fullEvidenceDetails")}{" "}
            <span aria-hidden="true">→</span>
          </summary>
          <div className="report-summary-disclosure-content">
            {evidenceFields.map(renderField)}
            {evidenceFacts.map(renderField)}
          </div>
        </details>
      </div>
    );
  }

  if (group.id === "REPORTER") {
    const name = getField("reporter-name");
    const mobile = getField("reporter-mobile");
    const state = getField("reporter-state");
    const district = getField("reporter-district");
    const city = getField("reporter-city");
    const identity = getField("reporter-identity-document");
    return (
      <div
        className="report-group report-group-profile"
        data-group-id={group.id}
      >
        <section className="profile-primary-summary">
          <h3>{name?.value}</h3>
          <p>{name?.source}</p>
          <dl>
            <div>
              <dt>{mobile?.label}</dt>
              <dd>{mobile?.value}</dd>
            </div>
            <div>
              <dt>{state?.label}</dt>
              <dd>
                {[state?.value, district?.value ?? city?.value]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
            <div>
              <dt>{identity?.label}</dt>
              <dd>
                {identity?.value} <span className="ready-mark">✓</span>
              </dd>
            </div>
          </dl>
        </section>
        <details className="report-summary-disclosure">
          <summary>
            {t("workspace.fullProfile")} <span aria-hidden="true">→</span>
          </summary>
          <div className="report-summary-disclosure-content">
            {group.sections.map((section) => (
              <section key={section.id} className="report-field-section">
                {section.title ? <h3>{section.title}</h3> : null}
                {section.fields.map(renderField)}
              </section>
            ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="report-group" data-group-id={group.id}>
      {editors}
      {group.sections.map((section) => {
        const fields = section.fields.map(renderField);
        if (section.id === "secondary-address") {
          return (
            <details
              key={section.id}
              className="report-field-section report-address-disclosure"
            >
              <summary>{section.title}</summary>
              {fields}
            </details>
          );
        }
        return (
          <section key={section.id} className="report-field-section">
            {section.title ? <h3>{section.title}</h3> : null}
            {fields}
          </section>
        );
      })}
    </div>
  );
}

function ReportReview(props: ReportWorkspaceProps) {
  const { locale, t } = useI18n();
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(["INCIDENT", "TRANSACTIONS"]),
  );
  if (!props.draft) return null;
  const groups = deriveReportGroups(props.draft, {
    locale,
    profile: props.reporterProfile,
    identityDocumentProvided: props.identityDocumentProvided,
  });
  const complaint = buildNcrpCompatibleComplaint({
    draft: props.draft,
    profile: props.reporterProfile,
    transcription: props.transcription,
    typedNarrative: props.narrative,
    isDemoIncident: props.isDemoIncident,
    screenshotNames: props.isDemoIncident
      ? [
          "Synthetic KYC message screenshot",
          "Synthetic bank transaction screenshot",
        ]
      : props.screenshots.map((file) => file.name),
    identityDocumentProvided: props.identityDocumentProvided,
    declarationAccepted,
  });
  const sourceLabel = (sources: string[]) => {
    if (sources.length === 0) return "—";
    if (sources.includes("SIMULATED_PROFILE")) return t("field.fromProfile");
    if (sources.includes("USER_INPUT")) return t("profile.fromTest");
    if (sources.includes("USER_CONFIRMED")) return t("field.fromConfirmation");
    if (sources.includes("EVIDENCE")) return t("field.fromEvidence");
    if (sources.includes("VOICE") || sources.includes("TYPED"))
      return t("field.fromStatement");
    return t("field.fromShared");
  };

  return (
    <>
      <div className="report-pane-heading">
        <h2>{t("workspace.reviewSubmit")}</h2>
        <p>{t("workspace.reviewSupport")}</p>
      </div>
      <div className="report-review-groups">
        {groups.map((group) => (
          <details
            key={group.id}
            className="report-review-group"
            open={openGroups.has(group.id)}
            onToggle={(event) => {
              const isOpen = event.currentTarget.open;
              setOpenGroups((current) => {
                if (current.has(group.id) === isOpen) return current;
                const next = new Set(current);
                if (isOpen) next.add(group.id);
                else next.delete(group.id);
                return next;
              });
            }}
          >
            <summary>
              <span>{group.label}</span>
              <strong aria-label={t("field.ready")}>✓</strong>
            </summary>
            <div className="report-review-group-content">
              {group.sections
                .filter(
                  (section) =>
                    section.id !== "secondary-address" &&
                    section.id !== "evidence-facts",
                )
                .flatMap((section) => section.fields)
                .map((item) => (
                  <div key={item.id} className="review-field-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
            </div>
          </details>
        ))}
      </div>
      <details className="field-coverage-disclosure">
        <summary>
          <span>
            <strong>{t("workspace.coverage")}</strong>
            <small>{t("workspace.coverageIntroShort")}</small>
          </span>
          <span className="coverage-action">
            {t("workspace.coverageAction")}
          </span>
        </summary>
        <div className="field-coverage-content">
          <h3>{t("workspace.coverageHeading")}</h3>
          <p>{t("workspace.coverageIntro")}</p>
          <div
            className="field-coverage-table"
            role="table"
            aria-label={t("workspace.coverageHeading")}
          >
            <div className="field-coverage-header" role="row">
              <strong role="columnheader">
                {t("workspace.coverageInformation")}
              </strong>
              <strong role="columnheader">
                {t("workspace.coverageStatus")}
              </strong>
              <strong role="columnheader">
                {t("workspace.coverageSource")}
              </strong>
            </div>
            {NCRP_FIELD_DEFINITIONS.filter(
              (definition) =>
                definition.supportedInPrototype &&
                definition.id !== "declaration.accepted",
            )
              .filter((definition) =>
                complaintFieldApplies(complaint, definition),
              )
              .filter((definition) => {
                const status = complaintRequiredFieldStatus(
                  complaint,
                  definition,
                );
                return (
                  complaintFieldIsRequired(complaint, definition) ||
                  status !== "NOT_PROVIDED_OPTIONAL"
                );
              })
              .map((definition) => {
                const status = complaintRequiredFieldStatus(
                  complaint,
                  definition,
                );
                const path = definition.id.split(".");
                let current: unknown = complaint.groups;
                for (const part of path) {
                  if (current && typeof current === "object") {
                    current = (current as Record<string, unknown>)[part];
                  }
                }
                const sources =
                  current && typeof current === "object" && "sources" in current
                    ? (current as { sources: string[] }).sources
                    : ["EVIDENCE"];
                return (
                  <div
                    className="field-coverage-row"
                    role="row"
                    key={definition.id}
                  >
                    <span role="cell">{t(definition.labelKey)}</span>
                    <span
                      className={
                        status === "NOT_PROVIDED_OPTIONAL"
                          ? "coverage-optional"
                          : undefined
                      }
                      role="cell"
                    >
                      {status === "READY" || status === "CONFIRMED"
                        ? t("field.ready")
                        : status === "NOT_PROVIDED_OPTIONAL"
                          ? t("field.notProvided")
                          : status === "CITIZEN_DOES_NOT_HAVE"
                            ? t("field.notAvailable")
                            : t("field.needsInput")}
                    </span>
                    <span role="cell">{sourceLabel(sources)}</span>
                  </div>
                );
              })}
          </div>
          <p className="source-note">
            {t("workspace.structureLabel")} · {complaint.schemaVersion}
          </p>
        </div>
      </details>
      <ComplaintPacket
        complaint={complaint}
        draft={props.draft}
        reference={props.reportReference}
        locale={locale}
        isDemoIncident={props.isDemoIncident}
      />
      <label className="report-declaration">
        <input
          type="checkbox"
          checked={declarationAccepted}
          onChange={(event) => setDeclarationAccepted(event.target.checked)}
        />
        <span>{t("workspace.declaration")}</span>
      </label>
      <div className="report-primary-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!declarationAccepted}
          onClick={() => props.onSubmit(complaint)}
        >
          {t("workspace.submitSynthetic")}
        </button>
        <button
          className="text-button"
          type="button"
          onClick={props.onBackToEdit}
        >
          {t("workspace.backEdit")}
        </button>
      </div>
      <p className="prototype-submit-note">{t("workspace.noSubmit")}</p>
      {!declarationAccepted ? (
        <p className="form-hint">{t("workspace.declarationRequired")}</p>
      ) : null}
    </>
  );
}

function ReportingPathControl({
  draft,
  onReportFamilyChange,
}: Pick<ReportWorkspaceProps, "onReportFamilyChange"> & {
  draft: IncidentDraft;
}) {
  const { locale } = useI18n();
  const [changing, setChanging] = useState(false);
  const classification = draft.classification;
  const familyLabel = (
    family: Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">,
  ) => {
    if (locale === "hi") {
      if (family === "FINANCIAL_FRAUD") return "वित्तीय धोखाधड़ी";
      if (family === "WOMEN_CHILDREN_RELATED_CRIME")
        return "महिला / बच्चों से संबंधित अपराध";
      return "अन्य साइबर अपराध";
    }
    if (family === "FINANCIAL_FRAUD") return "Financial Fraud";
    if (family === "WOMEN_CHILDREN_RELATED_CRIME")
      return "Women / Children Related Crime";
    return "Other Cyber Crime";
  };
  const subCategoryLabel = () => {
    if (locale !== "hi") return classification.subCategory;
    const translations: Record<string, string> = {
      "Internet Banking Related Fraud": "इंटरनेट बैंकिंग से जुड़ी धोखाधड़ी",
      "Investment / Trading Fraud": "निवेश / ट्रेडिंग धोखाधड़ी",
      "Online Financial Fraud": "ऑनलाइन वित्तीय धोखाधड़ी",
      "Profile Hacking": "प्रोफ़ाइल हैकिंग",
      Ransomware: "रैनसमवेयर",
      "Online abusive-content report": "ऑनलाइन अपमानजनक सामग्री की रिपोर्ट",
      "Other supported cyber incident": "अन्य समर्थित साइबर घटना",
    };
    return classification.subCategory
      ? (translations[classification.subCategory] ?? "सुझाई गई उप-श्रेणी")
      : null;
  };
  const detailedCategoryLabel = () => {
    const category = classification.category;
    if (
      !category ||
      [
        "Financial Fraud",
        "Women / Children Related Crime",
        "Other Cyber Crime",
      ].includes(category)
    ) {
      return null;
    }
    if (
      locale === "hi" &&
      category === "Online and Social Media Related Crime"
    ) {
      return "ऑनलाइन और सोशल मीडिया से संबंधित अपराध";
    }
    return category;
  };
  const focusStory = () => {
    const input = document.querySelector<HTMLTextAreaElement>(
      "#incident-narrative",
    );
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
  };

  if (classification.ambiguity === "INSUFFICIENT_INFORMATION") {
    return (
      <section
        className="classification-guidance"
        role="status"
        data-report-field-id="reporting-path-clarification"
      >
        <h3>
          {locale === "hi"
            ? "क्या हुआ, थोड़ा और बताएं"
            : "Tell us a little more about what happened"}
        </h3>
        <p>
          {locale === "hi"
            ? "घटना किस ऐप, वेबसाइट, खाते या उपकरण से जुड़ी थी?"
            : "Which app, website, account or device was involved?"}
        </p>
        <button className="secondary-button" type="button" onClick={focusStory}>
          {locale === "hi" ? "विवरण जारी रखें" : "Continue editing"}
        </button>
      </section>
    );
  }

  if (classification.ambiguity === "OUT_OF_CYBER_SCOPE") {
    return (
      <section
        className="classification-guidance"
        role="status"
        data-report-field-id="reporting-path-clarification"
      >
        <h3>
          {locale === "hi"
            ? "यह ऑनलाइन या साइबर घटना नहीं हो सकती है"
            : "This may not be an online or cyber incident"}
        </h3>
        <p>
          {locale === "hi"
            ? "यदि कोई तत्काल खतरे में है, तो उचित आपातकालीन या पुलिस सेवा से संपर्क करें।"
            : "If someone is in immediate danger, contact the appropriate emergency or police service."}
        </p>
        <div className="inline-field-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={focusStory}
          >
            {locale === "hi" ? "क्या हुआ, बदलें" : "Edit what happened"}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => onReportFamilyChange("OTHER_CYBER_CRIME")}
          >
            {locale === "hi"
              ? "यदि इसमें ऑनलाइन या साइबर हिस्सा था, तो जारी रखें"
              : "Continue only if this involved an online or cyber element"}
          </button>
        </div>
      </section>
    );
  }

  if (classification.ambiguity === "MULTIPLE_PLAUSIBLE_PATHS") {
    return (
      <section
        className="classification-guidance"
        role="status"
        data-report-field-id="reporting-path-clarification"
      >
        <h3>
          {locale === "hi"
            ? "यह घटना एक से अधिक रिपोर्टिंग रास्तों में आ सकती है"
            : "This incident may fit more than one reporting path"}
        </h3>
        <p>
          {locale === "hi"
            ? "आप यहाँ किस हिस्से की रिपोर्ट करना चाहते हैं?"
            : "Which part would you like to report here?"}
        </p>
        <div className="classification-options">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onReportFamilyChange("WOMEN_CHILDREN_RELATED_CRIME")}
          >
            {familyLabel("WOMEN_CHILDREN_RELATED_CRIME")}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onReportFamilyChange("FINANCIAL_FRAUD")}
          >
            {familyLabel("FINANCIAL_FRAUD")}
          </button>
        </div>
      </section>
    );
  }

  if (classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR") return null;

  const families: Array<Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">> = [
    "FINANCIAL_FRAUD",
    "WOMEN_CHILDREN_RELATED_CRIME",
    "OTHER_CYBER_CRIME",
  ];
  return (
    <section
      className="suggested-reporting-path"
      data-report-field-id="reporting-path-clarification"
      aria-label={
        locale === "hi"
          ? "सुझाई गई रिपोर्टिंग श्रेणी"
          : "Suggested reporting category"
      }
    >
      <p className="report-field-label">
        {locale === "hi"
          ? "सुझाई गई रिपोर्टिंग श्रेणी"
          : "Suggested reporting category"}
      </p>
      <strong>{familyLabel(classification.reportFamily)}</strong>
      {detailedCategoryLabel() ? <span>{detailedCategoryLabel()}</span> : null}
      {subCategoryLabel() ? <span>{subCategoryLabel()}</span> : null}
      <p>
        {locale === "hi"
          ? "आपके साझा किए गए विवरण के आधार पर।"
          : "Based on what you shared."}
      </p>
      <button
        className="text-button"
        type="button"
        onClick={() => setChanging((current) => !current)}
        aria-expanded={changing}
      >
        {locale === "hi" ? "बदलें" : "Change"}
      </button>
      {changing ? (
        <div
          className="classification-options"
          aria-label={
            locale === "hi" ? "दूसरी श्रेणी चुनें" : "Choose another category"
          }
        >
          {families.map((family) => (
            <button
              className="secondary-button"
              type="button"
              key={family}
              aria-pressed={classification.reportFamily === family}
              onClick={() => {
                onReportFamilyChange(family);
                setChanging(false);
              }}
            >
              {familyLabel(family)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReportDetailsPane({
  groups,
  readiness,
  ...props
}: ReportWorkspaceProps & {
  groups: ReportGroupView[];
  readiness: ReportReadiness | null;
}) {
  const { locale, t } = useI18n();
  const amountConflictMissing = Boolean(
    props.amountResolution?.hasConflict &&
    !props.amountResolution.selectedAmount,
  );
  const amountConflictResolution = amountConflictMissing
    ? props.amountResolution
    : null;
  const firstMissingQuestion = props.draft
    ? deriveMissingQuestions(props.draft)[0]
    : null;
  const evidenceMissing = readiness?.blockingItems.some(
    (item) => item.fieldId === "source-evidence",
  ) ?? false;
  const priorityField = firstMissingQuestion
    ? groups
        .flatMap((group) => group.sections)
        .flatMap((section) => section.fields)
        .find(
          (field) =>
            field.missingQuestion?.field === firstMissingQuestion.field,
        )
    : null;
  const incidentGroup = groups.find((group) => group.id === "INCIDENT");
  const remainingGroups = groups.filter((group) => group.id !== "INCIDENT");
  const timeline =
    props.draft && !amountConflictMissing
      ? deriveIncidentTimeline(props.draft, {
          locale,
          isDemoIncident: props.isDemoIncident,
        })
      : [];
  const sensitiveDetailDetected = Boolean(
    props.draft &&
    [
      props.narrative,
      props.transcription?.originalTranscript,
      props.transcription?.englishTranscript,
      props.draft.incident.narrative,
      props.draft.citizenSummary.shortSummary,
      ...props.draft.evidence.flatMap((item) => item.extractedFacts),
    ].some((value) => containsSensitiveDetail(value)),
  );

  if (props.mode === "REVIEW") {
    return (
      <section
        className="report-details-pane"
        aria-label={t("workspace.reviewSubmit")}
      >
        <ReportReview {...props} />
      </section>
    );
  }

  return (
    <section
      className="report-details-pane"
      aria-labelledby="report-details-heading"
    >
      <div className="report-pane-heading">
        <h2 id="report-details-heading" tabIndex={-1}>{t("workspace.reportInfo")}</h2>
        <p>
          {props.draft?.officialMapping.subCategoryLabel ??
            t("workspace.reportInfoSupport")}
        </p>
        {readiness && props.mode === "READY" ? (
          <span className="report-pane-readiness">
            {readiness.state === "READY"
              ? locale === "hi" ? "समीक्षा के लिए तैयार" : "Ready to review"
              : readiness.state === "STALE"
                ? locale === "hi" ? "रिपोर्ट अपडेट करनी है" : "Report needs updating"
                : locale === "hi"
                  ? `${readiness.blockingItems.length} जरूरी जानकारी बाकी`
                  : `${readiness.blockingItems.length} required ${readiness.blockingItems.length === 1 ? "detail" : "details"} missing`}
          </span>
        ) : null}
      </div>

      {props.mode === "READY" && props.draft ? (
        <ReportingPathControl
          draft={props.draft}
          onReportFamilyChange={props.onReportFamilyChange}
        />
      ) : null}

      {props.mode === "PROCESSING" ? (
        <div
          className="report-processing-state"
          role="status"
          aria-live="polite"
        >
          <span className="loading-marker" aria-hidden="true" />
          <p>
            <strong>
              {props.experienceMode === "DEMO_CASE"
                ? t("workspace.organisingSample")
                : t(props.loadingMessage)}
            </strong>
          </p>
          <div className="report-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {props.mode === "ERROR" ? (
        <div className="report-error-state" role="alert">
          <h3>{t("workspace.errorHeading")}</h3>
          <p>{props.formError ?? t("workspace.inputPreserved")}</p>
          <div className="entry-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                document
                  .querySelector<HTMLTextAreaElement>("#incident-narrative")
                  ?.focus()
              }
            >
              {locale === "hi" ? "विवरण बदलते रहें" : "Continue editing"}
            </button>
            {props.isTranscriptionError ? (
              <>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    props.onRecordAgain();
                    props.onReportMethodChange("SPEAK");
                  }}
                >
                  {t("workspace.shorter")}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => props.onReportMethodChange("TYPE")}
                >
                  {t("workspace.typeInstead")}
                </button>
              </>
            ) : null}
            <button
              className="secondary-button"
              type="button"
              onClick={props.onUseDemoIncident}
            >
              {t("workspace.useDemo")}
            </button>
          </div>
        </div>
      ) : null}

      {props.mode === "READY" &&
      props.draft &&
      props.draft.classification.ambiguity === "NONE" ? (
        <>
          {incidentGroup ? (
            <section className="prepared-report-section prepared-report-core">
              <ReportGroup
                group={incidentGroup}
                draft={props.draft}
                missingAnswers={props.missingAnswers}
                onMissingAnswerChange={props.onMissingAnswerChange}
                onSaveMissingAnswer={props.onSaveMissingAnswer}
                onDraftChange={props.onDraftChange}
                showMissingEditors={false}
                screenshots={props.screenshots}
                isDemoIncident={props.isDemoIncident}
              />
            </section>
          ) : null}

          {sensitiveDetailDetected ? (
            <aside className="sensitive-detail-notice" role="status">
              <strong>
                {locale === "hi"
                  ? "संवेदनशील जानकारी हटा दी गई"
                  : "Sensitive detail removed"}
              </strong>
              <p>
                {locale === "hi"
                  ? "OTP, PIN, CVV और पासवर्ड आपकी तैयार रिपोर्ट में शामिल नहीं किए जाते।"
                  : "OTPs, PINs, CVVs and passwords are not included in your prepared report."}
              </p>
            </aside>
          ) : null}

          {amountConflictResolution ? (
            <section
              className="amount-conflict"
              data-amount-conflict
              data-report-field-id="reported-amount-conflict"
              aria-labelledby="amount-conflict-heading"
            >
              <h3 id="amount-conflict-heading">
                {locale === "hi"
                  ? "दो अलग राशियाँ मिलीं"
                  : "We found two different amounts"}
              </h3>
              <dl>
                <div>
                  <dt>
                    {locale === "hi" ? "आपके बयान से" : "From your statement"}
                  </dt>
                  <dd>
                    {formatCurrency(
                      amountConflictResolution.statementAmount ?? 0,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    {locale === "hi" ? "लेन-देन से" : "From your transactions"}
                  </dt>
                  <dd>
                    {formatCurrency(
                      amountConflictResolution.transactionAmount ?? 0,
                    )}
                  </dd>
                </div>
              </dl>
              <p>
                {locale === "hi"
                  ? "इस रिपोर्ट में कौन-सी राशि उपयोग की जाए?"
                  : "Which amount should be used for this report?"}
              </p>
              <div className="inline-field-actions">
                {[
                  amountConflictResolution.statementAmount,
                  amountConflictResolution.transactionAmount,
                ]
                  .filter((amount): amount is number => amount !== null)
                  .map((amount) => (
                    <button
                      className="secondary-button"
                      type="button"
                      key={amount}
                      aria-pressed={
                        amountConflictResolution.selectedAmount === amount
                      }
                      onClick={() => props.onReportedAmountSelect(amount)}
                    >
                      {locale === "hi"
                        ? `${formatCurrency(amount)} उपयोग करें`
                        : `Use ${formatCurrency(amount)}`}
                    </button>
                  ))}
              </div>
            </section>
          ) : null}

          {priorityField && !amountConflictMissing ? (
            <section className="priority-missing-question">
              <p className="eyebrow">
                {locale === "hi"
                  ? "अगली जरूरी जानकारी"
                  : "Next required detail"}
              </p>
              <MissingFieldEditor
                field={priorityField}
                value={
                  priorityField.missingQuestion
                    ? (props.missingAnswers[
                        priorityField.missingQuestion.field
                      ] ?? "")
                    : ""
                }
                onChange={(value) => {
                  if (priorityField.missingQuestion) {
                    props.onMissingAnswerChange(
                      priorityField.missingQuestion.field,
                      value,
                    );
                  }
                }}
                onSave={(fallback) => {
                  if (priorityField.missingQuestion) {
                    props.onSaveMissingAnswer(
                      priorityField.missingQuestion,
                      fallback,
                    );
                  }
                }}
              />
            </section>
          ) : evidenceMissing &&
            !firstMissingQuestion &&
            !amountConflictMissing ? (
            <section className="priority-missing-question">
              <p className="eyebrow">
                {locale === "hi"
                  ? "अगली जरूरी जानकारी"
                  : "Next required detail"}
              </p>
              <h3>{t("field.evidenceSupplied")}</h3>
              <p>
                {locale === "hi"
                  ? "वित्तीय रिपोर्ट के लिए सहायक सबूत जोड़ें।"
                  : "Add supporting evidence for this financial report."}
              </p>
              <button
                className="secondary-button"
                type="button"
                data-report-field-id="source-evidence"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>("#incident-screenshots")
                    ?.click()
                }
              >
                {locale === "hi" ? "सबूत जोड़ें" : "Add evidence"}
              </button>
            </section>
          ) : null}

          <IncidentTimeline
            events={timeline}
            heading={locale === "hi" ? "क्या हुआ" : "What happened"}
          />

          <div className="prepared-report-groups">
            {remainingGroups.map((group) => (
              <section className="prepared-report-section" key={group.id}>
                <div className="prepared-section-heading">
                  <h3>{group.label}</h3>
                  <span>
                    {(readiness?.sectionBlockingCounts[group.id] ?? 0) > 0
                      ? `${readiness?.sectionBlockingCounts[group.id] ?? 0} ${t("workspace.actionNeeded")}`
                      : `✓ ${t("workspace.complete")}`}
                  </span>
                </div>
                <ReportGroup
                  group={group}
                  draft={props.draft!}
                  missingAnswers={props.missingAnswers}
                  onMissingAnswerChange={props.onMissingAnswerChange}
                  onSaveMissingAnswer={props.onSaveMissingAnswer}
                  onDraftChange={props.onDraftChange}
                  showMissingEditors={false}
                  screenshots={props.screenshots}
                  isDemoIncident={props.isDemoIncident}
                />
              </section>
            ))}
          </div>

          <ImmediateHandoff
            draft={props.draft}
            amountResolution={props.amountResolution}
          />

          <section className="report-readiness" aria-live="polite">
            <h2>
              {readiness?.state === "READY"
                ? locale === "hi"
                  ? "रिपोर्ट समीक्षा के लिए तैयार है ✓"
                  : "Report ready to review ✓"
                : readiness?.state === "STALE"
                  ? locale === "hi"
                    ? "आपकी जानकारी बदल गई है"
                    : "Your information changed"
                  : locale === "hi"
                    ? "रिपोर्ट लगभग तैयार है"
                    : "Report almost ready"}
            </h2>
            {readiness?.state === "STALE" ? (
              <p>
                {locale === "hi"
                  ? "आगे बढ़ने से पहले रिपोर्ट अपडेट करें।"
                  : "Update the report before continuing."}
              </p>
            ) : amountConflictMissing ? (
              <p>
                {locale === "hi"
                  ? "हमें दो अलग-अलग राशियाँ मिलीं। रिपोर्ट में उपयोग की जाने वाली राशि चुनें।"
                  : "We found two different amounts. Choose which amount should be used in the report."}
              </p>
            ) : readiness?.state === "READY" ? (
              <p>
                {locale === "hi"
                  ? "इस रिपोर्टिंग रास्ते के लिए सभी जरूरी जानकारी उपलब्ध है।"
                  : "All required information for this reporting path is available."}
              </p>
            ) : (
              <p>
                {locale === "hi"
                  ? `${readiness?.preparedRequiredCount ?? 0} जानकारियाँ आपके साझा किए गए विवरण से तैयार हैं। ${readiness?.blockingItems.length ?? 0} जानकारी अभी चाहिए।`
                  : `${readiness?.preparedRequiredCount ?? 0} details prepared from what you shared. ${readiness?.blockingItems.length ?? 0} ${(readiness?.blockingItems.length ?? 0) === 1 ? "detail is" : "details are"} still needed.`}
              </p>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

export function ReportWorkspace(props: ReportWorkspaceProps) {
  const { locale, t } = useI18n();
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);
  const [navigationMessage, setNavigationMessage] = useState("");
  const highlightTimerRef = useRef<number | null>(null);
  const groups = props.draft
    ? deriveReportGroups(props.draft, {
        locale,
        profile: props.reporterProfile,
        identityDocumentProvided: props.identityDocumentProvided,
      })
    : [];
  const complaint = props.draft
    ? buildNcrpCompatibleComplaint({
        draft: props.draft,
        profile: props.reporterProfile,
        transcription: props.transcription,
        typedNarrative: props.narrative,
        isDemoIncident: props.isDemoIncident,
        screenshotNames: props.isDemoIncident
          ? [
              "Synthetic KYC message screenshot",
              "Synthetic bank transaction screenshot",
            ]
          : props.screenshots.map((file) => file.name),
        identityDocumentProvided: props.identityDocumentProvided,
      })
    : null;
  const readiness = props.draft && complaint
    ? deriveReportReadiness({
        draft: props.draft,
        complaint,
        amountResolution: props.amountResolution,
        locale,
        isStale: props.isReportStale,
      })
    : null;
  const sourceReady = Boolean(
    props.reporterName.trim() &&
    (props.narrative.trim() || props.hasAudio || props.screenshots.length > 0),
  );

  useEffect(() => {
    if (!pendingTargetId) return;
    let frame = 0;
    let attempts = 0;

    const reveal = () => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-report-field-id]"),
      ).find((item) => item.dataset.reportFieldId === pendingTargetId);
      if (!target && attempts < 4) {
        attempts += 1;
        frame = window.requestAnimationFrame(reveal);
        return;
      }

      if (!target) {
        const fallback = document.querySelector<HTMLElement>("#report-details-heading");
        fallback?.focus({ preventScroll: true });
        fallback?.scrollIntoView({ behavior: "auto", block: "start" });
        setNavigationMessage(
          locale === "hi"
            ? "अगली जरूरी जानकारी रिपोर्ट में दिखाई गई है।"
            : "The next required detail is shown in the report.",
        );
        setPendingTargetId(null);
        return;
      }

      let disclosure = target.closest("details");
      while (disclosure) {
        disclosure.open = true;
        disclosure = disclosure.parentElement?.closest("details") ?? null;
      }
      const focusTarget = target.matches(
        "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
      )
        ? target
        : target.querySelector<HTMLElement>(
            "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
          );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      focusTarget?.focus({ preventScroll: true });
      target.classList.add("report-field-target-highlight");
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => {
        target.classList.remove("report-field-target-highlight");
      }, 1600);
      setNavigationMessage(
        locale === "hi" ? "अगली जरूरी जानकारी खुल गई है।" : "Next required detail opened.",
      );
      setPendingTargetId(null);
    };

    frame = window.requestAnimationFrame(reveal);
    return () => window.cancelAnimationFrame(frame);
  }, [locale, pendingTargetId]);

  useEffect(() => () => {
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
  }, []);

  function runPrimaryAction() {
    if (props.mode === "PROCESSING") return;
    if (!props.draft || props.mode === "ERROR" || readiness?.state === "STALE") {
      props.onOrganizeReport();
      return;
    }
    if (readiness?.state === "READY") {
      props.onReview();
      return;
    }
    if (readiness?.nextBlockingItem) {
      setNavigationMessage("");
      setPendingTargetId(readiness.nextBlockingItem.fieldId);
      return;
    }
    document.querySelector<HTMLElement>("#report-details-heading")?.focus();
  }

  const actionTitle = props.mode === "PROCESSING"
    ? locale === "hi" ? "रिपोर्ट तैयार हो रही है" : "Preparing your report"
    : props.mode === "ERROR"
      ? locale === "hi" ? "आपकी जानकारी सुरक्षित है" : "Your information is preserved"
      : !props.draft
        ? locale === "hi" ? "अपनी जानकारी से रिपोर्ट तैयार करें" : "Prepare a report from what you shared"
        : readiness?.state === "STALE"
          ? locale === "hi" ? "आपकी जानकारी बदल गई है" : "Your information changed"
          : readiness?.state === "NEEDS_CLARIFICATION"
            ? locale === "hi" ? "सचेत को आगे बढ़ने के लिए एक जवाब चाहिए" : "One answer is needed before Sachet can continue"
            : readiness?.state === "MISSING_REQUIRED"
              ? locale === "hi" ? "रिपोर्ट लगभग तैयार है" : "Report almost ready"
              : locale === "hi" ? "रिपोर्ट समीक्षा के लिए तैयार है" : "Report ready to review";
  const actionSupport = readiness?.state === "MISSING_REQUIRED"
    ? locale === "hi"
      ? `${readiness.blockingItems.length} जरूरी जानकारी पर ध्यान देना बाकी है।`
      : `${readiness.blockingItems.length} required ${readiness.blockingItems.length === 1 ? "detail still needs" : "details still need"} your attention.`
    : null;
  const actionLabel = props.mode === "PROCESSING"
    ? t("workspace.preparingReport")
    : props.mode === "ERROR"
      ? t("workspace.tryAgain")
      : !props.draft
        ? t("workspace.organise")
        : readiness?.state === "STALE"
          ? locale === "hi" ? "रिपोर्ट अपडेट करें" : "Update report"
          : readiness?.state === "NEEDS_CLARIFICATION"
            ? locale === "hi" ? "सवाल का जवाब दें" : "Answer question"
            : readiness?.state === "MISSING_REQUIRED"
              ? locale === "hi" ? "अगली जरूरी जानकारी पर जाएँ" : "Go to next missing detail"
              : locale === "hi" ? "रिपोर्ट की समीक्षा करें" : "Review report";

  return (
    <section
      className="report-workspace-stage section-pad"
      data-journey-focus
      data-private
      tabIndex={-1}
    >
      <div className="report-workspace-shell">
        <JourneyProgress
          current={props.mode === "REVIEW" ? "RESTORE" : "REPORT"}
        />
        <div
          className={`report-workspace report-workspace-${props.mode.toLowerCase()}`}
        >
          <ReportInputPane {...props} />
          <ReportDetailsPane {...props} groups={groups} readiness={readiness} />
        </div>
        {props.mode !== "REVIEW" ? (
          <div className="workspace-action-bar" aria-live="polite">
            <div>
              <strong>{actionTitle}</strong>
              {actionSupport ? <span>{actionSupport}</span> : null}
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={props.mode === "PROCESSING" || (!props.draft && !sourceReady)}
              onClick={runPrimaryAction}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
        <p className="visually-hidden" aria-live="polite">
          {navigationMessage}
        </p>
      </div>
    </section>
  );
}
