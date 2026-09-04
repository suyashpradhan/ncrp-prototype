"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CITIZEN_DOES_NOT_HAVE,
  type IncidentDraft,
  type TranscriptionResult,
} from "../../incident/schema";
import { useI18n } from "../../i18n/i18n-provider";
import { deriveEvidenceContributions } from "../../presentation/evidence-contributions";
import {
  getSafeCaseSummary,
} from "../../presentation/safe-case-copy";
import {
  getCaseSummary,
  getCaseStateExplanation,
  getKeepReadyPacket,
  getPostReportActions,
  getProcessExplainer,
  getPostSubmissionTimeline,
  type PostReportMilestones,
} from "../../presentation/post-report-case";
import { IncidentTimeline } from "./incident-timeline";
import { JourneyProgress } from "./journey-progress";
import { formatIndiaShortDateWithYear } from "../../presentation/format";
import type { DemoCaseDefinition } from "../../incident/demo-incident";
import {
  deriveCitizenNudges,
  type NotificationChannel,
} from "../../notifications/citizen-nudges";
import { citizenVisibleValue } from "../../presentation/citizen-visible-value";
import {
  OPEN_EVIDENCE_PREVIEW_EVENT,
  requestEvidencePreview,
} from "./evidence-preview-events";

type PostSubmissionCaseHomeProps = {
  draft: IncidentDraft;
  prototypeReference: string;
  screenshots: File[];
  isDemoIncident: boolean;
  demoCase: DemoCaseDefinition | null;
  milestones: PostReportMilestones;
  transcription: TranscriptionResult | null;
  onDraftChange: (draft: IncidentDraft) => void;
  onStartNewReport: () => void;
};

function PrintableCaseReport({
  draft,
  prototypeReference,
  milestones,
  transcription,
}: Pick<PostSubmissionCaseHomeProps, "draft" | "prototypeReference" | "milestones" | "transcription">) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const summary = getCaseSummary(draft, locale);
  const submitted = new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(milestones.submittedAt));
  const displayedStatement = transcription
    ? hi && transcription.languageCode.startsWith("hi")
      ? transcription.originalTranscript
      : !hi && transcription.englishTranscript
        ? transcription.englishTranscript
        : transcription.originalTranscript
    : draft.incident.narrative;
  return (
    <article className="complaint-packet" aria-label={hi ? "प्रिंट करने योग्य रिपोर्ट" : "Printable report"}>
      <header>
        <p className="packet-brand">सचेत</p>
        <h1>{hi ? "तैयार साइबर अपराध रिपोर्ट" : "Prepared cybercrime report"}</h1>
        <p>{draft.officialMapping.subCategoryLabel ?? draft.officialMapping.categoryLabel ?? draft.citizenSummary.incidentLabel}</p>
      </header>
      <section><h2>{hi ? "संदर्भ" : "Reference"}</h2><p>{prototypeReference}</p><p>{hi ? "जमा किया गया" : "Submitted"}: {submitted}</p></section>
      <section><h2>{hi ? "शिकायत की जानकारी" : "Complaint details"}</h2><dl>{summary.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>
      {displayedStatement ? <section><h2>{hi ? "घटना का विवरण" : "Incident summary"}</h2><p>{displayedStatement}</p></section> : null}
      {draft.transactions.length > 0 ? <section><h2>{hi ? "लेन-देन" : "Transactions"}</h2>{draft.transactions.map((transaction, index) => <dl key={transaction.id}><div><dt>{hi ? "लेन-देन" : "Transaction"}</dt><dd>{index + 1}</dd></div>{transaction.amount ? <div><dt>{hi ? "राशि" : "Amount"}</dt><dd>₹{transaction.amount.toLocaleString("en-IN")}</dd></div> : null}{citizenVisibleValue(transaction.institution) ? <div><dt>{hi ? "बैंक या भुगतान ऐप" : "Bank or payment app"}</dt><dd>{citizenVisibleValue(transaction.institution)}</dd></div> : null}{transaction.transactionDate ? <div><dt>{hi ? "तारीख" : "Date"}</dt><dd>{formatIndiaShortDateWithYear(transaction.transactionDate, locale)}</dd></div> : null}{citizenVisibleValue(transaction.approximateTime) ? <div><dt>{hi ? "समय" : "Time"}</dt><dd>{citizenVisibleValue(transaction.approximateTime)}</dd></div> : null}{citizenVisibleValue(transaction.transactionIdOrUtr) ? <div><dt>{hi ? "लेन-देन संदर्भ / UTR" : "Transaction reference / UTR"}</dt><dd>{citizenVisibleValue(transaction.transactionIdOrUtr)}</dd></div> : null}</dl>)}</section> : null}
      {draft.adaptiveFacts.accountCompromise || draft.adaptiveFacts.affectedAccount || draft.adaptiveFacts.affectedPlatforms.length > 0 ? <section><h2>{hi ? "प्रभावित खाता" : "Affected account"}</h2><dl>{draft.adaptiveFacts.affectedPlatforms.length > 0 ? <div><dt>{hi ? "प्रभावित खाते या सेवाएँ" : "Affected accounts or services"}</dt><dd>{draft.adaptiveFacts.affectedPlatforms.join(", ")}</dd></div> : draft.adaptiveFacts.platform ? <div><dt>{hi ? "प्लेटफ़ॉर्म" : "Platform"}</dt><dd>{draft.adaptiveFacts.platform}</dd></div> : null}{draft.adaptiveFacts.messageSourcePlatforms.length > 0 ? <div><dt>{hi ? "संदेश में बताई गई सेवा" : "Message source platform"}</dt><dd>{draft.adaptiveFacts.messageSourcePlatforms.join(", ")}</dd></div> : null}{draft.adaptiveFacts.affectedAccount ? <div><dt>{hi ? "खाता या प्रोफ़ाइल" : "Account or profile"}</dt><dd>{draft.adaptiveFacts.affectedAccount}</dd></div> : null}{draft.adaptiveFacts.profileUrl ? <div><dt>{hi ? "प्रोफ़ाइल URL" : "Profile URL"}</dt><dd>{draft.adaptiveFacts.profileUrl}</dd></div> : null}{draft.adaptiveFacts.accountAccessStatus ? <div><dt>{hi ? "पहुँच की स्थिति" : "Access status"}</dt><dd>{draft.adaptiveFacts.accountAccessStatus}</dd></div> : null}{draft.adaptiveFacts.multipleIncidentThreads ? <div><dt>{hi ? "घटना के हिस्से" : "Incident threads"}</dt><dd>{hi ? "दो अलग घटना-क्रम दर्ज हैं" : "Two separate incident threads are recorded"}</dd></div> : null}</dl></section> : null}
      {draft.adaptiveFacts.threatOrExtortion || draft.adaptiveFacts.impersonation ? <section><h2>{hi ? "धमकी या प्रतिरूपण" : "Threat or impersonation"}</h2><dl>{draft.adaptiveFacts.demandedAmount ? <div><dt>{hi ? "मांगी गई राशि" : "Amount demanded"}</dt><dd>₹{draft.adaptiveFacts.demandedAmount.toLocaleString("en-IN")}</dd></div> : null}{draft.adaptiveFacts.threatChannel ? <div><dt>{hi ? "माध्यम" : "Channel"}</dt><dd>{draft.adaptiveFacts.threatChannel}</dd></div> : null}{draft.adaptiveFacts.impersonatedEntity ? <div><dt>{hi ? "दावा की गई पहचान" : "Claimed identity"}</dt><dd>{draft.adaptiveFacts.impersonatedEntity}</dd></div> : null}</dl></section> : null}
      {draft.adaptiveFacts.requestedSensitiveInfo.length > 0 || draft.adaptiveFacts.sharedSensitiveInfo.length > 0 ? <section><h2>{hi ? "मांगी या साझा की गई जानकारी" : "Information requested or shared"}</h2>{draft.adaptiveFacts.requestedSensitiveInfo.length > 0 ? <p><strong>{hi ? "मांगी गई:" : "Requested:"}</strong> {draft.adaptiveFacts.requestedSensitiveInfo.join(", ")}</p> : null}{draft.adaptiveFacts.sharedSensitiveInfo.length > 0 ? <p><strong>{hi ? "साझा की गई:" : "Shared:"}</strong> {draft.adaptiveFacts.sharedSensitiveInfo.join(", ")}</p> : null}</section> : null}
      {draft.evidence.length > 0 ? <section><h2>{hi ? "सबूत" : "Evidence"}</h2><p>{draft.evidence.length} {hi ? "सबूत आइटम रिपोर्ट में शामिल" : "evidence items included with the report"}</p></section> : null}
      <footer><p>{hi ? "प्रोटोटाइप प्रति। यह आधिकारिक NCRP पावती या सरकारी सबमिशन रसीद नहीं है।" : "Prototype copy. Not an official NCRP acknowledgement or government submission receipt."}</p></footer>
    </article>
  );
}

function EvidenceIncluded({
  draft,
  screenshots,
  isDemoIncident,
  demoCase,
}: Pick<
  PostSubmissionCaseHomeProps,
  "draft" | "screenshots" | "isDemoIncident" | "demoCase"
>) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const items = deriveEvidenceContributions(draft, {
    locale,
    isDemoIncident,
    screenshotNames: isDemoIncident
      ? (demoCase?.evidence.map((item) => item.label) ?? [])
      : screenshots.map((file) => file.name),
    demoEvidence: demoCase?.evidence,
  });
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const activeItem = items.find((item) => item.evidenceId === activeEvidenceId);
  const demoEvidencePath = demoCase?.evidence.find(
    (item) => item.id === activeEvidenceId,
  )?.src;

  useEffect(() => {
    if (!activeEvidenceId || isDemoIncident) {
      setUploadedPreviewUrl(null);
      return;
    }
    const match = /^uploaded-(\d+)$/.exec(activeEvidenceId);
    const file = match ? screenshots[Number(match[1])] : null;
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadedPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [activeEvidenceId, isDemoIncident, screenshots]);

  useEffect(() => {
    if (activeItem && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [activeItem]);

  useEffect(() => {
    const openRequestedEvidence = (event: Event) => {
      const evidenceId = (event as CustomEvent<string>).detail;
      if (items.some((item) => item.evidenceId === evidenceId)) {
        setActiveEvidenceId(evidenceId);
      }
    };
    window.addEventListener(OPEN_EVIDENCE_PREVIEW_EVENT, openRequestedEvidence);
    return () =>
      window.removeEventListener(OPEN_EVIDENCE_PREVIEW_EVENT, openRequestedEvidence);
  }, [items]);

  function closePreview() {
    dialogRef.current?.close();
    setActiveEvidenceId(null);
  }

  return (
    <section
      className="companion-section post-report-evidence"
      aria-labelledby="post-report-evidence-heading"
    >
      <h2 id="post-report-evidence-heading">
        {hi ? "शामिल सबूत" : "Evidence included"}
      </h2>
      {items.length === 0 ? (
        <p className="companion-section-note">
          {hi ? "कोई सबूत संलग्न नहीं है।" : "No evidence attached."}
        </p>
      ) : (
        <div className="evidence-contribution-list">
          {items.map((item) => (
            <article className="evidence-contribution" key={item.evidenceId}>
              <div className="evidence-contribution-title">
                <div>
                  <strong>{item.evidenceLabel}</strong>
                  <span>
                    {item.evidenceType}
                    {item.contributions.length > 0
                      ? ` · ${hi ? `${item.contributions.length} जानकारियों से जुड़ा` : `linked to ${item.contributions.length} ${item.contributions.length === 1 ? "detail" : "details"}`}`
                      : ""}
                  </span>
                </div>
                <button
                  className="text-button"
                  type="button"
                  data-evidence-id={item.evidenceId}
                  aria-haspopup="dialog"
                  onClick={() => requestEvidencePreview(item.evidenceId)}
                >
                  {hi ? "देखें" : "View"} →
                </button>
              </div>
              {item.contributions.length > 0 ? (
                <details className="evidence-linkage-details">
                  <summary>{hi ? "जुड़ी हुई जानकारी" : "Linked complaint details"}</summary>
                  <ul className="evidence-used-list">
                    {item.contributions.map((fact) => (
                      <li key={`${item.evidenceId}-${fact.fieldKey}`}>
                        {/^(Detail found|सबूत में मिली जानकारी)$/.test(fact.label) ? null : (
                          <span>{fact.label}: </span>
                        )}
                        {fact.displayValue}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {activeItem ? (
        <dialog
          ref={dialogRef}
          className="evidence-preview-dialog"
          aria-labelledby="case-evidence-preview-title"
          onClose={() => setActiveEvidenceId(null)}
        >
          <>
            <div className="evidence-preview-dialog-header">
              <div>
                <p className="companion-eyebrow">
                  {hi ? "शामिल सबूत" : "Evidence included"}
                </p>
                <h2 id="case-evidence-preview-title">{activeItem.evidenceLabel}</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closePreview}>
                {hi ? "बंद करें" : "Close"}
              </button>
            </div>
            {demoEvidencePath || uploadedPreviewUrl ? (
              <Image
                src={demoEvidencePath ?? uploadedPreviewUrl ?? ""}
                alt={activeItem.evidenceLabel}
                width={960}
                height={720}
                sizes="(max-width: 720px) 90vw, 720px"
                unoptimized={Boolean(uploadedPreviewUrl)}
              />
            ) : (
              <p>{hi ? "पूर्वावलोकन उपलब्ध नहीं है।" : "Preview is not available."}</p>
            )}
          </>
        </dialog>
      ) : null}
    </section>
  );
}

export function PostSubmissionCaseHome({
  draft,
  prototypeReference,
  screenshots,
  isDemoIncident,
  demoCase,
  milestones,
  transcription,
  onDraftChange,
  onStartNewReport,
}: PostSubmissionCaseHomeProps) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const summary = getCaseSummary(draft, locale);
  const actions = getPostReportActions(draft, locale);
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);
  const keepReady = getKeepReadyPacket(draft, locale);
  const process = getProcessExplainer(draft, locale);
  const timeline = getPostSubmissionTimeline(
    draft,
    locale,
    isDemoIncident,
    milestones,
  );
  const [copiedValue, setCopiedValue] = useState<"REFERENCE" | "SUMMARY" | null>(null);
  const missingReferenceIndex = draft.transactions.findIndex(
    (transaction) => !transaction.transactionIdOrUtr,
  );
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpValue, setFollowUpValue] = useState("");
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [notificationChannel, setNotificationChannel] =
    useState<NotificationChannel>("EMAIL");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const nudges = deriveCitizenNudges(draft, locale, notificationChannel);
  const stateExplanation = getCaseStateExplanation(
    missingReferenceIndex >= 0 ? "ADDITIONAL_INFO_REQUESTED" : "SUBMITTED",
    locale,
  );
  const compactSummaryIds = [
    "reporting-path",
    "reported-loss",
    "money-lost",
    "transactions",
    "incident-date",
    "channel",
    "affected-platforms",
    "affected-account",
    "affected-platform",
  ];
  const compactSummary = compactSummaryIds
    .map((id) => summary.find((item) => item.id === id))
    .filter((item): item is (typeof summary)[number] => Boolean(item))
    .slice(0, 6);
  const processBoundaries = Array.from(
    new Set([stateExplanation.whatItDoesNotMean, ...process.importantBoundaries]),
  );

  function saveTransactionReference(value: string) {
    if (missingReferenceIndex < 0) return;
    const nextTransactions = draft.transactions.map((transaction, index) =>
      index === missingReferenceIndex
        ? {
            ...transaction,
            transactionIdOrUtr: value,
            status: "KNOWN" as const,
          }
        : transaction,
    );
    const confirmedField = `transactions.${missingReferenceIndex}.transactionIdOrUtr`;
    onDraftChange({
      ...draft,
      transactions: nextTransactions,
      citizenConfirmedFields: Array.from(new Set([
        ...(draft.citizenConfirmedFields ?? []),
        confirmedField,
      ])),
    });
    setFollowUpOpen(false);
    setFollowUpSaved(true);
  }

  async function copyText(value: string, kind: "REFERENCE" | "SUMMARY") {
    await navigator.clipboard.writeText(value);
    setCopiedValue(kind);
    window.setTimeout(() => setCopiedValue(null), 1600);
  }

  function printReport() {
    const previousTitle = document.title;
    document.title = "सचेत — Prepared cybercrime report";
    window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once: true });
    window.print();
  }

  return (
    <section
      className="journey-stage post-submission-case section-pad"
      data-journey-focus
      tabIndex={-1}
    >
      <div className="shell post-submission-shell">
        <JourneyProgress current="RESOLUTION" completeCurrent />
        <div className="reading-shell post-submission-content">
          <header className="post-submission-header">
            <div className="post-submission-title-row">
              <span className="success-mark" aria-hidden="true">✓</span>
              <h1 tabIndex={-1}>{hi ? "शिकायत जमा हो गई" : "Complaint submitted"}</h1>
            </div>
            <div className="prototype-reference-line">
              <span>{hi ? "प्रोटोटाइप संदर्भ:" : "Prototype reference:"}</span>
              <strong>{prototypeReference}</strong>
              <button className="text-button" type="button" onClick={() => void copyText(prototypeReference, "REFERENCE")}>
                {copiedValue === "REFERENCE" ? (hi ? "कॉपी हो गया" : "Copied") : (hi ? "कॉपी करें" : "Copy")}
              </button>
            </div>
            <p className="prototype-boundary">
              {hi
                ? "यह सबमिशन केवल इस प्रोटोटाइप में दर्ज है। इसे NCRP या किसी अन्य सरकारी प्रणाली को नहीं भेजा गया।"
                : "This submission is recorded only in this prototype. It has not been sent to NCRP or another government system."}
            </p>
          </header>

          <div className="post-submission-priority-grid">
          <section className="companion-section immediate-action-section" aria-labelledby="post-report-actions-heading">
            <h2 id="post-report-actions-heading">{hi ? "तुरंत कार्रवाई" : "Immediate action"}</h2>
            {primaryAction ? (
              <article className="post-report-primary-action">
                <p className="companion-eyebrow">{hi ? "सबसे पहले" : "First"}</p>
                <h3>{primaryAction.title}</h3>
                <p>{primaryAction.description}</p>
                {primaryAction.href ? (
                  <a className="primary-button" href={primaryAction.href}>{primaryAction.title}</a>
                ) : null}
              </article>
            ) : null}
            {secondaryActions.length > 0 ? (
              <ol className="post-report-action-list post-report-secondary-actions">
              {secondaryActions.map((action, index) => (
                <li key={action.id}>
                  <span aria-hidden="true">{String(index + 2).padStart(2, "0")}</span>
                  <div>
                    <h3>
                      {action.href ? (
                        <a href={action.href}>{action.title}</a>
                      ) : (
                        action.title
                      )}
                    </h3>
                    <p>{action.description}</p>
                  </div>
                </li>
              ))}
              </ol>
            ) : null}
          </section>

          <section className="companion-section complaint-summary-section" aria-labelledby="case-summary-heading">
            <h2 id="case-summary-heading">{hi ? "शिकायत का सार" : "Complaint summary"}</h2>
            <dl className="companion-summary-list">
              {compactSummary.map((item) => (
                <div key={item.id}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            <details className="submitted-complaint-details">
              <summary>{hi ? "शिकायत की पूरी जानकारी देखें" : "View complaint details"}</summary>
              <div className="submitted-complaint-details-content">
                <dl className="companion-summary-list">
                  {summary.map((item) => (
                    <div key={`full-${item.id}`}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
                {draft.incident.narrative ? (
                  <div className="submitted-statement">
                    <h3>{hi ? "बयान" : "Statement"}</h3>
                    <p>{draft.incident.narrative}</p>
                  </div>
                ) : null}
                {draft.transactions.length > 0 ? (
                  <div className="submitted-transaction-details">
                    <h3>{hi ? "लेन-देन" : "Transactions"}</h3>
                    <div className="submitted-transaction-list">
                      {draft.transactions.map((transaction, index) => (
                        <article key={transaction.id}>
                          <h4>{hi ? `लेन-देन ${index + 1}` : `Transaction ${index + 1}`}</h4>
                          <dl>
                            {transaction.amount ? <div><dt>{hi ? "राशि" : "Amount"}</dt><dd>₹{transaction.amount.toLocaleString("en-IN")}</dd></div> : null}
                            {citizenVisibleValue(transaction.institution) ? <div><dt>{hi ? "बैंक या भुगतान ऐप" : "Bank or payment app"}</dt><dd>{citizenVisibleValue(transaction.institution)}</dd></div> : null}
                            {transaction.transactionDate ? <div><dt>{hi ? "तारीख" : "Date"}</dt><dd>{formatIndiaShortDateWithYear(transaction.transactionDate, locale)}</dd></div> : null}
                            {citizenVisibleValue(transaction.approximateTime) ? <div><dt>{hi ? "समय" : "Time"}</dt><dd>{citizenVisibleValue(transaction.approximateTime)}</dd></div> : null}
                            {citizenVisibleValue(transaction.transactionIdOrUtr) ? <div><dt>{hi ? "लेन-देन संदर्भ / UTR" : "Transaction reference / UTR"}</dt><dd>{citizenVisibleValue(transaction.transactionIdOrUtr)}</dd></div> : null}
                          </dl>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
                {keepReady.length > 0 ? (
                  <div className="case-keep-ready">
                    <h3>{hi ? "ये जानकारी तैयार रखें" : "Keep these details ready"}</h3>
                    <ul>{keepReady.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                ) : null}
                {missingReferenceIndex >= 0 || followUpSaved ? (
                  <div className="prototype-follow-up" aria-labelledby="follow-up-heading">
                    <h3 id="follow-up-heading">
                      {followUpSaved
                        ? (hi ? "जानकारी अपडेट हो गई" : "Detail updated")
                        : (hi ? "लेन-देन संदर्भ जोड़ें" : "Add transaction reference")}
                    </h3>
                    {followUpSaved ? (
                      <p>{hi ? "लेन-देन संदर्भ की पुष्टि आपने की है।" : "The transaction reference is now confirmed by you."}</p>
                    ) : (
                      <>
                        <p>{hi ? `लेन-देन ${missingReferenceIndex + 1} का UTR या संदर्भ उपलब्ध हो तो जोड़ें।` : `Add the UTR or reference for transaction ${missingReferenceIndex + 1} if it is available.`}</p>
                        {followUpOpen ? (
                          <div className="prototype-follow-up-form">
                            <label htmlFor="post-report-transaction-reference">{hi ? "लेन-देन संदर्भ / UTR" : "Transaction reference / UTR"}</label>
                            <input id="post-report-transaction-reference" value={followUpValue} onChange={(event) => setFollowUpValue(event.target.value)} autoFocus />
                            <div className="entry-actions">
                              <button className="primary-button" type="button" disabled={!followUpValue.trim()} onClick={() => saveTransactionReference(followUpValue.trim())}>{hi ? "जानकारी जोड़ें" : "Add detail"}</button>
                              <button className="secondary-button" type="button" onClick={() => saveTransactionReference(CITIZEN_DOES_NOT_HAVE)}>{hi ? "यह मेरे पास नहीं है" : "I don’t have this"}</button>
                            </div>
                          </div>
                        ) : (
                          <button className="secondary-button" type="button" onClick={() => setFollowUpOpen(true)}>{hi ? "जानकारी जोड़ें" : "Add detail"}</button>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </details>
          </section>
          </div>

          <section className="companion-section" aria-labelledby="post-report-process-heading">
            <h2 id="post-report-process-heading">{hi ? "आगे क्या हो सकता है" : "What may happen next"}</h2>
            <ol className="post-report-stage-list compact-process-list">
              {process.possibleNextStages.map((stage, index) => (
                <li key={stage.id}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{stage.title}</strong>
                    <p>{stage.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <details className="process-boundaries-disclosure">
              <summary>{hi ? "इसका क्या अर्थ नहीं है" : "What this does not mean"}</summary>
              <ul className="post-report-boundary-list">
                {processBoundaries.map((boundary) => (
                  <li key={boundary}>{boundary}</li>
                ))}
              </ul>
            </details>
          </section>

          <section className="companion-section stay-informed" aria-labelledby="stay-informed-heading">
            <div>
              <h2 id="stay-informed-heading">{hi ? "जानकारी पाते रहें" : "Stay informed"}</h2>
              <p>{hi ? "अगले उपयोगी कदमों और साइबर सुरक्षा सावधानियों के बारे में रिमाइंडर पाएँ।" : "Get reminders about useful next steps and cyber-safety precautions."}</p>
            </div>
            {remindersEnabled ? (
              <div className="reminders-confirmed" role="status">
                <span className="success-mark" aria-hidden="true">✓</span>
                <div>
                  <h3>{hi ? "रिमाइंडर चालू हैं" : "Reminders on"}</h3>
                  <strong>{notificationChannel === "EMAIL" ? (hi ? "ईमेल" : "Email") : "WhatsApp"}</strong>
                  <p>{hi ? "इस शिकायत के लिए उपयोगी सुरक्षा रिमाइंडर मिलेंगे।" : "You'll receive follow-up safety reminders for this complaint."}</p>
                  <button className="text-button" type="button" onClick={() => setRemindersEnabled(false)}>{hi ? "पसंद बदलें" : "Change preference"}</button>
                </div>
              </div>
            ) : (
              <>
                <fieldset>
                  <legend>{hi ? "रिमाइंडर का माध्यम" : "Reminder channel"}</legend>
                  <label>
                    <input type="radio" name="notification-channel" value="EMAIL" checked={notificationChannel === "EMAIL"} onChange={() => setNotificationChannel("EMAIL")} />
                    <span>{hi ? "ईमेल" : "Email"}</span>
                  </label>
                  <label>
                    <input type="radio" name="notification-channel" value="WHATSAPP" checked={notificationChannel === "WHATSAPP"} onChange={() => setNotificationChannel("WHATSAPP")} />
                    <span>WhatsApp</span>
                  </label>
                </fieldset>
                <button className="secondary-button" type="button" onClick={() => setRemindersEnabled(true)}>
                  {hi ? "रिमाइंडर चालू करें" : "Turn on reminders"}
                </button>
                <p className="source-note">
                  {isDemoIncident
                    ? hi ? "सिंथेटिक संपर्क · केवल डेमो पूर्वावलोकन" : "Synthetic contact · Demo preview only"
                    : hi ? "केवल प्रोटोटाइप · कोई असली संदेश नहीं भेजा जाएगा" : "Prototype only · No real message will be sent"}
                </p>
              </>
            )}
            {remindersEnabled ? (
              <div className="reminder-preview" aria-label={hi ? "आने वाले रिमाइंडर" : "Upcoming reminders"}>
                <h3>{hi ? "आने वाले रिमाइंडर" : "Upcoming reminders"}</h3>
                {nudges.slice(0, 2).map((nudge) => (
                  <article key={nudge.id}>
                    <span>{nudge.schedule === "TODAY" ? (hi ? "आज" : "Today") : (hi ? "कल" : "Tomorrow")}</span>
                    <strong>{nudge.title}</strong>
                    <p>{nudge.body}</p>
                  </article>
                ))}
                <p className="source-note">{hi ? "प्रोटोटाइप पूर्वावलोकन · कोई असली संदेश नहीं भेजा गया" : "Prototype preview · No real message was sent"}</p>
              </div>
            ) : null}
          </section>

          <section className="companion-section post-report-timeline-section">
            <IncidentTimeline
              events={timeline}
              heading={hi ? "मामले की समयरेखा" : "Case timeline"}
              groupByDate
            />
          </section>

        <EvidenceIncluded
          draft={draft}
          screenshots={screenshots}
          isDemoIncident={isDemoIncident}
          demoCase={demoCase}
        />

          <section className="companion-section case-copy-section" aria-labelledby="complaint-actions-heading">
            <h2 id="complaint-actions-heading">{hi ? "शिकायत के विकल्प" : "Complaint actions"}</h2>
            <div className="case-copy-actions">
              <button className="secondary-button" type="button" onClick={() => void copyText(getSafeCaseSummary(draft, prototypeReference, locale), "SUMMARY")}>
                {copiedValue === "SUMMARY" ? (hi ? "सार कॉपी हो गया" : "Summary copied") : (hi ? "मामले का सार कॉपी करें" : "Copy case summary")}
              </button>
              <button className="secondary-button" type="button" onClick={printReport}>
                {hi ? "प्रिंट करें या PDF सहेजें" : "Print or save PDF"}
              </button>
              <button className="text-button" type="button" onClick={onStartNewReport}>
                {hi ? "नई शिकायत शुरू करें" : "Start new complaint"}
              </button>
            </div>
          </section>
          <PrintableCaseReport draft={draft} prototypeReference={prototypeReference} milestones={milestones} transcription={transcription} />
        </div>
      </div>
    </section>
  );
}
