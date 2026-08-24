import type { Metadata } from "next";
import { CITIZEN_MESSAGES } from "../../content/en";

export const metadata: Metadata = {
  title: "How this works",
};

export default function HowItWorksPage() {
  return (
    <section className="how-section section-pad">
      <div className="shell narrow-shell">
        <p className="eyebrow">{CITIZEN_MESSAGES.how.eyebrow.defaultMessage}</p>
        <h1>{CITIZEN_MESSAGES.how.title.defaultMessage}</h1>
        <p className="lede">{CITIZEN_MESSAGES.how.intro.defaultMessage}</p>
        <ol className="how-steps">
          {CITIZEN_MESSAGES.how.steps.map((step) => (
            <li key={step.title.key}>
              <h2>{step.title.defaultMessage}</h2>
              <p>{step.body.defaultMessage}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
