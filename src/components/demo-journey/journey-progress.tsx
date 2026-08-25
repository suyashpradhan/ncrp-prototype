import { CITIZEN_MESSAGES } from "../../content/en";

const JOURNEY_STEPS = [
  { id: "ACT", label: { defaultMessage: "Act" } },
  { id: "REPORT", label: CITIZEN_MESSAGES.journey.progressReport },
  { id: "RESTORE", label: CITIZEN_MESSAGES.journey.progressRestore },
  { id: "RESOLVE", label: { defaultMessage: "Resolve" } },
] as const;

export type JourneyProgressStep = (typeof JOURNEY_STEPS)[number]["id"];

export function JourneyProgress({ current }: { current: JourneyProgressStep }) {
  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="journey-progress" aria-label="Act, report, restore and resolve journey">
      {JOURNEY_STEPS.map((step, index) => (
        <li
          key={step.id}
          className={step.id === current ? "journey-progress-current" : undefined}
          aria-current={step.id === current ? "step" : undefined}
        >
          {step.label.defaultMessage}
          {index < currentIndex ? <span className="journey-progress-check" aria-label="completed">✓</span> : null}
          {index < JOURNEY_STEPS.length - 1 ? <span aria-hidden="true">→</span> : null}
        </li>
      ))}
    </ol>
  );
}
