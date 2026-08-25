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
      <p id={clockLabelId} className="clock-primary">
        Day {overdue.elapsedDays} of recorded {overdue.durationDays}-day{clock.stage === "BANK_INTERIM_CUSTODY" ? " bank" : ""} step
      </p>
      {overdue.isOverdue ? (
        <p className="clock-context">
          {overdue.daysOverdue} {overdue.daysOverdue === 1 ? "day" : "days"} beyond the recorded window.
        </p>
      ) : null}
    </div>
  );
}
