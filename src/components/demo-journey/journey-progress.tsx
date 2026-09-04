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
  const { locale, t } = useI18n();
  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.id === current);
  const submittedLabel = locale === "hi" ? "जमा हुआ" : "Submitted";

  return (
    <ol className="journey-progress" aria-label={t("journey.progressLabel")}>
      {JOURNEY_STEPS.map((step, index) => {
        const completed = index < currentIndex || (index === currentIndex && completeCurrent);
        const currentStep = step.id === current && !completeCurrent;
        return (
        <li
          key={step.id}
          className={currentStep ? "journey-progress-current" : completed ? "journey-progress-complete" : "journey-progress-upcoming"}
          aria-current={currentStep ? "step" : undefined}
        >
          <span className="journey-progress-number" aria-hidden="true">{completed ? "✓" : index + 1}</span>
          <span>
            {step.id === "RESOLUTION" && completeCurrent
              ? submittedLabel
              : t(step.labelKey)}
          </span>
        </li>
        );
      })}
    </ol>
  );
}
