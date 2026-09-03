"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { IncidentDraft } from "../../incident/schema";
import { useI18n } from "../../i18n/i18n-provider";
import { deriveEvidenceContributions } from "../../presentation/evidence-contributions";
import {
  getSafeCaseSummary,
} from "../../presentation/safe-case-copy";
import {
  getCaseSummary,
  getPostReportActions,
  getProcessExplainer,
  getPostSubmissionTimeline,
  type PostReportMilestones,
} from "../../presentation/post-report-case";
import { IncidentTimeline } from "./incident-timeline";
import { JourneyProgress } from "./journey-progress";

type PostSubmissionCaseHomeProps = {
  draft: IncidentDraft;
  prototypeReference: string;
  screenshots: File[];
  isDemoIncident: boolean;
  milestones: PostReportMilestones;
  onStartNewReport: () => void;
};

const DEMO_EVIDENCE_PATHS: Record<string, string> = {
  "demo-message": "/demo/evidence/kyc-message-demo.png",
  "demo-transaction": "/demo/evidence/bank-transaction-demo.png",
};

function PrintableCaseReport({
  draft,
  prototypeReference,
  milestones,
}: Pick<PostSubmissionCaseHomeProps, "draft" | "prototypeReference" | "milestones">) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const summary = getCaseSummary(draft, locale);
  const submitted = new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(milestones.submittedAt));
  return (
    <article className="complaint-packet" aria-label={hi ? "प्रिंट करने योग्य रिपोर्ट" : "Printable report"}>
      <header>
        <p className="packet-brand">Sachet</p>
        <h1>{hi ? "तैयार साइबर अपराध रिपोर्ट" : "Prepared cybercrime report"}</h1>
        <p>{draft.officialMapping.subCategoryLabel ?? draft.officialMapping.categoryLabel ?? draft.citizenSummary.incidentLabel}</p>
      </header>
      <section><h2>{hi ? "संदर्भ" : "Reference"}</h2><p>{prototypeReference}</p><p>{hi ? "जमा किया गया" : "Submitted"}: {submitted}</p></section>
      <section><h2>{hi ? "मामले का सार" : "Case summary"}</h2><dl>{summary.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>
      {draft.incident.narrative ? <section><h2>{hi ? "घटना का विवरण" : "Incident summary"}</h2><p>{draft.incident.narrative}</p></section> : null}
      {draft.transactions.length > 0 ? <section><h2>{hi ? "लेन-देन" : "Transactions"}</h2>{draft.transactions.map((transaction, index) => <dl key={transaction.id}><div><dt>{hi ? "लेन-देन" : "Transaction"}</dt><dd>{index + 1}</dd></div>{transaction.amount ? <div><dt>{hi ? "राशि" : "Amount"}</dt><dd>₹{transaction.amount.toLocaleString("en-IN")}</dd></div> : null}{transaction.institution ? <div><dt>{hi ? "बैंक या भुगतान ऐप" : "Bank / payment institution"}</dt><dd>{transaction.institution}</dd></div> : null}{transaction.transactionIdOrUtr && transaction.transactionIdOrUtr !== "__CITIZEN_DOES_NOT_HAVE__" ? <div><dt>{hi ? "लेन-देन संदर्भ" : "Transaction reference"}</dt><dd>{transaction.transactionIdOrUtr}</dd></div> : null}</dl>)}</section> : null}
      {draft.evidence.length > 0 ? <section><h2>{hi ? "सबूत" : "Evidence"}</h2><p>{draft.evidence.length} {hi ? "सबूत आइटम रिपोर्ट में शामिल" : "evidence items included with the report"}</p></section> : null}
      <footer><p>{hi ? "प्रोटोटाइप प्रति। यह आधिकारिक NCRP पावती या सरकारी सबमिशन रसीद नहीं है।" : "Prototype copy. Not an official NCRP acknowledgement or government submission receipt."}</p></footer>
    </article>
  );
}

function EvidenceIncluded({
  draft,
  screenshots,
  isDemoIncident,
}: Pick<
  PostSubmissionCaseHomeProps,
  "draft" | "screenshots" | "isDemoIncident"
>) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const items = deriveEvidenceContributions(draft, {
    locale,
    isDemoIncident,
    screenshotNames: screenshots.map((file) => file.name),
  });
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const activeItem = items.find((item) => item.evidenceId === activeEvidenceId);

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
                  <span>{item.evidenceType}</span>
                </div>
              </div>
              {item.contributions.length > 0 ? (
                <>
                  <p className="evidence-used-label">
                    {hi ? "इसके लिए उपयोग हुआ" : "Used for"}
                  </p>
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
                </>
              ) : (
                <p>{hi ? "रिपोर्ट के साथ संलग्न" : "Attached to the report"}</p>
              )}
              <button
                className="text-button"
                type="button"
                data-evidence-id={item.evidenceId}
                aria-haspopup="dialog"
                onClick={() => setActiveEvidenceId(item.evidenceId)}
              >
                {hi ? "सबूत देखें" : "View evidence"} →
              </button>
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
            {DEMO_EVIDENCE_PATHS[activeItem.evidenceId] || uploadedPreviewUrl ? (
              <Image
                src={DEMO_EVIDENCE_PATHS[activeItem.evidenceId] ?? uploadedPreviewUrl ?? ""}
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
  milestones,
  onStartNewReport,
}: PostSubmissionCaseHomeProps) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const summary = getCaseSummary(draft, locale);
  const actions = getPostReportActions(draft, locale);
  const process = getProcessExplainer(draft, locale);
  const timeline = getPostSubmissionTimeline(
    draft,
    locale,
    isDemoIncident,
    milestones,
  );
  const [copiedValue, setCopiedValue] = useState<"REFERENCE" | "SUMMARY" | null>(null);

  async function copyText(value: string, kind: "REFERENCE" | "SUMMARY") {
    await navigator.clipboard.writeText(value);
    setCopiedValue(kind);
    window.setTimeout(() => setCopiedValue(null), 1600);
  }

  function printReport() {
    const previousTitle = document.title;
    document.title = "Sachet — Prepared cybercrime report";
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
            <span className="success-mark" aria-hidden="true">✓</span>
            <h1 tabIndex={-1}>{hi ? "रिपोर्ट जमा हो गई" : "Report submitted"}</h1>
            <p>
              {hi
                ? "आपकी रिपोर्ट इस प्रोटोटाइप में दर्ज की गई है।"
                : "Your report has been recorded in this prototype."}
            </p>
            <div className="prototype-reference-block">
              <span>{hi ? "प्रोटोटाइप संदर्भ" : "Prototype reference"}</span>
              <strong>{prototypeReference}</strong>
              <button className="text-button" type="button" onClick={() => void copyText(prototypeReference, "REFERENCE")}>
                {copiedValue === "REFERENCE" ? (hi ? "कॉपी हो गया" : "Copied") : (hi ? "कॉपी करें" : "Copy")}
              </button>
            </div>
            <p className="prototype-boundary">
              <strong>{hi ? "प्रोटोटाइप सबमिशन" : "Prototype submission"}</strong>
              <span>
                {hi
                  ? "NCRP या किसी अन्य सरकारी प्रणाली को जमा नहीं किया गया।"
                  : "Not submitted to NCRP or another government system."}
              </span>
            </p>
          </header>

          <section className="companion-section" aria-labelledby="case-summary-heading">
            <h2 id="case-summary-heading">{hi ? "मामले का सार" : "Case summary"}</h2>
            <dl className="companion-summary-list">
              {summary.map((item) => (
                <div key={item.id}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="case-copy-actions">
              <button className="secondary-button" type="button" onClick={() => void copyText(getSafeCaseSummary(draft, prototypeReference, locale), "SUMMARY")}>
                {copiedValue === "SUMMARY" ? (hi ? "सार कॉपी हो गया" : "Summary copied") : (hi ? "मामले का सार कॉपी करें" : "Copy case summary")}
              </button>
              <button className="secondary-button" type="button" onClick={printReport}>
                {hi ? "प्रिंट करें या PDF सहेजें" : "Print or save PDF"}
              </button>
            </div>
          </section>

          <section className="companion-section" aria-labelledby="post-report-actions-heading">
            <h2 id="post-report-actions-heading">{hi ? "अभी क्या करें" : "What to do now"}</h2>
            <ol className="post-report-action-list">
              {actions.map((action, index) => (
                <li key={action.id}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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
          </section>

          <section className="companion-section" aria-labelledby="post-report-process-heading">
            <h2 id="post-report-process-heading">{hi ? "आगे क्या होता है" : "What happens next"}</h2>
            <div className="post-report-process-part">
              <h3>{hi ? "अभी क्या पता है" : "Known now"}</h3>
              <p className="post-report-known-state">
                <strong>{process.currentKnownState.title}</strong>
                <span>{process.currentKnownState.description}</span>
              </p>
            </div>
            <div className="post-report-process-part">
              <h3>{process.possibleNextStagesHeading}</h3>
              <ol className="post-report-stage-list">
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
            </div>
            <div className="post-report-process-part">
              <h3>{hi ? "इसका क्या अर्थ नहीं है" : "What this does not mean"}</h3>
              <ul className="post-report-boundary-list">
                {process.importantBoundaries.map((boundary) => (
                  <li key={boundary}>{boundary}</li>
                ))}
              </ul>
            </div>
            {process.keepReady && process.keepReady.length > 0 ? (
              <div className="post-report-process-part">
                <h3>{hi ? "तैयार रखें" : "Keep ready"}</h3>
                <ul className="post-report-keep-ready-list">
                  {process.keepReady.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="companion-section post-report-timeline-section">
            <IncidentTimeline
              events={timeline}
              heading={hi ? "मामले की समयरेखा" : "Case timeline"}
            />
          </section>

          <EvidenceIncluded
            draft={draft}
            screenshots={screenshots}
            isDemoIncident={isDemoIncident}
          />

          <button className="secondary-button" type="button" onClick={onStartNewReport}>
            {hi ? "नई रिपोर्ट शुरू करें" : "Start new report"}
          </button>
          <PrintableCaseReport draft={draft} prototypeReference={prototypeReference} milestones={milestones} />
        </div>
      </div>
    </section>
  );
}
