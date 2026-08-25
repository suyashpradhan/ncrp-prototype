import type { Metadata } from "next";
import { DemoCaseEntry } from "../components/demo-auth/demo-case-entry";
import { CITIZEN_MESSAGES } from "../content/en";

export const metadata: Metadata = {
  title: "Understand what is happening to your reported money",
};

export default function HomePage() {
  return (
    <section id="check-case" className="service-entry section-pad">
      <div className="shell reading-shell">
        <h1>{CITIZEN_MESSAGES.landing.title.defaultMessage}</h1>
        <p className="lede">{CITIZEN_MESSAGES.landing.intro.defaultMessage}</p>
        <DemoCaseEntry />
      </div>
    </section>
  );
}
