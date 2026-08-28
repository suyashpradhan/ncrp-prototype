"use client";

import { useState, type ChangeEvent } from "react";
import { useI18n } from "../../i18n/i18n-provider";
import type { IncidentDraft } from "../../incident/schema";
import {
  DEMO_OFFICIAL_ACKNOWLEDGEMENT,
  explainSuppliedStatus,
  getPossibleStages,
  type AddedAcknowledgement,
} from "../../presentation/case-companion";
import {
  formatCurrency,
  formatIndiaShortDateWithYear,
} from "../../presentation/format";

type AcknowledgementFormProps = {
  onContinue: (acknowledgement: AddedAcknowledgement) => void;
  onUseDemo: () => void;
};

export function AcknowledgementForm({
  onContinue,
  onUseDemo,
}: AcknowledgementFormProps) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const [number, setNumber] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReceipt(event: ChangeEvent<HTMLInputElement>) {
    setReceipt(event.target.files?.[0] ?? null);
  }

  function continueToCompanion() {
    const acknowledgementNumber = number.trim();
    if (!acknowledgementNumber) {
      setError(
        hi
          ? "जारी रखने के लिए पावती संख्या लिखें।"
          : "Enter the acknowledgement number to continue.",
      );
      return;
    }

    onContinue({
      number: acknowledgementNumber,
      receiptName: receipt?.name ?? null,
      source: receipt ? "RECEIPT_SUPPLIED" : "NUMBER_ENTERED",
      synthetic: false,
    });
  }

  return (
    <section
      className="journey-stage section-pad"
      data-journey-focus
      tabIndex={-1}
    >
      <div className="shell reading-shell acknowledgement-form">
        <p className="companion-eyebrow">
          {hi ? "रिपोर्ट के बाद" : "After reporting"}
        </p>
        <h1>{hi ? "अपनी पावती जोड़ें" : "Add your acknowledgement"}</h1>
        <p className="companion-intro">
          {hi
            ? "शिकायत दर्ज करने के बाद मिली पावती संख्या या रसीद का उपयोग करें।"
            : "Use the acknowledgement number or receipt you received after reporting the complaint."}
        </p>

        <div className="companion-field">
          <label htmlFor="official-acknowledgement-number">
            {hi ? "पावती संख्या" : "Acknowledgement number"}
          </label>
          <input
            id="official-acknowledgement-number"
            type="text"
            autoComplete="off"
            value={number}
            onChange={(event) => {
              setNumber(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="companion-field">
          <label htmlFor="acknowledgement-receipt">
            {hi
              ? "पावती रसीद अपलोड करें (वैकल्पिक)"
              : "Upload acknowledgement receipt (optional)"}
          </label>
          <input
            id="acknowledgement-receipt"
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleReceipt}
          />
          {receipt ? (
            <p className="companion-file-name">
              {hi ? "जोड़ी गई फ़ाइल:" : "File added:"} {receipt.name}
            </p>
          ) : null}
          <p className="field-help">
            {hi
              ? "इस संस्करण में रसीद सुरक्षित या किसी सरकारी सेवा को नहीं भेजी जाती।"
              : "In this version, the receipt is not stored or sent to a government service."}
          </p>
        </div>

        {error ? (
          <p className="companion-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="entry-actions">
          <button
            className="primary-button"
            type="button"
            onClick={continueToCompanion}
          >
            {hi ? "जारी रखें" : "Continue"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onUseDemo}
          >
            {hi ? "डेमो पावती का उपयोग करें" : "Use demo acknowledgement"}
          </button>
        </div>
        <p className="demo-data-note">
          {hi
            ? `${DEMO_OFFICIAL_ACKNOWLEDGEMENT} केवल प्रदर्शन के लिए एक सिंथेटिक पावती है।`
            : `${DEMO_OFFICIAL_ACKNOWLEDGEMENT} is a synthetic acknowledgement for demonstration only.`}
        </p>
      </div>
    </section>
  );
}

type CaseCompanionProps = {
  acknowledgement: AddedAcknowledgement;
  draft: IncidentDraft;
  reporterName: string;
  onRestartDemo?: () => void;
};

export function CaseCompanion({
  acknowledgement,
  draft,
  reporterName,
  onRestartDemo,
}: CaseCompanionProps) {
  const { locale } = useI18n();
  const hi = locale === "hi";
  const [statusText, setStatusText] = useState("");
  const [statusScreenshot, setStatusScreenshot] = useState<File | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusExplanation, setStatusExplanation] =
    useState<ReturnType<typeof explainSuppliedStatus>>(null);
  const stages = getPossibleStages(draft.classification.reportFamily, locale);
  const isFinancialFraud =
    draft.classification.reportFamily === "FINANCIAL_FRAUD";
  const amount = draft.incident.reportedAmount;
  const institution = draft.transactions[0]?.institution;
  const incidentDate = draft.incident.incidentDate;
  const evidenceCount = draft.evidence.length;
  const category =
    draft.officialMapping.categoryLabel ??
    draft.classification.category ??
    (hi ? "साइबर अपराध शिकायत" : "Cybercrime complaint");

  function handleStatusScreenshot(event: ChangeEvent<HTMLInputElement>) {
    setStatusScreenshot(event.target.files?.[0] ?? null);
  }

  function explainStatus() {
    const explanation = explainSuppliedStatus(statusText, locale);
    if (!explanation) {
      setStatusError(
        hi
          ? "समझाने के लिए NCRP पर दिखाई गई स्थिति लिखें।"
          : "Paste the status shown on NCRP so it can be explained.",
      );
      return;
    }
    setStatusError(null);
    setStatusExplanation(explanation);
  }

  const citizenActions = hi
    ? [
        "अपनी पावती संख्या सुरक्षित रखें।",
        "शिकायत में दिए गए फोन और ईमेल पर उपलब्ध रहें।",
        "मूल संदेश, लेन-देन रिकॉर्ड और अन्य सबूत सुरक्षित रखें।",
        ...(isFinancialFraud
          ? [
              "यदि धोखाधड़ी हाल की है और तुरंत वित्तीय सहायता चाहिए, तो 1930 पर कॉल करें।",
            ]
          : []),
      ]
    : [
        "Keep your acknowledgement number safe.",
        "Stay reachable on the phone and email used for the complaint.",
        "Preserve the original message, transaction record and other evidence.",
        ...(isFinancialFraud
          ? [
              "If the fraud is recent and immediate financial help is required, call 1930.",
            ]
          : []),
      ];

  return (
    <main
      className="case-companion section-pad"
      data-journey-focus
      tabIndex={-1}
    >
      <div className="shell reading-shell case-companion-inner">
        <header className="companion-header">
          <p className="companion-eyebrow">
            {hi ? "आपकी शिकायत" : "Your complaint"}
          </p>
          <h1>
            {hi
              ? "आपकी पावती और आगे की जानकारी"
              : "Your acknowledgement and what to expect next"}
          </h1>
          <p>
            {hi
              ? "सचेत केवल आपकी दी हुई जानकारी को व्यवस्थित और समझाता है।"
              : "सचेत organises and explains only the information you provide."}
          </p>
        </header>

        <section
          className="companion-section complaint-summary"
          aria-labelledby="complaint-summary-heading"
        >
          <h2 id="complaint-summary-heading">
            {hi ? "शिकायत का सार" : "Complaint summary"}
          </h2>
          <dl className="companion-summary-list">
            <div className="companion-summary-primary">
              <dt>{hi ? "पावती" : "Acknowledgement"}</dt>
              <dd>{acknowledgement.number}</dd>
            </div>
            <div>
              <dt>{hi ? "शिकायतकर्ता" : "Complainant"}</dt>
              <dd>{reporterName}</dd>
            </div>
            <div>
              <dt>{hi ? "श्रेणी" : "Category"}</dt>
              <dd>{category}</dd>
            </div>
            {amount ? (
              <div>
                <dt>{hi ? "रिपोर्ट की गई राशि" : "Reported amount"}</dt>
                <dd>{formatCurrency(amount)}</dd>
              </div>
            ) : null}
            {institution ? (
              <div>
                <dt>{hi ? "बैंक" : "Bank"}</dt>
                <dd>{institution}</dd>
              </div>
            ) : null}
            {incidentDate ? (
              <div>
                <dt>{hi ? "रिपोर्ट की गई घटना" : "Incident reported"}</dt>
                <dd>{formatIndiaShortDateWithYear(incidentDate, locale)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{hi ? "सबूत" : "Evidence"}</dt>
              <dd>
                {hi
                  ? `${evidenceCount} आइटम`
                  : `${evidenceCount} ${evidenceCount === 1 ? "item" : "items"}`}
              </dd>
            </div>
          </dl>
          {acknowledgement.synthetic ? (
            <p className="synthetic-status-label">
              {hi
                ? "प्रदर्शन के लिए सिंथेटिक पावती"
                : "Synthetic acknowledgement for demonstration"}
            </p>
          ) : null}
        </section>

        <section
          className="companion-section known-status"
          aria-labelledby="known-status-heading"
        >
          <p className="companion-eyebrow">
            {hi ? "हम क्या जानते हैं" : "What we know"}
          </p>
          <h2 id="known-status-heading">
            {hi ? "पावती मिली" : "Acknowledgement received"}
          </h2>
          <p>
            {hi
              ? "आपकी पावती यह पुष्टि करती है कि शिकायत रिपोर्टिंग प्रक्रिया में दर्ज हुई।"
              : "Your acknowledgement confirms that the complaint was recorded through the reporting process."}
          </p>
          <p className="companion-source">
            <strong>{hi ? "स्रोत:" : "Source:"}</strong>{" "}
            {acknowledgement.source === "SYNTHETIC_DEMO"
              ? hi
                ? "सिंथेटिक डेमो पावती"
                : "Synthetic demo acknowledgement"
              : acknowledgement.source === "RECEIPT_SUPPLIED"
                ? hi
                  ? "आपकी दी हुई पावती रसीद"
                  : "Acknowledgement receipt you supplied"
                : hi
                  ? "आपकी दी हुई पावती संख्या"
                  : "Acknowledgement number you supplied"}
            {acknowledgement.receiptName
              ? ` · ${acknowledgement.receiptName}`
              : ""}
          </p>
        </section>

        <section
          className="companion-section"
          aria-labelledby="possible-stages-heading"
        >
          <p className="companion-eyebrow">
            {hi ? "आगे क्या हो सकता है" : "What happens next"}
          </p>
          <h2 id="possible-stages-heading">
            {hi ? "संभावित अगले चरण" : "Possible next stages"}
          </h2>
          <p className="companion-section-note">
            {hi
              ? "ये सामान्य संभावनाएँ हैं, आपकी शिकायत की लाइव स्थिति नहीं।"
              : "These are general possibilities, not a live status timeline for your complaint."}
          </p>
          <ol className="possible-stages-list">
            {stages.map((stage) => (
              <li key={stage.title}>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.explanation}</p>
                  <small>
                    <strong>
                      {hi ? "जिम्मेदार संस्था:" : "Who may handle this:"}
                    </strong>{" "}
                    {stage.owner}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="companion-section"
          aria-labelledby="citizen-actions-heading"
        >
          <p className="companion-eyebrow">
            {hi ? "आप क्या कर सकते हैं" : "What you can do"}
          </p>
          <h2 id="citizen-actions-heading">
            {hi ? "अभी क्या करें" : "What you can do now"}
          </h2>
          <ul className="citizen-actions-list">
            {citizenActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          {isFinancialFraud ? (
            <a className="companion-helpline" href="tel:1930">
              <span>
                {hi
                  ? "वित्तीय साइबर धोखाधड़ी हेल्पलाइन"
                  : "Financial cyber-fraud helpline"}
              </span>
              <strong>{hi ? "1930 पर कॉल करें" : "Call 1930"}</strong>
            </a>
          ) : null}
        </section>

        {isFinancialFraud ? (
          <section
            className="companion-section restrained-process-note"
            aria-labelledby="financial-process-heading"
          >
            <h2 id="financial-process-heading">
              {hi
                ? "धन-वापसी और खाता संबंधी प्रक्रिया"
                : "Money restoration and account issues"}
            </h2>
            <h3>{hi ? "धन-वापसी" : "Money restoration"}</h3>
            <p>
              {hi
                ? "जहाँ धोखाधड़ी की राशि रोकी गई हो और मामला लागू आवश्यकताएँ पूरी करता हो, वहाँ धन-वापसी की प्रक्रिया उपलब्ध हो सकती है।"
                : "Where defrauded funds have been held and the case meets the applicable requirements, restoration processes may be available."}
            </p>
            <h3>
              {hi
                ? "खाता फ्रीज़ या लियन की समस्या?"
                : "Account freeze or lien issue?"}
            </h3>
            <p>
              {hi
                ? "खाता फ्रीज़ या लियन मार्किंग से जुड़ी शिकायतों के लिए अलग शिकायत प्रक्रिया लागू हो सकती है।"
                : "A separate grievance process may apply to complaints involving account freezes or lien markings."}
            </p>
          </section>
        ) : null}

        <section
          className="companion-section status-explainer"
          aria-labelledby="status-explainer-heading"
        >
          <p className="companion-eyebrow">
            {hi ? "नई स्थिति मिली है?" : "Have an updated status?"}
          </p>
          <h2 id="status-explainer-heading">
            {hi ? "अपनी मौजूदा स्थिति समझें" : "Explain my current status"}
          </h2>
          <p>
            {hi
              ? "NCRP पर दिखाई गई स्थिति यहाँ लिखें। सचेत केवल आपके दिए शब्दों को समझाएगा।"
              : "Paste the status shown on NCRP. सचेत will explain only the wording you supply."}
          </p>
          <label htmlFor="supplied-status-text">
            {hi ? "NCRP पर दिखाई गई स्थिति" : "Status shown on NCRP"}
          </label>
          <textarea
            id="supplied-status-text"
            rows={5}
            value={statusText}
            onChange={(event) => {
              setStatusText(event.target.value);
              setStatusError(null);
              setStatusExplanation(null);
            }}
          />
          <label className="status-upload-label" htmlFor="status-screenshot">
            {hi
              ? "स्थिति का स्क्रीनशॉट जोड़ें (वैकल्पिक)"
              : "Add status screenshot (optional)"}
          </label>
          <input
            id="status-screenshot"
            type="file"
            accept="image/*"
            onChange={handleStatusScreenshot}
          />
          {statusScreenshot ? (
            <p className="companion-file-name">
              {hi ? "स्क्रीनशॉट जोड़ा गया:" : "Screenshot added:"}{" "}
              {statusScreenshot.name}
            </p>
          ) : null}
          <p className="field-help">
            {hi
              ? "स्क्रीनशॉट से अपने-आप स्थिति निकालना इस संस्करण में उपलब्ध नहीं है। दिखाई गई स्थिति ऊपर लिखें।"
              : "Automatic screenshot extraction is not included in this version. Paste the visible status above."}
          </p>
          {statusError ? (
            <p className="companion-error" role="alert">
              {statusError}
            </p>
          ) : null}
          <button
            className="primary-button"
            type="button"
            onClick={explainStatus}
          >
            {hi ? "इस स्थिति को समझाएं" : "Explain this status"}
          </button>

          {statusExplanation ? (
            <div className="status-explanation" aria-live="polite">
              <p className="synthetic-status-label">
                {hi ? "आपकी दी हुई स्थिति" : "Status supplied by you"}
              </p>
              <blockquote>{statusExplanation.displayedStatus}</blockquote>
              <h3>{hi ? "सरल अर्थ" : "Plain-language meaning"}</h3>
              <p>{statusExplanation.plainLanguageMeaning}</p>
              <h3>{hi ? "अभी क्या कर सकते हैं" : "What you can do now"}</h3>
              <ul>
                {statusExplanation.citizenCanDoNow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>{hi ? "क्या पता नहीं है" : "What remains unknown"}</h3>
              <ul>
                {statusExplanation.unknowns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="companion-disclosure">
          <strong>
            {hi
              ? "सचेत के पास NCRP शिकायत की लाइव स्थिति का एक्सेस नहीं है।"
              : "सचेत does not have live access to NCRP complaint status."}
          </strong>
          <p>
            {hi
              ? "सचेत एक स्वतंत्र हैकाथॉन प्रोटोटाइप है। आधिकारिक स्थिति NCRP और संबंधित अधिकारियों के पास रहती है। यह पेज केवल नागरिक की दी हुई जानकारी समझाता है।"
              : "सचेत is an independent hackathon prototype. Official complaint status remains with NCRP and the relevant authorities. This page only explains information supplied by the citizen."}
          </p>
        </aside>
        {onRestartDemo ? (
          <div className="companion-restart">
            <button
              className="text-button"
              type="button"
              onClick={onRestartDemo}
            >
              {hi ? "डेमो फिर से शुरू करें" : "Restart demo"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
