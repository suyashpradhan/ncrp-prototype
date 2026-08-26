"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import type { MissingQuestion } from "../../incident/missing-information";
import type { IncidentDraft, TranscriptionResult } from "../../incident/schema";
import {
  deriveReportCompletion,
  deriveReportGroups,
  type ReportFieldView,
  type ReportGroupId,
  type ReportGroupView,
} from "../../presentation/report-details";
import { JourneyProgress } from "./journey-progress";

export type ReportWorkspaceMode = "INPUT" | "PROCESSING" | "READY" | "ERROR" | "REVIEW";
export type ReportMethod = "SPEAK" | "UPLOAD" | "TYPE";

const DEMO_EVIDENCE = [
  {
    src: "/demo/whatsapp-investment-scam.png",
    alt: "Synthetic WhatsApp investment conversation",
    label: "WhatsApp conversation",
  },
  {
    src: "/demo/upi-payments.png",
    alt: "Synthetic UPI payment records",
    label: "Payment confirmation",
  },
] as const;

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
  draft: IncidentDraft | null;
  loadingMessage: string;
  formError: string | null;
  missingAnswers: Record<string, string>;
  onReportMethodChange: (method: ReportMethod) => void;
  onNarrativeChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRecordAgain: () => void;
  onScreenshotsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOrganizeReport: () => void;
  onUseDemoIncident: () => void;
  onMissingAnswerChange: (field: MissingQuestion["field"], value: string) => void;
  onSaveMissingAnswer: (question: MissingQuestion, fallback?: string) => void;
  onDraftChange: (draft: IncidentDraft) => void;
  onReview: () => void;
  onBackToEdit: () => void;
  onSubmit: () => void;
};

function languageLabel(languageCode: string): string {
  const labels: Record<string, string> = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "kn-IN": "Kannada",
    "mr-IN": "Marathi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
  };
  return labels[languageCode] ?? "Original language";
}

function EvidenceRows({
  screenshots,
  isDemoIncident,
}: {
  screenshots: File[];
  isDemoIncident: boolean;
}) {
  if (!isDemoIncident && screenshots.length === 0) return null;

  return (
    <div className="report-source-block">
      <h3>Evidence added</h3>
      <ul className="report-source-files">
        {isDemoIncident
          ? DEMO_EVIDENCE.map((item) => (
              <li className="report-source-file-preview" key={item.src}>
                <details>
                  <summary><span>{item.label}</span><strong>Added</strong></summary>
                  <Image src={item.src} alt={item.alt} width={320} height={320} sizes="280px" />
                </details>
              </li>
            ))
          : screenshots.map((file) => (
              <li className="report-source-file-row" key={`${file.name}-${file.lastModified}`}>
                <span>{file.name}</span><strong>Added</strong>
              </li>
            ))}
      </ul>
    </div>
  );
}

function SourceSummary({
  narrative,
  transcription,
  screenshots,
  isDemoIncident,
  recordingSeconds,
}: Pick<
  ReportWorkspaceProps,
  "narrative" | "transcription" | "screenshots" | "isDemoIncident" | "recordingSeconds"
>) {
  const showWrittenStatement = narrative.trim() && (isDemoIncident || !transcription);

  return (
    <div className="report-sources" aria-label="Information you shared">
      {transcription ? (
        <div className="report-source-block transcript-result">
          <h3>Your statement</h3>
          <p className="source-transcript">{transcription.originalTranscript}</p>
          <p className="source-meta">
            {languageLabel(transcription.languageCode)} · {recordingSeconds || 1} seconds
          </p>
          {transcription.englishTranscript !== transcription.originalTranscript ? (
            <details className="translation-disclosure">
              <summary>View English translation</summary>
              <p>{transcription.englishTranscript}</p>
            </details>
          ) : null}
        </div>
      ) : null}

      {showWrittenStatement ? (
        <div className="report-source-block">
          <h3>{isDemoIncident ? "Synthetic citizen statement" : "Your written statement"}</h3>
          <p className="source-transcript">{narrative}</p>
        </div>
      ) : null}

      <EvidenceRows screenshots={screenshots} isDemoIncident={isDemoIncident} />
    </div>
  );
}

function ReportInputPane(props: ReportWorkspaceProps) {
  const processing = props.mode === "PROCESSING";

  return (
    <section className="report-input-pane" aria-labelledby="journey-stage-heading">
      <h1 id="journey-stage-heading" tabIndex={-1}>
        {props.mode === "REVIEW" ? "Your information" : "Tell us what happened"}
      </h1>
      <p className="pane-intro">
        {props.mode === "REVIEW"
          ? "The statement and evidence used to prepare this report."
          : "Speak, upload evidence or type. Use whichever is easiest."}
      </p>

      {props.mode !== "REVIEW" ? (
        <>
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
                aria-pressed={props.reportMethod === method}
                disabled={processing}
                onClick={() => props.onReportMethodChange(method)}
              >
                {label}
              </button>
            ))}
          </div>

          {props.reportMethod === "SPEAK" ? (
            <section className="report-method-panel" aria-labelledby="speak-heading">
              <h2 id="speak-heading">Speak in your language</h2>
              <p>Describe what happened naturally.</p>
              {!props.hasAudio ? (
                <div className="recording-control">
                  <button
                    className={props.isRecording ? "secondary-button" : "primary-button"}
                    type="button"
                    disabled={processing}
                    onClick={props.isRecording ? props.onStopRecording : props.onStartRecording}
                  >
                    {props.isRecording ? "Stop recording" : "Start recording"}
                  </button>
                  <span className="recording-time" aria-live="polite">
                    00:{String(props.recordingSeconds).padStart(2, "0")}
                  </span>
                </div>
              ) : (
                <div className="source-actions">
                  <button className="text-button" type="button" disabled={processing} onClick={props.onRecordAgain}>Record again</button>
                  <button className="text-button" type="button" disabled={processing} onClick={() => props.onReportMethodChange("UPLOAD")}>Add evidence</button>
                </div>
              )}
              <button className="text-button demo-incident-button" type="button" disabled={processing} onClick={props.onUseDemoIncident}>Use demo incident</button>
            </section>
          ) : null}

          {props.reportMethod === "UPLOAD" ? (
            <section className="report-method-panel" aria-labelledby="upload-heading">
              <h2 id="upload-heading">Add evidence</h2>
              <p>Add screenshots of chats, transactions or payment confirmations.</p>
              <label className="file-button" htmlFor="incident-screenshots">Choose screenshots</label>
              <input
                id="incident-screenshots"
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={processing}
                onChange={props.onScreenshotsChange}
              />
              <p className="form-hint">Maximum 2 images.</p>
              <div className="safety-notice">
                <p>Use test information only. Do not upload OTPs, PINs, passwords or CVVs.</p>
              </div>
            </section>
          ) : null}

          {props.reportMethod === "TYPE" ? (
            <section className="report-method-panel" aria-labelledby="type-heading">
              <h2 id="type-heading">Describe what happened</h2>
              <label className="visually-hidden" htmlFor="incident-narrative">What happened?</label>
              <textarea
                id="incident-narrative"
                rows={7}
                value={props.narrative}
                disabled={processing}
                onChange={(event) => props.onNarrativeChange(event.target.value)}
                placeholder="I received a WhatsApp message about an investment opportunity…"
                maxLength={8000}
              />
              <button
                className="primary-button"
                type="button"
                disabled={processing || !props.narrative.trim()}
                onClick={props.onOrganizeReport}
              >
                Organise report
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <p className="review-source-intro">This is the information used to prepare the report.</p>
      )}

      <SourceSummary
        narrative={props.narrative}
        transcription={props.transcription}
        screenshots={props.screenshots}
        isDemoIncident={props.isDemoIncident}
        recordingSeconds={props.recordingSeconds}
      />

      {props.formError && props.mode !== "ERROR" ? (
        <p className="form-error" role="alert">{props.formError}</p>
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
  const question = field.missingQuestion;
  if (!question) return null;

  return (
    <div className="report-missing-editor">
      <label htmlFor={`missing-${question.field}`}>{question.question}</label>
      {field.helpText ? <p className="report-field-help">{field.helpText}</p> : null}
      <input
        id={`missing-${question.field}`}
        type={question.inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="inline-field-actions">
        <button className="secondary-button" type="button" onClick={() => onSave()}>Save</button>
        {question.field === "transactionIdOrUtr" ? (
          <button className="text-button" type="button" onClick={() => onSave("I don't have this information")}>I don’t have this</button>
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
  if (field.missingQuestion) {
    return (
      <div className="report-field report-field-missing">
        <p className="report-field-label">{field.label}</p>
        <p className="report-field-state">Needs your input</p>
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
    <div className="report-field">
      <p className="report-field-label">{field.label}</p>
      <p className="report-field-value">
        {field.value}
        {field.state === "READY" ? <span className="ready-mark" aria-label="Ready">✓</span> : null}
      </p>
      {field.helpText ? <p className="report-field-help">{field.helpText}</p> : null}
      {field.source ? <p className="report-field-source">{field.source}</p> : null}
      {field.id === "category" && !categoryEditing ? (
        <button className="text-button field-edit-button" type="button" onClick={onCategoryEdit}>Change</button>
      ) : null}
      {field.kind === "NARRATIVE" && !narrativeEditing ? (
        <button className="text-button field-edit-button" type="button" onClick={onNarrativeEdit}>Edit</button>
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
  const [category, setCategory] = useState(draft.officialMapping.categoryLabel ?? "");
  const [subcategory, setSubcategory] = useState(draft.officialMapping.subCategoryLabel ?? "");

  return (
    <div className="report-inline-edit" aria-label="Change reporting category">
      <div className="form-field">
        <label htmlFor="category-label">Category of complaint</label>
        <input id="category-label" value={category} onChange={(event) => setCategory(event.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="subcategory-label">Sub-category</label>
        <input id="subcategory-label" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} />
      </div>
      <div className="inline-field-actions">
        <button className="secondary-button" type="button" onClick={() => onSave(category, subcategory)}>Save</button>
        <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
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
  const [narrative, setNarrative] = useState(value);

  return (
    <div className="report-inline-edit">
      <label className="visually-hidden" htmlFor="edit-incident-narrative">Incident description</label>
      <textarea id="edit-incident-narrative" rows={6} value={narrative} onChange={(event) => setNarrative(event.target.value)} />
      <div className="inline-field-actions">
        <button className="secondary-button" type="button" onClick={() => onSave(narrative)}>Save</button>
        <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
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
  const [categoryEditing, setCategoryEditing] = useState(false);
  const [narrativeEditing, setNarrativeEditing] = useState(false);

  return (
    <div className="report-group">
      {categoryEditing && group.id === "INCIDENT" ? (
        <CategoryEditor
          draft={draft}
          onCancel={() => setCategoryEditing(false)}
          onSave={(categoryLabel, subCategoryLabel) => {
            onDraftChange({
              ...draft,
              officialMapping: { ...draft.officialMapping, categoryLabel, subCategoryLabel },
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
            onDraftChange({ ...draft, incident: { ...draft.incident, narrative: narrative || null } });
            setNarrativeEditing(false);
          }}
        />
      ) : null}

      {group.sections.map((section) => (
        <section key={section.id} className="report-field-section">
          {section.title ? <h3>{section.title}</h3> : null}
          {section.fields.map((item) => (
            <ReportFieldRow
              key={item.id}
              field={item}
              missingValue={item.missingQuestion ? missingAnswers[item.missingQuestion.field] ?? "" : ""}
              onMissingValueChange={(value) => {
                if (item.missingQuestion) onMissingAnswerChange(item.missingQuestion.field, value);
              }}
              onSaveMissing={(fallback) => {
                if (item.missingQuestion) onSaveMissingAnswer(item.missingQuestion, fallback);
              }}
              categoryEditing={categoryEditing}
              onCategoryEdit={() => setCategoryEditing(true)}
              narrativeEditing={narrativeEditing}
              onNarrativeEdit={() => setNarrativeEditing(true)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function ReportReview({ draft, onBackToEdit, onSubmit }: Pick<ReportWorkspaceProps, "draft" | "onBackToEdit" | "onSubmit">) {
  if (!draft) return null;
  const groups = deriveReportGroups(draft);

  return (
    <>
      <div className="report-pane-heading">
        <h2>Review &amp; submit</h2>
        <p>This is a final check of the information prepared for your synthetic complaint.</p>
      </div>
      <div className="report-review-groups">
        {groups.map((group) => (
          <section key={group.id} className="report-review-group">
            <h3>{group.label}</h3>
            {group.sections.flatMap((section) => section.fields).map((item) => (
              <div key={item.id} className="review-field-row">
                <span>{item.label}</span><strong>{item.value}</strong>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="report-primary-actions">
        <button className="primary-button" type="button" onClick={onSubmit}>Submit synthetic complaint</button>
        <button className="text-button" type="button" onClick={onBackToEdit}>Back to edit</button>
      </div>
      <p className="journey-note">This does not submit information to NCRP or any government system.</p>
    </>
  );
}

function ReportDetailsPane(props: ReportWorkspaceProps) {
  const [activeGroup, setActiveGroup] = useState<ReportGroupId>("INCIDENT");
  const groups = props.draft ? deriveReportGroups(props.draft) : [];
  const completion = props.draft ? deriveReportCompletion(props.draft) : null;
  const currentGroup = groups.find((group) => group.id === activeGroup) ?? groups[0];

  if (props.mode === "REVIEW") {
    return (
      <section className="report-details-pane" aria-label="Review and submit your report">
        <ReportReview draft={props.draft} onBackToEdit={props.onBackToEdit} onSubmit={props.onSubmit} />
      </section>
    );
  }

  return (
    <section className="report-details-pane" aria-labelledby="report-details-heading">
      <div className="report-pane-heading">
        <h2 id="report-details-heading">Information for your NCRP report</h2>
        <p>We’ll organise what you share into the details required for the complaint.</p>
      </div>

      {props.mode === "INPUT" && !props.draft ? (
        <div className="report-empty-state">
          <p><strong>Start by speaking, uploading evidence or typing what happened.</strong></p>
          <p>The required report details will appear here.</p>
        </div>
      ) : null}

      {props.mode === "PROCESSING" ? (
        <div className="report-processing-state" role="status" aria-live="polite">
          <span className="loading-marker" aria-hidden="true" />
          <p><strong>{props.loadingMessage}</strong></p>
          <div className="report-skeleton" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
        </div>
      ) : null}

      {props.mode === "ERROR" ? (
        <div className="report-error-state" role="alert">
          <h3>We couldn’t organise the information</h3>
          <p>{props.formError ?? "Your statement and evidence are still available on the left."}</p>
          <div className="entry-actions">
            <button className="primary-button" type="button" onClick={props.onOrganizeReport}>Try again</button>
            <button className="secondary-button" type="button" onClick={props.onUseDemoIncident}>Use sample incident</button>
          </div>
        </div>
      ) : null}

      {props.mode === "READY" && props.draft && completion && currentGroup ? (
        <>
          <div className="report-completion" role="status" aria-live="polite">
            <p><strong>{completion.ready} of {completion.total} details ready</strong></p>
            <p>{completion.missing === 0 ? "No required details are missing." : `${completion.missing} ${completion.missing === 1 ? "needs" : "need"} your input`}</p>
          </div>

          <div className="report-detail-tabs" role="group" aria-label="NCRP report sections">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={group.id === currentGroup.id}
                onClick={() => setActiveGroup(group.id)}
              >
                <span>{group.label}</span>
                <small>{group.missingCount > 0 ? `${group.missingCount} needed` : "Complete"}</small>
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

          <div className="report-primary-actions">
            <button className="primary-button" type="button" disabled={completion.missing > 0} onClick={props.onReview}>Review &amp; continue</button>
            {completion.missing > 0 ? <p>Complete the required detail above before reviewing.</p> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function ReportWorkspace(props: ReportWorkspaceProps) {
  return (
    <section className="report-workspace-stage section-pad">
      <div className="report-workspace-shell">
        <JourneyProgress current={props.mode === "REVIEW" || props.draft ? "REVIEW" : "REPORT"} />
        <div className="report-workspace">
          <ReportInputPane {...props} />
          <ReportDetailsPane {...props} />
        </div>
      </div>
    </section>
  );
}
