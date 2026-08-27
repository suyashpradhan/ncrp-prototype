"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  deriveMissingQuestions,
  type MissingQuestion,
} from "../../incident/missing-information";
import type { IncidentDraft, TranscriptionResult } from "../../incident/schema";
import {
  DEMO_NARRATIONS,
  type DemoNarrationLanguage,
} from "../../incident/demo-incident";
import type { ReportedAmountResolution } from "../../incident/complaint-case";
import {
  NCRP_FIELD_DEFINITIONS,
  buildNcrpCompatibleComplaint,
  complaintFieldIsRequired,
  complaintRequiredFieldStatus,
  type NcrpCompatibleComplaint,
} from "../../incident/ncrp-compatible-complaint";
import type { ExperienceMode, ReporterProfile } from "../../experience/profile";
import { useI18n } from "../../i18n/i18n-provider";
import {
  CITIZEN_DOES_NOT_HAVE,
  deriveReportCompletion,
  deriveReportGroups,
  type ReportFieldView,
  type ReportGroupId,
  type ReportGroupView,
} from "../../presentation/report-details";
import { formatCurrency } from "../../presentation/format";
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
    src: "/demo/evidence/kyc-message-demo.png",
    altKey: "workspace.demoMessage",
    labelKey: "workspace.demoMessage",
    typeKey: "workspace.evidenceMessageType",
  },
  {
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
  screenshots: File[];
  transcription: TranscriptionResult | null;
  hasAudio: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  isDemoIncident: boolean;
  experienceMode: ExperienceMode | null;
  reporterProfile: ReporterProfile;
  identityDocumentProvided: boolean;
  demoNarrationLanguage: DemoNarrationLanguage;
  isTranscriptionError: boolean;
  draft: IncidentDraft | null;
  loadingMessage: string;
  formError: string | null;
  missingAnswers: Record<string, string>;
  amountResolution: ReportedAmountResolution | null;
  onReportMethodChange: (method: ReportMethod) => void;
  onNarrativeChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRecordAgain: () => void;
  onScreenshotsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOrganizeReport: () => void;
  onUseDemoIncident: () => void;
  onMissingAnswerChange: (
    field: MissingQuestion["field"],
    value: string,
  ) => void;
  onSaveMissingAnswer: (question: MissingQuestion, fallback?: string) => void;
  onDraftChange: (draft: IncidentDraft) => void;
  onReportedAmountSelect: (amount: number) => void;
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
  compact = false,
}: {
  screenshots: File[];
  isDemoIncident: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [activeDemoEvidence, setActiveDemoEvidence] = useState<(typeof DEMO_EVIDENCE)[number] | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activeDemoEvidence && dialog && !dialog.open) dialog.showModal();
  }, [activeDemoEvidence]);

  function closeEvidence() {
    dialogRef.current?.close();
    setActiveDemoEvidence(null);
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
                aria-haspopup="dialog"
                aria-label={`${t("workspace.openEvidence")}: ${t(item.labelKey)}`}
                onClick={() => setActiveDemoEvidence(item)}
              >
                <Image src={item.src} alt="" width={72} height={54} sizes="72px" />
                <span className="evidence-row-copy">
                  <strong>{t(item.labelKey)}</strong>
                  <small>{t(item.typeKey)}</small>
                </span>
                <span className="evidence-row-action">{t("workspace.view")}</span>
              </button>
            </li>
          ))
        : screenshots.map((file) => (
            <li
              className="report-source-file-row"
              key={`${file.name}-${file.lastModified}`}
            >
              <span>{file.name}</span>
              <strong>{t("workspace.added")}</strong>
            </li>
          ))}
    </ul>
  );

  const preview = activeDemoEvidence ? (
    <dialog
      ref={dialogRef}
      className="evidence-preview-dialog"
      aria-label={t(activeDemoEvidence.labelKey)}
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
          <small>{t("workspace.syntheticEvidence")}</small>
          <strong>{t(activeDemoEvidence.labelKey)}</strong>
        </div>
        <button type="button" className="secondary-button" onClick={closeEvidence} autoFocus>
          {t("workspace.closeEvidence")}
        </button>
      </div>
      <Image
        src={activeDemoEvidence.src}
        alt={t(activeDemoEvidence.altKey)}
        width={520}
        height={620}
        sizes="(max-width: 600px) calc(100vw - 40px), 520px"
      />
    </dialog>
  ) : null;

  if (compact) {
    return (
      <details className="report-source-block compact-source-disclosure">
        <summary>
          <span>{t("workspace.evidence")}</span>
          <strong>{evidenceCount} {t("workspace.screenshots")}</strong>
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

function SourceSummary({
  narrative,
  transcription,
  screenshots,
  isDemoIncident,
  recordingSeconds,
  demoNarrationLanguage,
  onDemoNarrationLanguageChange,
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
> & { compact?: boolean }) {
  const { locale, t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const showWrittenStatement =
    narrative.trim() && (isDemoIncident || !transcription);
  const displayedNarrative = isDemoIncident
    ? (locale === "hi"
        ? "मुझे एसबीआई केवाईसी अपडेट करने का संदेश मिला। मैंने निर्देश माने और बाद में मेरे खाते से ₹40,000 ट्रांसफर हो गए।"
        : narrative)
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
    <div className="report-sources" aria-label={t("workspace.informationShared")}>
      {isDemoIncident ? (
        <div className="report-source-block demo-narration-block">
          <div className="demo-narration-heading">
            <div>
              <h3>{t("workspace.sampleNarration")}</h3>
              <p className="source-meta">
                {demoNarration.nativeLabel} · {t("workspace.approxSeconds", { seconds: demoNarration.durationSeconds })}
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
              {isPlaying ? t("workspace.pauseSample") : t("workspace.playSample")}
              <span className="audio-progress" aria-hidden="true">
                {formatPlayback(playbackSeconds)} / {formatPlayback(demoNarration.durationSeconds)}
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
            onTimeUpdate={(event) => setPlaybackSeconds(event.currentTarget.currentTime)}
          />
          <p className="demo-language-label">{t("workspace.sampleLanguage")}</p>
          <div className="demo-narration-languages" role="group" aria-label={t("workspace.changeLanguage")}>
            {(Object.keys(DEMO_NARRATIONS) as DemoNarrationLanguage[]).map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={demoNarrationLanguage === language}
                onClick={() => onDemoNarrationLanguageChange(language)}
              >
                {DEMO_NARRATIONS[language].nativeLabel}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {transcription ? (
        compact ? (
          <details className="report-source-block compact-source-disclosure transcript-result">
            <summary>
              <span>
                {isDemoIncident ? t("workspace.transcript") : `${languageLabel(transcription.languageCode)} ${locale === "hi" ? "बयान" : "voice statement"}`}
              </span>
              <strong>{t("workspace.approxSeconds", { seconds: recordingSeconds || 1 })}</strong>
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
            <h3>{isDemoIncident ? t("workspace.transcript") : t("workspace.yourStatement")}</h3>
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
        {props.mode === "REVIEW" ? t("workspace.yourInformation") : t("workspace.tell")}
      </h1>
      <p className="pane-intro">
        {props.mode === "REVIEW"
          ? t("workspace.reviewIntro")
          : t("workspace.intro")}
      </p>

      {props.mode !== "REVIEW" && props.experienceMode !== "DEMO_CASE" ? (
        <>
          <div
            className="report-tabs"
            role="group"
            aria-label={t("workspace.shareWays")}
          >
            {(
              [
                ["SPEAK", t("workspace.speak")],
                ["UPLOAD", t("workspace.upload")],
                ["TYPE", t("workspace.type")],
              ] as const
            ).map(([method, label]) => (
              <button
                key={method}
                id={`report-tab-${method.toLowerCase()}`}
                className="report-tab"
                type="button"
                aria-pressed={props.reportMethod === method}
                disabled={processing}
                onClick={() => props.onReportMethodChange(method)}
              >
                {label}
              </button>
            ))}
          </div>

          {props.reportMethod === "SPEAK" ? (
            <section
              className="report-method-panel"
              aria-labelledby="speak-heading"
            >
              <h2 id="speak-heading">{t("workspace.speakLanguage")}</h2>
              <p>{t("workspace.describeNaturally")}</p>
              {!props.hasAudio ? (
                <div className="recording-control">
                  <button
                    className={
                      props.isRecording ? "secondary-button" : "primary-button"
                    }
                    type="button"
                    disabled={processing}
                    onClick={
                      props.isRecording
                        ? props.onStopRecording
                        : props.onStartRecording
                    }
                  >
                    {props.isRecording ? t("workspace.stopRecording") : t("workspace.startRecording")}
                  </button>
                  <span className="recording-time" aria-live="polite">
                    {Math.floor(props.recordingSeconds / 60)}:
                    {String(props.recordingSeconds % 60).padStart(2, "0")} /
                    2:00
                  </span>
                  {props.isRecording && props.recordingSeconds >= 105 ? (
                    <span className="recording-remaining">
                      {120 - props.recordingSeconds} seconds remaining
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="source-actions">
                  <button
                    className="text-button"
                    type="button"
                    disabled={processing}
                    onClick={props.onRecordAgain}
                  >
                    {t("workspace.recordAgain")}
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    disabled={processing}
                    onClick={() => props.onReportMethodChange("UPLOAD")}
                  >
                    {t("workspace.addEvidence")}
                  </button>
                </div>
              )}
              <button
                className="text-button demo-incident-button"
                type="button"
                disabled={processing}
                onClick={props.onUseDemoIncident}
              >
                {t("workspace.useDemo")}
              </button>
            </section>
          ) : null}

          {props.reportMethod === "UPLOAD" ? (
            <section
              className="report-method-panel"
              aria-labelledby="upload-heading"
            >
              <h2 id="upload-heading">{t("workspace.addEvidence")}</h2>
              <p>
                {t("workspace.upload")}: {t("workspace.evidence")}
              </p>
              <label className="file-button" htmlFor="incident-screenshots">
                {t("workspace.chooseScreenshots")}
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
              <p className="form-hint">{t("workspace.maxImages")}</p>
              <div className="safety-notice">
                <p>
                  {t("workspace.safety")}
                </p>
              </div>
            </section>
          ) : null}

          {props.reportMethod === "TYPE" ? (
            <section
              className="report-method-panel"
              aria-labelledby="type-heading"
            >
              <h2 id="type-heading">{t("workspace.describe")}</h2>
              <label className="visually-hidden" htmlFor="incident-narrative">
                {t("workspace.whatHappened")}
              </label>
              <textarea
                id="incident-narrative"
                rows={7}
                value={props.narrative}
                disabled={processing}
                onChange={(event) =>
                  props.onNarrativeChange(event.target.value)
                }
                placeholder={t("workspace.placeholder")}
                maxLength={8000}
              />
              <button
                className="primary-button"
                type="button"
                disabled={processing || !props.narrative.trim()}
                onClick={props.onOrganizeReport}
              >
                {t("workspace.organise")}
              </button>
            </section>
          ) : null}
        </>
      ) : props.mode === "REVIEW" ? (
        <p className="review-source-intro">
          {t("workspace.reviewIntro")}
        </p>
      ) : null}

      <SourceSummary
        narrative={props.narrative}
        transcription={props.transcription}
        screenshots={props.screenshots}
        isDemoIncident={props.isDemoIncident}
        recordingSeconds={props.recordingSeconds}
        demoNarrationLanguage={props.demoNarrationLanguage}
        onDemoNarrationLanguageChange={props.onDemoNarrationLanguageChange}
        compact={props.mode === "REVIEW"}
      />
      {props.mode === "REVIEW" && props.identityDocumentProvided ? (
        <details className="report-source-block compact-source-disclosure identity-document-disclosure">
          <summary>
            <span>{t("field.identityDocument")}</span>
            <strong>✓ {t("field.syntheticIdentity")}</strong>
          </summary>
          <Image
            src="/demo/profile/synthetic-national-id.png"
            alt={t("field.syntheticIdentity")}
            width={480}
            height={480}
            sizes="(max-width: 800px) calc(100vw - 72px), 380px"
          />
          <p className="form-hint">{t("field.fromProfile")}</p>
        </details>
      ) : null}

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
  if (!question) return null;

  if (question.field === "incidentDateYear") {
    const suggestedYear = new Date().getFullYear();
    return (
      <div
        className="report-missing-editor"
        data-missing-field={question.field}
      >
        <p className="partial-date-value">{field.value}</p>
        <p className="report-field-state">{locale === "hi" ? "पुष्टि जरूरी है" : "Needs confirmation"}</p>
        <p>
          {locale === "hi" ? `क्या यह ${field.value} ${suggestedYear} की घटना है?` : `Was this ${field.value} ${suggestedYear}?`}
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
            <label htmlFor="missing-incidentDateYear">{locale === "hi" ? "साल" : "Year"}</label>
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

  return (
    <div className="report-missing-editor" data-missing-field={question.field}>
      <label htmlFor={`missing-${question.field}`}>
        {locale === "hi"
          ? ({
              incidentDate: "यह घटना कब हुई?",
              incidentDateYear: "घटना की तारीख का साल पक्का करें",
              incidentApproximateTime: "यह लगभग कितने बजे हुआ?",
              institution: "आपने किस बैंक या भुगतान ऐप का उपयोग किया?",
              transactionIdOrUtr: "क्या आपके पास लेन-देन संदर्भ संख्या है?",
              occurredOn: "बातचीत या घटना कहाँ हुई?",
            } as const)[question.field]
          : question.question}
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
            {locale === "hi" ? "मेरे पास यह जानकारी नहीं है" : "I don’t have this"}
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
  categoryEditing,
  onCategoryEdit,
  narrativeEditing,
  onNarrativeEdit,
}: {
  field: ReportFieldView;
  missingValue: string;
  onMissingValueChange: (value: string) => void;
  onSaveMissing: (fallback?: string) => void;
  categoryEditing: boolean;
  onCategoryEdit: () => void;
  narrativeEditing: boolean;
  onNarrativeEdit: () => void;
}) {
  const { t } = useI18n();
  const showSource = SOURCE_VISIBLE_FIELD_IDS.has(field.id);
  if (field.missingQuestion) {
    const isPartialDate = field.missingQuestion.field === "incidentDateYear";
    return (
      <div className="report-field report-field-missing" data-field-id={field.id}>
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
    <div className="report-field" data-field-id={field.id}>
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
      {field.id === "category" && !categoryEditing ? (
        <button
          className="text-button field-edit-button"
          type="button"
          onClick={onCategoryEdit}
        >
          {t("field.change")}
        </button>
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

function CategoryEditor({
  draft,
  onSave,
  onCancel,
}: {
  draft: IncidentDraft;
  onSave: (category: string, subcategory: string) => void;
  onCancel: () => void;
}) {
  const { locale, t } = useI18n();
  const [category, setCategory] = useState(
    draft.officialMapping.categoryLabel ?? "",
  );
  const [subcategory, setSubcategory] = useState(
    draft.officialMapping.subCategoryLabel ?? "",
  );

  return (
    <div className="report-inline-edit" aria-label={locale === "hi" ? "रिपोर्ट की श्रेणी बदलें" : "Change reporting category"}>
      <div className="form-field">
        <label htmlFor="category-label">{t("field.category")}</label>
        <input
          id="category-label"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>
      <div className="form-field">
        <label htmlFor="subcategory-label">{t("field.subcategory")}</label>
        <input
          id="subcategory-label"
          value={subcategory}
          onChange={(event) => setSubcategory(event.target.value)}
        />
      </div>
      <div className="inline-field-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onSave(category, subcategory)}
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
}: {
  group: ReportGroupView;
  draft: IncidentDraft;
  missingAnswers: Record<string, string>;
  onMissingAnswerChange: ReportWorkspaceProps["onMissingAnswerChange"];
  onSaveMissingAnswer: ReportWorkspaceProps["onSaveMissingAnswer"];
  onDraftChange: ReportWorkspaceProps["onDraftChange"];
}) {
  const { locale, t } = useI18n();
  const [categoryEditing, setCategoryEditing] = useState(false);
  const [narrativeEditing, setNarrativeEditing] = useState(false);

  const renderField = (item: ReportFieldView) => (
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
      categoryEditing={categoryEditing}
      onCategoryEdit={() => setCategoryEditing(true)}
      narrativeEditing={narrativeEditing}
      onNarrativeEdit={() => setNarrativeEditing(true)}
    />
  );

  const allFields = group.sections.flatMap((section) => section.fields);
  const getField = (id: string) => allFields.find((field) => field.id === id);

  const editors = (
    <>
      {categoryEditing && group.id === "INCIDENT" ? (
        <CategoryEditor
          draft={draft}
          onCancel={() => setCategoryEditing(false)}
          onSave={(categoryLabel, subCategoryLabel) => {
            onDraftChange({
              ...draft,
              officialMapping: {
                ...draft.officialMapping,
                categoryLabel,
                subCategoryLabel,
              },
            });
            setCategoryEditing(false);
          }}
        />
      ) : null}

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
      draft.transactions.reduce((total, transaction) => total + (transaction.amount ?? 0), 0);
    const summaryIds = new Set(["subcategory", "incident-date", "incident-time", "occurred-on", "incident-description"]);
    const supportingFields = allFields.filter((field) => !summaryIds.has(field.id));

    return (
      <div className="report-group report-group-incident" data-group-id={group.id}>
        {editors}
        <section className="incident-overview" aria-label={group.label}>
          <h3>{subcategory?.value}</h3>
          <div className="incident-overview-meta">
            {reportedAmount > 0 ? (
              <strong>{formatCurrency(reportedAmount)} {locale === "hi" ? "का नुकसान" : "lost"}</strong>
            ) : null}
            <span>{channel?.value}</span>
            <span>{date?.value}{time?.value ? ` · ${time.value}` : ""}</span>
          </div>
        </section>
        {narrative ? (
          <section className="incident-description-block">
            <div className="section-heading-with-action">
              <h3>{narrative.label}</h3>
              {!narrativeEditing ? (
                <button className="text-button" type="button" onClick={() => setNarrativeEditing(true)}>
                  {t("field.edit")} →
                </button>
              ) : null}
            </div>
            {!narrativeEditing ? <p>{narrative.value}</p> : null}
          </section>
        ) : null}
        {allFields.filter((field) => field.missingQuestion).map(renderField)}
        <details className="report-summary-disclosure">
          <summary>{t("workspace.officialDetails")} <span aria-hidden="true">→</span></summary>
          <div className="report-summary-disclosure-content">
            {supportingFields.filter((field) => !field.missingQuestion).map(renderField)}
          </div>
        </details>
      </div>
    );
  }

  if (group.id === "TRANSACTIONS") {
    const transactionSections = group.sections.filter((section) => section.id.startsWith("transaction-") && section.id !== "transaction-summary");
    const totalField = group.sections.find((section) => section.id === "transaction-summary")?.fields[0];
    return (
      <div className="report-group report-group-transactions" data-group-id={group.id}>
        {transactionSections.length > 1 && totalField ? renderField(totalField) : null}
        {transactionSections.map((section, index) => {
          const bySuffix = (suffix: string) => section.fields.find((field) => field.id.endsWith(suffix));
          const amount = bySuffix("-amount");
          const institution = bySuffix("-institution");
          const date = bySuffix("-date");
          const time = bySuffix("-time");
          const secondary = section.fields.filter((field) =>
            ![amount?.id, institution?.id, date?.id, time?.id].includes(field.id),
          );
          return (
            <section className="transaction-card" key={section.id}>
              <p className="transaction-label">{section.title ?? t("field.transaction", { number: index + 1 })}</p>
              <strong className="transaction-amount">{amount?.value}</strong>
              <p className="transaction-institution">{institution?.value}</p>
              <p className="transaction-date">{date?.value}{time?.value ? ` · ${time.value}` : ""}</p>
              <div className="transaction-secondary-fields">{secondary.map(renderField)}</div>
              {institution?.missingQuestion ? renderField(institution) : null}
            </section>
          );
        })}
      </div>
    );
  }

  if (group.id === "EVIDENCE_SUSPECT") {
    const evidenceFields = group.sections.find((section) => section.id === "evidence")?.fields ?? [];
    const evidenceFacts = group.sections.find((section) => section.id === "evidence-facts")?.fields ?? [];
    const suspectFields = (group.sections.find((section) => section.id === "suspect")?.fields ?? [])
      .filter((field) => field.state !== "NOT_PROVIDED_OPTIONAL");
    const claimedIssue = evidenceFacts.find((field) => /KYC|केवाईसी/i.test(field.value));
    const transactionFound = evidenceFacts.find((field) => field.value.includes("₹40,000"));
    return (
      <div className="report-group report-group-evidence" data-group-id={group.id}>
        <section className="evidence-prepared-summary">
          <p className="report-field-label">{t("field.evidenceSupplied")}</p>
          <strong>{t("workspace.evidenceItems", { count: evidenceFields.length })}</strong>
        </section>
        {suspectFields.length > 0 ? (
          <section className="information-found">
            <h3>{t("workspace.informationFound")}</h3>
            <div className="information-found-grid">
              {suspectFields.map(renderField)}
              {claimedIssue ? (
                <div className="report-field">
                  <p className="report-field-label">{t("workspace.claimedIssue")}</p>
                  <p className="report-field-value">{claimedIssue.value} <span className="ready-mark">✓</span></p>
                </div>
              ) : null}
              {transactionFound ? (
                <div className="report-field">
                  <p className="report-field-label">{t("workspace.transactionFound")}</p>
                  <p className="report-field-value">{transactionFound.value} <span className="ready-mark">✓</span></p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        <details className="report-summary-disclosure">
          <summary>{t("workspace.fullEvidenceDetails")} <span aria-hidden="true">→</span></summary>
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
      <div className="report-group report-group-profile" data-group-id={group.id}>
        <section className="profile-primary-summary">
          <h3>{name?.value}</h3>
          <p>{name?.source}</p>
          <dl>
            <div><dt>{mobile?.label}</dt><dd>{mobile?.value}</dd></div>
            <div><dt>{state?.label}</dt><dd>{[state?.value, district?.value ?? city?.value].filter(Boolean).join(" · ")}</dd></div>
            <div><dt>{identity?.label}</dt><dd>{identity?.value} <span className="ready-mark">✓</span></dd></div>
          </dl>
        </section>
        <details className="report-summary-disclosure">
          <summary>{t("workspace.fullProfile")} <span aria-hidden="true">→</span></summary>
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
            <details key={section.id} className="report-field-section report-address-disclosure">
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
      ? ["Synthetic KYC message screenshot", "Synthetic bank transaction screenshot"]
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
    if (sources.includes("VOICE") || sources.includes("TYPED")) return t("field.fromStatement");
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
            <summary><span>{group.label}</span><strong aria-label={t("field.ready")}>✓</strong></summary>
            <div className="report-review-group-content">
              {group.sections
                .filter((section) => section.id !== "secondary-address" && section.id !== "evidence-facts")
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
          <span className="coverage-action">{t("workspace.coverageAction")}</span>
        </summary>
        <div className="field-coverage-content">
          <h3>{t("workspace.coverageHeading")}</h3>
          <p>{t("workspace.coverageIntro")}</p>
          <div className="field-coverage-table" role="table" aria-label={t("workspace.coverageHeading")}>
            <div className="field-coverage-header" role="row">
              <strong role="columnheader">{t("workspace.coverageInformation")}</strong>
              <strong role="columnheader">{t("workspace.coverageStatus")}</strong>
              <strong role="columnheader">{t("workspace.coverageSource")}</strong>
            </div>
            {NCRP_FIELD_DEFINITIONS
              .filter((definition) => definition.supportedInPrototype && definition.id !== "declaration.accepted")
              .filter((definition) => {
                const status = complaintRequiredFieldStatus(complaint, definition);
                return complaintFieldIsRequired(complaint, definition) || status !== "NOT_PROVIDED_OPTIONAL";
              })
              .map((definition) => {
                const status = complaintRequiredFieldStatus(complaint, definition);
                const path = definition.id.split(".");
                let current: unknown = complaint.groups;
                for (const part of path) {
                  if (current && typeof current === "object") {
                    current = (current as Record<string, unknown>)[part];
                  }
                }
                const sources = current && typeof current === "object" && "sources" in current
                  ? (current as { sources: string[] }).sources
                  : ["EVIDENCE"];
                return (
                  <div className="field-coverage-row" role="row" key={definition.id}>
                    <span role="cell">{t(definition.labelKey)}</span>
                    <span className={status === "NOT_PROVIDED_OPTIONAL" ? "coverage-optional" : undefined} role="cell">{
                      status === "READY" || status === "CONFIRMED"
                        ? t("field.ready")
                        : status === "NOT_PROVIDED_OPTIONAL"
                          ? t("field.notProvided")
                          : status === "CITIZEN_DOES_NOT_HAVE"
                            ? t("field.notAvailable")
                            : t("field.needsInput")
                    }</span>
                    <span role="cell">{sourceLabel(sources)}</span>
                  </div>
                );
              })}
          </div>
          <p className="source-note">{t("workspace.structureLabel")} · {complaint.schemaVersion}</p>
        </div>
      </details>
      <label className="report-declaration">
        <input
          type="checkbox"
          checked={declarationAccepted}
          onChange={(event) => setDeclarationAccepted(event.target.checked)}
        />
        <span>{t("workspace.declaration")}</span>
      </label>
      <div className="report-primary-actions">
        <button className="primary-button" type="button" disabled={!declarationAccepted} onClick={() => props.onSubmit(complaint)}>
          {t("workspace.submitSynthetic")}
        </button>
        <button className="text-button" type="button" onClick={props.onBackToEdit}>
          {t("workspace.backEdit")}
        </button>
      </div>
      {!declarationAccepted ? <p className="form-hint">{t("workspace.declarationRequired")}</p> : null}
    </>
  );
}

function ReportDetailsPane({
  onShowDetails,
  ...props
}: ReportWorkspaceProps & { onShowDetails: () => void }) {
  const { locale, t } = useI18n();
  const [activeGroup, setActiveGroup] = useState<ReportGroupId>("INCIDENT");
  const [pendingMissingFocus, setPendingMissingFocus] =
    useState<MissingQuestion["field"] | null>(null);
  const groups = props.draft
    ? deriveReportGroups(props.draft, {
        locale,
        profile: props.reporterProfile,
        identityDocumentProvided: props.identityDocumentProvided,
      })
    : [];
  const completion = props.draft ? deriveReportCompletion(props.draft) : null;
  const complaint = props.draft ? buildNcrpCompatibleComplaint({
    draft: props.draft,
    profile: props.reporterProfile,
    transcription: props.transcription,
    typedNarrative: props.narrative,
    isDemoIncident: props.isDemoIncident,
    screenshotNames: props.isDemoIncident
      ? ["Synthetic KYC message screenshot", "Synthetic bank transaction screenshot"]
      : props.screenshots.map((file) => file.name),
    identityDocumentProvided: props.identityDocumentProvided,
  }) : null;
  const contractMissing = complaint ? NCRP_FIELD_DEFINITIONS
    .filter((definition) => complaintFieldIsRequired(complaint, definition) && definition.id !== "declaration.accepted")
    .filter((definition) => {
      const status = complaintRequiredFieldStatus(complaint, definition);
      return status !== "READY" && status !== "CONFIRMED" && status !== "CITIZEN_DOES_NOT_HAVE";
    }) : [];
  const amountConflictMissing = Boolean(
    props.amountResolution?.hasConflict &&
    !props.amountResolution.selectedAmount,
  );
  const requiredMissing = contractMissing.length + (amountConflictMissing ? 1 : 0);
  const currentGroup =
    groups.find((group) => group.id === activeGroup) ?? groups[0];
  const firstMissingQuestion = props.draft
    ? deriveMissingQuestions(props.draft)[0]
    : null;
  const missingLabels: Record<MissingQuestion["field"], string> = {
    incidentDate: t("field.incidentDate"),
    incidentDateYear: locale === "hi" ? "घटना की तारीख का साल" : "Incident date year",
    incidentApproximateTime: t("field.approxTime"),
    occurredOn: t("field.occurredOn"),
    institution: t("field.institution"),
    transactionIdOrUtr: t("field.transactionReference"),
  };
  const evidenceMissing = contractMissing.some((definition) => definition.id === "evidence.supportingEvidence");
  const firstMissingLabel = amountConflictMissing
    ? (locale === "hi" ? "रिपोर्ट की राशि चुनें" : "Reported amount choice")
    : firstMissingQuestion
      ? missingLabels[firstMissingQuestion.field]
      : evidenceMissing
        ? t("field.evidenceSupplied")
      : null;
  const missingActionLabel = amountConflictMissing
    ? (locale === "hi" ? "रिपोर्ट की राशि चुनें" : "Choose report amount")
    : firstMissingQuestion?.field === "incidentDateYear"
      ? (locale === "hi" ? "घटना की तारीख पक्की करें" : "Confirm incident date")
      : firstMissingLabel
        ? (locale === "hi" ? `${firstMissingLabel} जोड़ें` : `Add ${firstMissingLabel.toLowerCase()}`)
        : (locale === "hi" ? "बाकी जानकारी पर जाएँ" : "Go to missing detail");

  useEffect(() => {
    if (!pendingMissingFocus) return;
    const editor = document.querySelector<HTMLElement>(
      `[data-missing-field="${pendingMissingFocus}"]`,
    );
    if (!editor) return;
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
    editor.querySelector<HTMLElement>("input, button")?.focus();
    setPendingMissingFocus(null);
  }, [activeGroup, pendingMissingFocus]);

  function goToMissingDetail() {
    if (amountConflictMissing) {
      onShowDetails();
      document
        .querySelector<HTMLElement>("[data-amount-conflict] button")
        ?.focus();
      document
        .querySelector<HTMLElement>("[data-amount-conflict]")
        ?.scrollIntoView({ block: "center" });
      return;
    }
    if (evidenceMissing && !firstMissingQuestion) {
      props.onReportMethodChange("UPLOAD");
      document.querySelector<HTMLElement>("#report-tab-upload")?.focus();
      return;
    }
    if (!firstMissingQuestion) return;
    onShowDetails();
    const groupByField: Record<MissingQuestion["field"], ReportGroupId> = {
      incidentDate: "INCIDENT",
      incidentDateYear: "INCIDENT",
      incidentApproximateTime: "INCIDENT",
      occurredOn: "INCIDENT",
      institution: "TRANSACTIONS",
      transactionIdOrUtr: "TRANSACTIONS",
    };
    setActiveGroup(groupByField[firstMissingQuestion.field]);
    setPendingMissingFocus(firstMissingQuestion.field);
  }

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
        <h2 id="report-details-heading">{t("workspace.reportInfo")}</h2>
        <p>{t("workspace.reportInfoSupport")}</p>
      </div>

      {props.mode === "INPUT" && !props.draft ? (
        <div className="report-empty-state">
          <p>
            <strong>
              {t("workspace.emptyStrong")}
            </strong>
          </p>
          <p>{t("workspace.emptyBody")}</p>
        </div>
      ) : null}

      {props.mode === "PROCESSING" ? (
        <div
          className="report-processing-state"
          role="status"
          aria-live="polite"
        >
          <span className="loading-marker" aria-hidden="true" />
          <p>
            <strong>{props.experienceMode === "DEMO_CASE" ? t("workspace.organisingSample") : t(props.loadingMessage)}</strong>
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
          <p>
            {props.formError ??
              t("workspace.inputPreserved")}
          </p>
          <div className="entry-actions">
            <button
              className="primary-button"
              type="button"
              onClick={props.onOrganizeReport}
            >
              {t("workspace.tryAgain")}
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

      {props.mode === "READY" && props.draft && completion && currentGroup ? (
        <>
          <div className="report-completion" role="status" aria-live="polite">
            <p>
              <strong>
                {requiredMissing === 0
                  ? t("workspace.ready")
                  : t("workspace.detailNeeded", { count: requiredMissing })}
              </strong>
            </p>
            {requiredMissing === 0 ? <p>{t("workspace.preparedReuse")}</p> : null}
            {requiredMissing > 0 ? (
              <>
                {firstMissingLabel ? <p>{firstMissingLabel}</p> : null}
                <button
                  className="text-button missing-detail-link"
                  type="button"
                  onClick={goToMissingDetail}
                >
                  {missingActionLabel} →
                </button>
              </>
            ) : null}
          </div>

          <div
            className="report-detail-tabs"
            role="group"
            aria-label={t("workspace.reportInfo")}
          >
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={group.id === currentGroup.id}
                onClick={() => setActiveGroup(group.id)}
              >
                <span>{group.label}</span>
                <small>
                  {group.missingCount > 0
                      ? `${group.missingCount} ${t("workspace.actionNeeded")}`
                      : `✓ ${t("workspace.complete")}`}
                </small>
              </button>
            ))}
          </div>

          <ReportGroup
            group={currentGroup}
            draft={props.draft}
            missingAnswers={props.missingAnswers}
            onMissingAnswerChange={props.onMissingAnswerChange}
            onSaveMissingAnswer={props.onSaveMissingAnswer}
            onDraftChange={props.onDraftChange}
          />

          {props.amountResolution?.hasConflict ? (
            <section
              className="amount-conflict"
              data-amount-conflict
              aria-labelledby="amount-conflict-heading"
            >
              <h3 id="amount-conflict-heading">
                {locale === "hi" ? "दो अलग राशियाँ मिलीं" : "We found two different amounts"}
              </h3>
              <dl>
                <div>
                  <dt>{locale === "hi" ? "आपके बयान से" : "From your statement"}</dt>
                  <dd>
                    {formatCurrency(
                      props.amountResolution.statementAmount ?? 0,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{locale === "hi" ? "लेन-देन से" : "From your transactions"}</dt>
                  <dd>
                    {formatCurrency(
                      props.amountResolution.transactionAmount ?? 0,
                    )}
                  </dd>
                </div>
              </dl>
              <p>{locale === "hi" ? "इस रिपोर्ट में कौन-सी राशि उपयोग की जाए?" : "Which amount should be used for this report?"}</p>
              <div className="inline-field-actions">
                {[
                  props.amountResolution.statementAmount,
                  props.amountResolution.transactionAmount,
                ]
                  .filter((amount): amount is number => amount !== null)
                  .map((amount) => (
                    <button
                      className="secondary-button"
                      type="button"
                      key={amount}
                      aria-pressed={
                        props.amountResolution?.selectedAmount === amount
                      }
                      onClick={() => props.onReportedAmountSelect(amount)}
                    >
                      {locale === "hi" ? `${formatCurrency(amount)} उपयोग करें` : `Use ${formatCurrency(amount)}`}
                    </button>
                  ))}
              </div>
            </section>
          ) : null}

          <div className="report-primary-actions">
            <button
              className="primary-button"
              type="button"
              disabled={requiredMissing > 0}
              onClick={props.onReview}
            >
              {t("workspace.reviewContinue")}
            </button>
            {requiredMissing > 0 ? (
              <div className="missing-review-message">
                <p>
                  {t("workspace.detailNeeded", { count: requiredMissing })}
                  {firstMissingLabel ? `: ${firstMissingLabel}` : ""}.
                </p>
                <button
                  className="text-button"
                  type="button"
                  onClick={goToMissingDetail}
                >
                  {missingActionLabel}
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function ReportWorkspace(props: ReportWorkspaceProps) {
  const { t } = useI18n();
  const [mobilePane, setMobilePane] = useState<"SHARED" | "DETAILS">("SHARED");
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    if (props.draft && props.mode === "READY") {
      setMobilePane("DETAILS");
      setShowSavedMessage(true);
    } else if (
      props.mode === "PROCESSING" ||
      props.mode === "ERROR" ||
      props.mode === "REVIEW"
    ) {
      setMobilePane("DETAILS");
      setShowSavedMessage(false);
    }
  }, [props.draft, props.mode]);

  return (
    <section
      className="report-workspace-stage section-pad"
      data-journey-focus
      tabIndex={-1}
    >
      <div className="report-workspace-shell">
        <JourneyProgress current={props.mode === "REVIEW" ? "RESTORE" : "REPORT"} />
        <div
          className="mobile-report-switch"
          role="group"
          aria-label={t("workspace.reportingView")}
        >
          <button
            type="button"
            aria-pressed={mobilePane === "SHARED"}
            onClick={() => {
              setMobilePane("SHARED");
              setShowSavedMessage(false);
            }}
          >
            {t("workspace.whatShared")}
          </button>
          <button
            type="button"
            aria-pressed={mobilePane === "DETAILS"}
            onClick={() => setMobilePane("DETAILS")}
          >
            {t("workspace.reportDetails")}
          </button>
        </div>
        {showSavedMessage && mobilePane === "DETAILS" ? (
          <p className="mobile-saved-message" role="status">
            {t("workspace.saved")}
          </p>
        ) : null}
        <div
          className={`report-workspace report-workspace-${props.mode.toLowerCase()} mobile-pane-${mobilePane.toLowerCase()}`}
        >
          <ReportInputPane {...props} />
          <ReportDetailsPane
            {...props}
            onShowDetails={() => {
              setMobilePane("DETAILS");
              setShowSavedMessage(false);
            }}
          />
        </div>
      </div>
    </section>
  );
}
