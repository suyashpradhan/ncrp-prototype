"use client";

import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { PROVENANCE_SOURCE_MESSAGES, UI_MESSAGES } from "../../content/en";
import { formatProcessRoute } from "../../presentation/format";
import { useI18n } from "../../i18n/i18n-provider";

export function ProvenanceView({ path, collapsible = true }: { path: MoneyPath; collapsible?: boolean }) {
  const { locale, m } = useI18n();
  if (path.provenance.length === 0) {
    return (
      <div className="provenance-empty">
        <p>{m(UI_MESSAGES.detail.provenanceMissing)}</p>
        <Link className="text-link" href="/about#provenance">
          {m(UI_MESSAGES.detail.provenanceLearnMore)}
        </Link>
      </div>
    );
  }

  const content = (
    <div className="provenance-content">
        <p className="provenance-intro">{m(UI_MESSAGES.detail.provenanceIntro)}</p>
        {path.provenance.map((source) => (
          <dl
            className="provenance-facts"
            key={`${source.source}-${source.process ?? "general"}-${source.section ?? "general"}`}
          >
            <div>
              <dt>{m(UI_MESSAGES.detail.provenanceSource)}</dt>
              <dd>{m(PROVENANCE_SOURCE_MESSAGES[source.source])}</dd>
            </div>
            {source.process ? (
              <div>
                <dt>{m(UI_MESSAGES.detail.provenanceProcess)}</dt>
                <dd>{locale === "hi" ? formatProcessRoute(source.process).replace("Process", "प्रक्रिया") : formatProcessRoute(source.process)}</dd>
              </div>
            ) : null}
            {source.section ? (
              <div>
                <dt>{m(UI_MESSAGES.detail.provenanceReference)}</dt>
                <dd>{locale === "hi" ? source.section.replace("Process", "प्रक्रिया").replace("Section", "धारा").replace("synthetic record", "काल्पनिक रिकॉर्ड") : source.section}</dd>
              </div>
            ) : null}
            <div>
              <dt>{m(UI_MESSAGES.detail.provenanceNote)}</dt>
              <dd>{locale === "hi" ? "यह प्रक्रिया और इसके तथ्य काल्पनिक आधिकारिक केस जानकारी हैं; ये प्रोटोटाइप का निर्णय नहीं हैं।" : source.note}</dd>
            </div>
          </dl>
        ))}
        <Link className="text-link provenance-learn-more" href="/about#provenance">
          {m(UI_MESSAGES.detail.provenanceLearnMore)}
        </Link>
    </div>
  );

  if (!collapsible) return content;

  return (
    <details className="provenance-details">
      <summary>{m(UI_MESSAGES.detail.provenance)}</summary>
      {content}
    </details>
  );
}
