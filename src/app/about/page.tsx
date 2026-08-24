import type { Metadata } from "next";
import { UI_MESSAGES } from "../../content/en";

export const metadata: Metadata = {
  title: "About this prototype",
  description: "What Money Path represents, what is synthetic, and how process provenance is shown.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-intro section-pad about-hero">
        <div className="shell narrow-shell">
          <p className="eyebrow">{UI_MESSAGES.about.eyebrow.defaultMessage}</p>
          <h1>{UI_MESSAGES.about.title.defaultMessage}</h1>
          <p className="lede">{UI_MESSAGES.about.intro.defaultMessage}</p>

          <aside className="prototype-disclosure-card" aria-labelledby="prototype-disclosure-heading">
            <span className="prototype-disclosure-mark" aria-hidden="true">SYN</span>
            <div>
              <h2 id="prototype-disclosure-heading">
                {UI_MESSAGES.about.disclosureTitle.defaultMessage}
              </h2>
              <p>{UI_MESSAGES.about.disclosureBody.defaultMessage}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-pad about-comparison-section">
        <div className="shell narrow-shell about-grid">
          <article className="about-card about-modeled-card">
            <p className="eyebrow">{UI_MESSAGES.about.modeledEyebrow.defaultMessage}</p>
            <h2>{UI_MESSAGES.about.modeledTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.modeledIntro.defaultMessage}</p>
            <ul className="about-list">
              {UI_MESSAGES.about.modeledItems.map((item) => (
                <li key={item.key}>{item.defaultMessage}</li>
              ))}
            </ul>
          </article>

          <article className="about-card about-synthetic-card">
            <p className="eyebrow">{UI_MESSAGES.about.syntheticEyebrow.defaultMessage}</p>
            <h2>{UI_MESSAGES.about.syntheticTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.syntheticIntro.defaultMessage}</p>
            <ul className="about-list">
              {UI_MESSAGES.about.syntheticItems.map((item) => (
                <li key={item.key}>{item.defaultMessage}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad about-boundaries-section" aria-labelledby="prototype-boundaries-heading">
        <div className="shell narrow-shell about-boundaries-layout">
          <div>
            <p className="eyebrow">{UI_MESSAGES.about.boundariesEyebrow.defaultMessage}</p>
            <h2 id="prototype-boundaries-heading">{UI_MESSAGES.about.boundariesTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.boundariesIntro.defaultMessage}</p>
          </div>
          <ul className="boundary-list">
            {UI_MESSAGES.about.boundaryItems.map((item) => (
              <li key={item.key}>{item.defaultMessage}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="provenance" className="section-pad about-provenance-section" aria-labelledby="prototype-provenance-heading">
        <div className="shell narrow-shell about-provenance-card">
          <p className="eyebrow">{UI_MESSAGES.about.provenanceEyebrow.defaultMessage}</p>
          <h2 id="prototype-provenance-heading">{UI_MESSAGES.about.provenanceTitle.defaultMessage}</h2>
          <p>{UI_MESSAGES.about.provenanceBody.defaultMessage}</p>
          <p className="about-principle">{UI_MESSAGES.about.principle.defaultMessage}</p>
        </div>
      </section>
    </>
  );
}
