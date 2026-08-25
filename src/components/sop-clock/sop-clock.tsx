import type { MoneyPath } from "../../domain/case";
import { deriveApplicableSopClock, deriveOverdueState } from "../../sop/selectors";

export function SopClockView({ path, now }: { path: MoneyPath; now: string }) {
  const clock = deriveApplicableSopClock(path);
  const overdue = deriveOverdueState(path, now);

  if (!clock || !overdue) {
    return null;
  }

  const clockLabelId = `clock-label-${path.id}`;

  return (
    <div
      className="citizen-clock-detail"
      role="group"
      aria-labelledby={clockLabelId}
    >
      <p id={clockLabelId}>
        {clock.stage === "BANK_INTERIM_CUSTODY"
          ? `The recorded bank process requires action within ${overdue.durationDays} calendar days after receiving the direction.`
          : <>Recorded process window: <strong>{overdue.durationDays} calendar days</strong></>}
      </p>
      <p className="clock-primary">Current synthetic case: <strong>Day {overdue.elapsedDays}</strong></p>
      {overdue.isOverdue ? (
        <p className="clock-context">
          This step is currently {overdue.daysOverdue} {overdue.daysOverdue === 1 ? "day" : "days"} beyond its recorded process window.
        </p>
      ) : null}
    </div>
  );
}
