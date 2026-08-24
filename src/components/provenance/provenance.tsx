import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { PROVENANCE_SOURCE_MESSAGES, UI_MESSAGES } from "../../content/en";
import { formatProcessRoute } from "../../presentation/format";

export function ProvenanceView({ path }: { path: MoneyPath }) {
  if (path.provenance.length === 0) {
    return (
      <div className="provenance-empty">
        <p>{UI_MESSAGES.detail.provenanceMissing.defaultMessage}</p>
        <Link className="text-link" href="/about#provenance">
          {UI_MESSAGES.detail.provenanceLearnMore.defaultMessage}
        </Link>
      </div>
    );
  }

  return (
    <details className="provenance-details">
      <summary>{UI_MESSAGES.detail.provenance.defaultMessage}</summary>
      <div className="provenance-content">
        <p className="provenance-intro">{UI_MESSAGES.detail.provenanceIntro.defaultMessage}</p>
        {path.provenance.map((source) => (
          <dl
            className="provenance-facts"
            key={`${source.source}-${source.process ?? "general"}-${source.section ?? "general"}`}
          >
            <div>
              <dt>{UI_MESSAGES.detail.provenanceSource.defaultMessage}</dt>
              <dd>{PROVENANCE_SOURCE_MESSAGES[source.source].defaultMessage}</dd>
            </div>
            {source.process ? (
              <div>
                <dt>{UI_MESSAGES.detail.provenanceProcess.defaultMessage}</dt>
                <dd>{formatProcessRoute(source.process)}</dd>
              </div>
            ) : null}
            {source.section ? (
              <div>
                <dt>{UI_MESSAGES.detail.provenanceReference.defaultMessage}</dt>
                <dd>{source.section}</dd>
              </div>
            ) : null}
            <div>
              <dt>{UI_MESSAGES.detail.provenanceNote.defaultMessage}</dt>
              <dd>{source.note}</dd>
            </div>
          </dl>
        ))}
        <Link className="text-link provenance-learn-more" href="/about#provenance">
          {UI_MESSAGES.detail.provenanceLearnMore.defaultMessage}
        </Link>
      </div>
    </details>
  );
}
