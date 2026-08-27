"use client";

import { useEffect, useState } from "react";
import type { RouteSpecificDraft } from "../../incident/route-demos";
import {
  requirementsByReportType,
  type ReportTabId,
} from "../../incident/report-types";
import { useI18n } from "../../i18n/i18n-provider";

type ReportingPreference = "ANONYMOUS" | "WITH_DETAILS";

function RouteProgress({ review = false }: { review?: boolean }) {
  const { locale } = useI18n();
  const labels =
    locale === "hi"
      ? ["बताएं", "जाँचें", "जमा करें"]
      : ["Tell us", "Review", "Submit"];
  return (
    <ol
      className="journey-progress"
      aria-label={locale === "hi" ? "रिपोर्ट की प्रगति" : "Report progress"}
    >
      {labels.map((label, index) => (
        <li
          key={label}
          className={
            index === (review ? 1 : 0) ? "journey-progress-current" : undefined
          }
          aria-current={index === (review ? 1 : 0) ? "step" : undefined}
        >
          <span>{label}</span>
          {index < (review ? 1 : 0) ? (
            <span
              className="journey-progress-check"
              aria-label={locale === "hi" ? "पूरा" : "Completed"}
            >
              ✓
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

const TAB_COPY: Record<ReportTabId, [string, string]> = {
  INCIDENT: ["Incident", "घटना"],
  TRANSACTION: ["Transaction", "लेन-देन"],
  ACCOUNT_PLATFORM: ["Account & platform", "अकाउंट और मंच"],
  EVIDENCE_SUSPECT: ["Evidence & suspect", "सबूत और संदिग्ध जानकारी"],
  SENSITIVE_EVIDENCE: ["Sensitive evidence", "संवेदनशील सबूत"],
  SUSPECT: ["Suspect", "संदिग्ध जानकारी"],
  YOUR_DETAILS: ["Your details", "आपकी जानकारी"],
  REPORTING_PREFERENCE: ["Reporting preference", "रिपोर्ट करने का तरीका"],
};

const FIELD_COPY: Record<string, [string, string]> = {
  "route.category": ["Complaint category", "शिकायत की श्रेणी"],
  "route.subCategory": [
    "Supported prototype path",
    "समर्थित प्रोटोटाइप रास्ता",
  ],
  "route.incidentDate": ["Incident date and time", "घटना की तारीख और समय"],
  "route.accessLost": ["Access lost?", "क्या प्रवेश बंद है?"],
  "route.platform": ["Platform", "मंच"],
  "route.affectedAccount": ["Affected account", "प्रभावित अकाउंट"],
  "route.accessStatus": ["Access status", "अकाउंट की स्थिति"],
  "route.recoveryChanged": [
    "Recovery information changed?",
    "क्या रिकवरी जानकारी बदली गई?",
  ],
  "route.recoveryContact": ["Known recovery contact", "ज्ञात रिकवरी संपर्क"],
  "route.evidence": ["Evidence supplied", "दिया गया सबूत"],
  "route.suspect": ["Suspect information", "संदिग्ध जानकारी"],
  "route.name": ["Name", "नाम"],
  "route.mobile": ["Registered mobile", "पंजीकृत मोबाइल"],
  "route.location": ["Location", "स्थान"],
  "route.safety": ["Safety note", "सुरक्षा सूचना"],
  "route.url": ["URL", "वेब पता"],
  "route.occurredOn": ["Where it happened", "घटना कहाँ हुई"],
  "route.preference": ["Reporting preference", "रिपोर्ट करने का तरीका"],
  "route.identity": ["Identity information", "पहचान की जानकारी"],
};

export function RouteSpecificWorkspace({
  draft,
  isDemo,
  initialDescription,
  initialReview = false,
  onBack,
  onComplete,
}: {
  draft: RouteSpecificDraft;
  isDemo: boolean;
  initialDescription: string;
  initialReview?: boolean;
  onBack: () => void;
  onComplete: (reference: string) => void;
}) {
  const { locale } = useI18n();
  const copy = (en: string, hi: string) => (locale === "hi" ? hi : en);
  const definition = requirementsByReportType[draft.reportType];
  const [activeTab, setActiveTab] = useState(definition.tabs[0]);
  const [description, setDescription] = useState(
    initialDescription ||
      (isDemo
        ? locale === "hi"
          ? draft.descriptionHi
          : draft.descriptionEn
        : ""),
  );
  const [preference, setPreference] = useState<ReportingPreference | null>(
    draft.reportType === "WOMEN_CHILDREN_RELATED_CRIME" ? null : "WITH_DETAILS",
  );
  const [reviewing, setReviewing] = useState(initialReview);
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setDescription(
        locale === "hi" ? draft.descriptionHi : draft.descriptionEn,
      );
    }
  }, [draft.descriptionEn, draft.descriptionHi, isDemo, locale]);

  if (draft.reportType === "WOMEN_CHILDREN_RELATED_CRIME" && !preference) {
    return (
      <section className="route-entry section-pad">
        <div className="shell reading-shell route-entry-surface">
          <button className="text-button" type="button" onClick={onBack}>
            ← {copy("Back", "वापस")}
          </button>
          <h1>
            {copy(
              "How would you like to report?",
              "आप किस तरह रिपोर्ट करना चाहते हैं?",
            )}
          </h1>
          <p>
            {copy(
              "Choose the identity model for this sensitive reporting path.",
              "इस संवेदनशील रिपोर्ट के लिए पहचान का तरीका चुनें।",
            )}
          </p>
          <div className="route-choice-grid">
            <button
              type="button"
              className="route-choice"
              onClick={() => setPreference("ANONYMOUS")}
            >
              <strong>
                {copy("Report anonymously", "गुमनाम रिपोर्ट करें")}
              </strong>
              <span>
                {copy(
                  "No citizen profile will be loaded.",
                  "नागरिक प्रोफ़ाइल लोड नहीं की जाएगी।",
                )}
              </span>
            </button>
            <button
              type="button"
              className="route-choice"
              onClick={() => setPreference("WITH_DETAILS")}
            >
              <strong>
                {copy("Report with details", "जानकारी के साथ रिपोर्ट करें")}
              </strong>
              <span>
                {copy(
                  "Use the synthetic profile in this prototype.",
                  "इस प्रोटोटाइप की काल्पनिक प्रोफ़ाइल उपयोग करें।",
                )}
              </span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const effectiveFields = (tab: ReportTabId) => {
    const fields = draft.fields[tab] ?? [];
    if (tab === "REPORTING_PREFERENCE") {
      return preference === "ANONYMOUS"
        ? fields
        : [
            {
              labelKey: "route.preference",
              valueEn: "Report with details",
              valueHi: "जानकारी के साथ रिपोर्ट",
            },
            {
              labelKey: "route.identity",
              valueEn: "Suyash Pradhan · synthetic profile",
              valueHi: "सुयश प्रधान · काल्पनिक प्रोफ़ाइल",
            },
          ];
    }
    if (isDemo) return fields;
    return fields.map((field, index) =>
      tab === "INCIDENT" && index < 2
        ? field
        : { ...field, valueEn: "Not provided", valueHi: "नहीं दिया गया" },
    );
  };

  if (reviewing) {
    return (
      <section className="route-workspace-stage section-pad">
        <div className="shell route-workspace-shell">
          <RouteProgress review />
          <article className="route-review-surface">
            <h1>{copy("Review your report", "अपनी रिपोर्ट जाँचें")}</h1>
            <p>{locale === "hi" ? draft.titleHi : draft.titleEn}</p>
            {definition.tabs.map((tab) => (
              <details
                key={tab}
                className="report-review-group"
                open={tab === "INCIDENT"}
              >
                <summary>
                  <span>{copy(...TAB_COPY[tab])}</span>
                  <strong>✓</strong>
                </summary>
                <div className="report-review-group-content">
                  {tab === "INCIDENT" ? <p>{description}</p> : null}
                  {effectiveFields(tab).map((field) => (
                    <div
                      className="review-field-row"
                      key={`${tab}-${field.labelKey}`}
                    >
                      <span>
                        {copy(
                          ...(FIELD_COPY[field.labelKey] ?? [
                            field.labelKey,
                            field.labelKey,
                          ]),
                        )}
                      </span>
                      <strong>
                        {locale === "hi" ? field.valueHi : field.valueEn}
                      </strong>
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <label className="report-declaration">
              <input
                type="checkbox"
                checked={declared}
                onChange={(event) => setDeclared(event.target.checked)}
              />
              <span>
                {copy(
                  "I have reviewed this synthetic report and confirm the information shown is correct for the demo.",
                  "मैंने इस काल्पनिक रिपोर्ट की जाँच कर ली है और पुष्टि करता/करती हूँ कि दिखाई गई जानकारी डेमो के लिए सही है।",
                )}
              </span>
            </label>
            <div className="entry-actions">
              <button
                className="primary-button"
                type="button"
                disabled={!declared}
                onClick={() => onComplete(draft.reference)}
              >
                {copy("Submit synthetic report", "काल्पनिक रिपोर्ट जमा करें")}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setReviewing(false)}
              >
                {copy("Back to edit", "जानकारी बदलें")}
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="route-workspace-stage section-pad">
      <div className="shell route-workspace-shell">
        <RouteProgress />
        <div className="route-workspace">
          <section className="route-provided-pane">
            <button className="text-button" type="button" onClick={onBack}>
              ← {copy("Back", "वापस")}
            </button>
            <p className="service-stage-label">
              {copy(...TAB_COPY[definition.tabs[0]])}
            </p>
            <h1>{locale === "hi" ? draft.titleHi : draft.titleEn}</h1>
            <label className="route-description-field">
              <span>{copy("What happened?", "क्या हुआ?")}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
              />
            </label>
            {isDemo ? (
              <div
                className={`route-evidence-placeholder route-evidence-${draft.evidenceKind.toLowerCase()}`}
              >
                <strong>
                  {draft.evidenceKind === "REDACTED"
                    ? copy("REDACTED DEMO EVIDENCE", "डेमो सबूत छिपाया गया है")
                    : copy(
                        "Synthetic account-compromise evidence",
                        "अकाउंट पर कब्ज़े का काल्पनिक सबूत",
                      )}
                </strong>
                <span>
                  {copy("Synthetic demo evidence", "काल्पनिक डेमो सबूत")}
                </span>
              </div>
            ) : null}
          </section>
          <section className="route-prepared-pane">
            <h2>
              {copy("Information being prepared", "तैयार की जा रही जानकारी")}
            </h2>
            <p>
              {copy(
                "The reporting requirements change for this type of incident.",
                "इस प्रकार की घटना के लिए रिपोर्टिंग जानकारी अलग है।",
              )}
            </p>
            <div
              className="report-detail-tabs"
              role="group"
              aria-label={copy("Report sections", "रिपोर्ट के भाग")}
            >
              {definition.tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                >
                  <span>{copy(...TAB_COPY[tab])}</span>
                  <small>
                    {isDemo
                      ? `✓ ${copy("Ready", "तैयार")}`
                      : copy("Review", "जाँचें")}
                  </small>
                </button>
              ))}
            </div>
            <div className="route-field-group">
              {activeTab === "INCIDENT" ? (
                <p className="route-description-summary">
                  {description ||
                    copy(
                      "Describe what happened to continue.",
                      "आगे बढ़ने के लिए बताएं कि क्या हुआ।",
                    )}
                </p>
              ) : null}
              {effectiveFields(activeTab).map((field) => (
                <div
                  className="route-field"
                  key={`${activeTab}-${field.labelKey}`}
                >
                  <span>
                    {copy(
                      ...(FIELD_COPY[field.labelKey] ?? [
                        field.labelKey,
                        field.labelKey,
                      ]),
                    )}
                  </span>
                  <strong>
                    {locale === "hi" ? field.valueHi : field.valueEn}
                  </strong>
                </div>
              ))}
            </div>
            <button
              className="primary-button route-review-action"
              type="button"
              disabled={!description.trim()}
              onClick={() => setReviewing(true)}
            >
              {copy("Review & continue", "जाँचें और आगे बढ़ें")}
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}
