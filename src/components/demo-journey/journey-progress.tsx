export const JOURNEY_STEPS = [
  { id: "REPORT", label: "Report" },
  { id: "RESTORE", label: "Restoration" },
  { id: "RESOLUTION", label: "Resolution" },
] as const;

export type JourneyProgressStep = (typeof JOURNEY_STEPS)[number]["id"];

export function JourneyProgress({
  current,
  completeCurrent = false,
}: {
  current: JourneyProgressStep;
  completeCurrent?: boolean;
}) {
  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="journey-progress" aria-label="Service journey progress">
      {JOURNEY_STEPS.map((step, index) => (
        <li
          key={step.id}
          className={step.id === current && !completeCurrent ? "journey-progress-current" : undefined}
          aria-current={step.id === current && !completeCurrent ? "step" : undefined}
        >
          <span>{step.label}</span>
          {index < currentIndex || (index === currentIndex && completeCurrent) ? (
            <span className="journey-progress-check" aria-label="completed">✓</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
