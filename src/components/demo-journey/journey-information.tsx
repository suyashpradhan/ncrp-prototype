import { CITIZEN_MESSAGES, UI_MESSAGES } from "../../content/en";

const OFFICIAL_SOURCES = [
  {
    label: "National Cyber Crime Reporting Portal (NCRP)",
    href: "https://www.cybercrime.gov.in/",
  },
  {
    label: "Money Restoration Module citizen manual",
    href: "https://mrm-ncrp.mha.gov.in/assets/images/MRM_USER_MANUAL.pdf",
  },
  {
    label: "Ministry of Home Affairs material on CFCFRMS and the January 2026 SOP",
    href: "https://www.mha.gov.in/MHA1/Par2017/pdfs/par2026-pdfs/RS04022026/553.pdf",
  },
] as const;

export function JourneyInformation() {
  return (
    <div className="journey-information">
      <section id="how-it-works" className="journey-information-section section-pad" aria-labelledby="how-heading">
        <div className="shell reading-shell">
          <h2 id="how-heading">{CITIZEN_MESSAGES.how.title.defaultMessage}</h2>
          <ol className="how-steps">
            {CITIZEN_MESSAGES.how.steps.map((step) => (
              <li key={step.title.key}>
                <h3>{step.title.defaultMessage}</h3>
                <p>{step.body.defaultMessage}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="journey-information-section section-pad" aria-labelledby="about-heading">
        <div className="shell reading-shell">
          <h2 id="about-heading">{UI_MESSAGES.about.title.defaultMessage}</h2>
          <p>{UI_MESSAGES.about.intro.defaultMessage}</p>
          <dl className="about-summary">
            <div>
              <dt>{UI_MESSAGES.about.existingStagesTitle.defaultMessage}</dt>
              <dd>{UI_MESSAGES.about.existingStagesBody.defaultMessage}</dd>
            </div>
            <div>
              <dt>{UI_MESSAGES.about.proposedTitle.defaultMessage}</dt>
              <dd>{UI_MESSAGES.about.proposedBody.defaultMessage}</dd>
            </div>
            <div>
              <dt>{UI_MESSAGES.about.dataTitle.defaultMessage}</dt>
              <dd>{UI_MESSAGES.about.dataBody.defaultMessage}</dd>
            </div>
          </dl>
          <p className="service-disclosure">{UI_MESSAGES.about.noLiveSystem.defaultMessage}</p>

          <details id="sources" className="detail-disclosure journey-sources">
            <summary>{UI_MESSAGES.footer.sourcesLink.defaultMessage}</summary>
            <div className="detail-disclosure-content">
              <ul>
                {OFFICIAL_SOURCES.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} rel="noreferrer">{source.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
