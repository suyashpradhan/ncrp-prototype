import type { Metadata } from "next";
import { UI_MESSAGES } from "../../content/en";

export const metadata: Metadata = {
  title: "About this prototype",
  description: "What NCRP Recovery represents, what is synthetic, and how process provenance is shown.",
};

export default function AboutPage() {
  return (
    <section className="secondary-page section-pad">
      <div className="shell reading-shell">
        <header className="secondary-page-intro">
          <h1>{UI_MESSAGES.about.title.defaultMessage}</h1>
          <p>{UI_MESSAGES.about.conciseIntro.defaultMessage}</p>
          <p className="service-disclosure">{UI_MESSAGES.about.noLiveSystem.defaultMessage}</p>
        </header>

        <div className="secondary-sections">
          <section>
            <h2>{UI_MESSAGES.about.modeledTitle.defaultMessage}</h2>
            <ul>
              {UI_MESSAGES.about.modeledItems.slice(0, 3).map((item) => (
                <li key={item.key}>{item.defaultMessage}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{UI_MESSAGES.about.syntheticTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.syntheticIntro.defaultMessage}</p>
            <ul>
              {UI_MESSAGES.about.syntheticItems.map((item) => (
                <li key={item.key}>{item.defaultMessage}</li>
              ))}
            </ul>
          </section>

          <details className="detail-disclosure">
            <summary>{UI_MESSAGES.about.boundariesTitle.defaultMessage}</summary>
            <div className="detail-disclosure-content">
              <p>{UI_MESSAGES.about.boundariesIntro.defaultMessage}</p>
              <ul>
                {UI_MESSAGES.about.boundaryItems.map((item) => (
                  <li key={item.key}>{item.defaultMessage}</li>
                ))}
              </ul>
            </div>
          </details>

          <details id="provenance" className="detail-disclosure">
            <summary>{UI_MESSAGES.about.provenanceSummary.defaultMessage}</summary>
            <div className="detail-disclosure-content">
              <p>{UI_MESSAGES.about.provenanceBody.defaultMessage}</p>
              <p className="source-note">Source represented in the prototype: January 2026 NCRP-CFCFRMS SOP.</p>
            </div>
          </details>

          <details className="detail-disclosure">
            <summary>{UI_MESSAGES.about.principleSummary.defaultMessage}</summary>
            <div className="detail-disclosure-content">
              <p>{UI_MESSAGES.about.principle.defaultMessage}</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
