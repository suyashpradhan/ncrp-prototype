"use client";

import { useI18n } from "../../i18n/i18n-provider";

export const JOURNEY_STEPS = [
  { id: "REPORT", labelKey: "journey.report" },
  { id: "RESTORE", labelKey: "journey.restoration" },
  { id: "RESOLUTION", labelKey: "journey.resolution" },
] as const;

export type JourneyProgressStep = (typeof JOURNEY_STEPS)[number]["id"];

export function JourneyProgress({
  current,
  completeCurrent = false,
}: {
  current: JourneyProgressStep;
  completeCurrent?: boolean;
}) {
  const { t } = useI18n();
  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="journey-progress" aria-label={t("journey.progressLabel")}>
      {JOURNEY_STEPS.map((step, index) => (
        <li
          key={step.id}
          className={step.id === current && !completeCurrent ? "journey-progress-current" : undefined}
          aria-current={step.id === current && !completeCurrent ? "step" : undefined}
        >
          <span>{t(step.labelKey)}</span>
          {index < currentIndex || (index === currentIndex && completeCurrent) ? (
            <span className="journey-progress-check" aria-label={t("journey.completed")}>✓</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
