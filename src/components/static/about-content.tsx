"use client";

import { UI_MESSAGES } from "../../content/en";
import { useI18n } from "../../i18n/i18n-provider";

export function AboutContent() {
  const { locale, m, t } = useI18n();

  return (
    <section className="secondary-page section-pad">
      <div className="shell reading-shell">
        <header className="secondary-page-intro">
          <h1>{m(UI_MESSAGES.about.title)}</h1>
          <p>{m(UI_MESSAGES.about.conciseIntro)}</p>
          <p className="service-disclosure">{m(UI_MESSAGES.about.noLiveSystem)}</p>
        </header>

        <div className="secondary-sections">
          <section>
            <h2>{m(UI_MESSAGES.about.existingStagesTitle)}</h2>
            <p>{m(UI_MESSAGES.about.existingStagesBody)}</p>
          </section>
          <section>
            <h2>{m(UI_MESSAGES.about.proposedTitle)}</h2>
            <p>{m(UI_MESSAGES.about.proposedBody)}</p>
          </section>
          <section>
            <h2>{m(UI_MESSAGES.about.dataTitle)}</h2>
            <p>{m(UI_MESSAGES.about.dataBody)}</p>
            <p>{t("about.profile")}</p>
          </section>
          <details id="sources" className="detail-disclosure journey-sources">
            <summary>{m(UI_MESSAGES.footer.sourcesLink)}</summary>
            <div className="detail-disclosure-content">
              <ul>
                <li><a href="https://www.cybercrime.gov.in/" rel="noreferrer">{locale === "hi" ? "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल (एनसीआरपी)" : "National Cyber Crime Reporting Portal (NCRP)"}</a></li>
                <li><a href="https://mrm-ncrp.mha.gov.in/assets/images/MRM_USER_MANUAL.pdf" rel="noreferrer">{locale === "hi" ? "धन वापसी मॉड्यूल नागरिक पुस्तिका" : "Money Restoration Module citizen manual"}</a></li>
                <li><a href="https://www.mha.gov.in/MHA1/Par2017/pdfs/par2026-pdfs/RS04022026/553.pdf" rel="noreferrer">{locale === "hi" ? "सीएफसीएफआरएमएस और जनवरी 2026 की मानक प्रक्रिया पर गृह मंत्रालय की सामग्री" : "Ministry of Home Affairs material on CFCFRMS and the January 2026 SOP"}</a></li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
