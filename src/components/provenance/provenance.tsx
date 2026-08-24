import type { MoneyPath } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { formatProcessRoute } from "../../presentation/format";

export function ProvenanceView({ path }: { path: MoneyPath }) {
  if (path.provenance.length === 0) return null;

  return (
    <details className="provenance-details">
      <summary>{UI_MESSAGES.detail.provenance.defaultMessage}</summary>
      <div className="provenance-content">
        <p>{UI_MESSAGES.common.basedOnSop.defaultMessage}</p>
        {path.provenance.map((source) => (
          <div key={`${source.source}-${source.process ?? "general"}`}>
            {source.process ? <p><strong>{formatProcessRoute(source.process)}</strong></p> : null}
            {source.section ? <p>{source.section}</p> : null}
            <p>{source.note}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
