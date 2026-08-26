import type { Metadata } from "next";
import { UI_MESSAGES } from "../../content/en";

export const metadata: Metadata = {
  title: "About this prototype",
  description: "What the independent Financial Cyber Fraud Reporting prototype represents.",
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
            <h2>{UI_MESSAGES.about.existingStagesTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.existingStagesBody.defaultMessage}</p>
          </section>

          <section>
            <h2>{UI_MESSAGES.about.proposedTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.proposedBody.defaultMessage}</p>
          </section>

          <section>
            <h2>{UI_MESSAGES.about.dataTitle.defaultMessage}</h2>
            <p>{UI_MESSAGES.about.dataBody.defaultMessage}</p>
          </section>

          <details id="sources" className="detail-disclosure journey-sources">
            <summary>{UI_MESSAGES.footer.sourcesLink.defaultMessage}</summary>
            <div className="detail-disclosure-content">
              <ul>
                <li><a href="https://www.cybercrime.gov.in/" rel="noreferrer">National Cyber Crime Reporting Portal (NCRP)</a></li>
                <li><a href="https://mrm-ncrp.mha.gov.in/assets/images/MRM_USER_MANUAL.pdf" rel="noreferrer">Money Restoration Module citizen manual</a></li>
                <li><a href="https://www.mha.gov.in/MHA1/Par2017/pdfs/par2026-pdfs/RS04022026/553.pdf" rel="noreferrer">Ministry of Home Affairs material on CFCFRMS and the January 2026 SOP</a></li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
