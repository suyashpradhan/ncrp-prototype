"use client";

import { useEffect, useState } from "react";
import type { ReportedAmountResolution } from "../../incident/complaint-case";
import type { IncidentDraft } from "../../incident/schema";
import { useI18n } from "../../i18n/i18n-provider";
import { buildCallBrief, getNextActions } from "../../presentation/report-handoff";

async function copyToClipboard(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy is unavailable.");
}

export function ImmediateHandoff({
  draft,
  amountResolution,
}: {
  draft: IncidentDraft;
  amountResolution: ReportedAmountResolution | null;
}) {
  const { locale } = useI18n();
  const [copyState, setCopyState] = useState<"IDLE" | "COPIED" | "ERROR">(
    "IDLE",
  );
  const actions = getNextActions(draft, locale);
  const callBrief = buildCallBrief(draft, { locale, amountResolution });

  useEffect(() => {
    setCopyState("IDLE");
  }, [callBrief]);

  if (actions.length === 0 && !callBrief) return null;

  return (
    <div className="immediate-handoff">
      {actions.length > 0 ? (
        <section className="next-actions" aria-labelledby="next-actions-heading">
          <h2 id="next-actions-heading">
            {locale === "hi" ? "अब क्या करें" : "What to do next"}
          </h2>
          <ol>
            {actions.slice(0, 3).map((action, index) => (
              <li key={action.id}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {callBrief ? (
        <section className="call-brief" aria-labelledby="call-brief-heading">
          <p className="call-brief-eyebrow">
            {locale === "hi" ? "अभी कार्रवाई करें" : "Act now"}
          </p>
          <h2 id="call-brief-heading">
            {locale === "hi" ? "आपकी कॉल के लिए तैयार" : "Ready for your call"}
          </h2>
          <p className="call-brief-intro">
            {locale === "hi"
              ? "पैसे से जुड़ी वित्तीय साइबर धोखाधड़ी की तुरंत 1930 पर रिपोर्ट करें। यह संक्षिप्त विवरण कॉल के दौरान पढ़ा जा सकता है।"
              : "For financial cyber fraud involving money, report it promptly through 1930. You can read this short brief during the call."}
          </p>
          <blockquote>{callBrief}</blockquote>
          <div className="call-brief-actions">
            <a className="primary-button call-1930-button" href="tel:1930">
              {locale === "hi" ? "1930 पर कॉल करें" : "Call 1930"}
            </a>
            <button
              className="secondary-button"
              type="button"
              onClick={async () => {
                try {
                  await copyToClipboard(callBrief);
                  setCopyState("COPIED");
                } catch {
                  setCopyState("ERROR");
                }
              }}
            >
              {locale === "hi" ? "कॉल विवरण कॉपी करें" : "Copy call brief"}
            </button>
          </div>
          <p className="copy-feedback" role="status" aria-live="polite">
            {copyState === "COPIED"
              ? locale === "hi"
                ? "कॉपी हो गया"
                : "Copied"
              : copyState === "ERROR"
                ? locale === "hi"
                  ? "कॉपी नहीं हो सका"
                  : "Could not copy"
                : ""}
          </p>
        </section>
      ) : null}
    </div>
  );
}
