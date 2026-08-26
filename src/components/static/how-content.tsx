"use client";

import { useI18n } from "../../i18n/i18n-provider";

export function HowContent() {
  const { t } = useI18n();
  const steps = [
    ["how.oneTitle", "how.oneBody"],
    ["how.twoTitle", "how.twoBody"],
    ["how.threeTitle", "how.threeBody"],
  ] as const;

  return (
    <section className="secondary-page section-pad">
      <div className="shell reading-shell">
        <h1>{t("how.title")}</h1>
        <ol className="how-steps">
          {steps.map(([title, body]) => (
            <li key={title}>
              <h2>{t(title)}</h2>
              <p>{t(body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
