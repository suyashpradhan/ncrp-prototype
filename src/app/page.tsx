import type { Metadata } from "next";
import Link from "next/link";
import { CITIZEN_MESSAGES, UI_MESSAGES } from "../content/en";

export const metadata: Metadata = {
  title: "Understand what is happening to your reported money",
};

export default function HomePage() {
  return (
    <>
      <section className="public-hero section-pad">
        <div className="shell public-hero-layout">
          <div className="public-hero-copy">
            <p className="eyebrow">{CITIZEN_MESSAGES.landing.eyebrow.defaultMessage}</p>
            <h1>{CITIZEN_MESSAGES.landing.title.defaultMessage}</h1>
            <p className="lede">{CITIZEN_MESSAGES.landing.intro.defaultMessage}</p>
            <Link className="button-link landing-primary" href="/login">
              {CITIZEN_MESSAGES.landing.primaryAction.defaultMessage}
            </Link>
            <p className="landing-disclosure">
              {UI_MESSAGES.prototype.shortDisclosure.defaultMessage}
            </p>
          </div>

          <aside className="answer-preview" aria-label={CITIZEN_MESSAGES.landing.simpleAnswer.defaultMessage}>
            <p>{CITIZEN_MESSAGES.landing.simpleAnswer.defaultMessage}</p>
            <ul>
              {CITIZEN_MESSAGES.landing.answers.map((answer) => (
                <li key={answer.key}><span aria-hidden="true">✓</span>{answer.defaultMessage}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="landing-context section-pad">
        <div className="shell narrow-shell">
          <h2>{CITIZEN_MESSAGES.landing.alreadyReported.defaultMessage}</h2>
          <p>{CITIZEN_MESSAGES.landing.afterReporting.defaultMessage}</p>
        </div>
      </section>
    </>
  );
}
