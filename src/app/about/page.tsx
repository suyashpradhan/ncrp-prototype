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
          <p className="lede">{UI_MESSAGES.about.intro.defaultMessage}</p>
          <p className="service-disclosure">No live NCRP, police or banking system is connected.</p>
        </header>

        <div className="secondary-sections">
          <section id="provenance">
            <h2>{UI_MESSAGES.about.modeledTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.modeledIntro.defaultMessage}</p>
            <ul>
              {UI_MESSAGES.about.modeledItems.map((item) => (
                <li key={item.key}>{item.defaultMessage}</li>
              ))}
            </ul>
            <p className="source-note">Source represented in the prototype: January 2026 NCRP-CFCFRMS SOP.</p>
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
        </div>
      </div>
    </section>
  );
}
