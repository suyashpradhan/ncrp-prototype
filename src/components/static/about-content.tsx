"use client";

import { useI18n } from "../../i18n/i18n-provider";

export function AboutContent() {
  const { locale } = useI18n();
  const hi = locale === "hi";

  return (
    <section className="secondary-page section-pad">
      <div className="shell reading-shell">
        <header className="secondary-page-intro">
          <h1>{hi ? "सचेत के बारे में" : "About सचेत"}</h1>
          <p>
            {hi
              ? "सचेत एक स्वतंत्र हैकाथॉन प्रोटोटाइप है, जो वित्तीय साइबर धोखाधड़ी की रिपोर्ट तैयार करने का आसान तरीका खोजता है।"
              : "सचेत is an independent hackathon prototype exploring a simpler way to prepare financial cyber-fraud reports."}
          </p>
        </header>

        <div className="secondary-sections">
          <section>
            <h2>{hi ? "मौजूदा प्रोटोटाइप" : "Current prototype"}</h2>
            <p>
              {hi
                ? "केवल वित्तीय साइबर धोखाधड़ी।"
                : "Financial cyber fraud only."}
            </p>
            <p>
              {hi
                ? "नागरिक अपनी घटना बोलकर, लिखकर या सबूत जोड़कर बता सकता है। सचेत व्यवस्थित रिपोर्ट तैयार करता है, बाकी जरूरी जानकारी पूछता है और जमा करने से पहले नागरिक को जाँचने देता है।"
                : "A citizen can speak, type or add evidence. सचेत prepares structured reporting information, asks only for unresolved details and keeps the citizen in control of the final review."}
            </p>
          </section>

          <section>
            <h2>
              {hi ? "भविष्य में संभावित खोज" : "Potential future exploration"}
            </h2>
            <ul>
              <li>
                {hi
                  ? "अन्य साइबर अपराध श्रेणियाँ"
                  : "Other cybercrime reporting categories"}
              </li>
              <li>
                {hi
                  ? "महिला/बच्चों से जुड़ी रिपोर्टिंग"
                  : "Women/children-related reporting experiences"}
              </li>
              <li>{hi ? "अधिक भाषाएँ" : "Multilingual expansion"}</li>
            </ul>
          </section>

          <section>
            <h2>{hi ? "प्रोटोटाइप की सीमाएँ" : "Prototype boundaries"}</h2>
            <p>
              {hi
                ? "सारी डेमो जानकारी काल्पनिक है। सचेत एनसीआरपी, आई4सी या गृह मंत्रालय से संबद्ध नहीं है। कोई सरकारी प्रणाली जुड़ी नहीं है और कोई वास्तविक शिकायत जमा नहीं होती।"
                : "All demo information is synthetic. सचेत is not affiliated with NCRP, I4C or the Ministry of Home Affairs. No government system is connected and no real complaint is submitted."}
            </p>
          </section>

          <details id="sources" className="detail-disclosure journey-sources">
            <summary>{hi ? "स्रोत" : "Sources"}</summary>
            <div className="detail-disclosure-content">
              <ul>
                <li>
                  <a href="https://www.cybercrime.gov.in/" rel="noreferrer">
                    {hi
                      ? "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल"
                      : "National Cyber Crime Reporting Portal"}
                  </a>
                </li>
                <li>
                  <a href="https://i4c.mha.gov.in/" rel="noreferrer">
                    {hi
                      ? "भारतीय साइबर अपराध समन्वय केंद्र"
                      : "Indian Cyber Crime Coordination Centre"}
                  </a>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
