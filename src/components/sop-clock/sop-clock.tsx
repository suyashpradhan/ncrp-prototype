import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES, UI_MESSAGES } from "../../content/en";
import { deriveApplicableSopClock, deriveOverdueState } from "../../sop/selectors";

export function SopClockView({ path, now, compact = false }: { path: MoneyPath; now: string; compact?: boolean }) {
  const clock = deriveApplicableSopClock(path);
  const overdue = deriveOverdueState(path, now);

  if (!clock || !overdue) {
    return compact ? null : <p className="no-clock">{CITIZEN_MESSAGES.detail.noClock.defaultMessage}</p>;
  }

  const clockLabelId = `clock-label-${path.id}`;

  if (compact) {
    if (clock.stage === "ACCOUNT_HOLDER_NOTICE" && overdue.isOverdue) {
      return <p className="citizen-clock-summary">This step has crossed its recorded 7-day process window.</p>;
    }

    if (clock.stage === "BANK_INTERIM_CUSTODY") {
      return (
        <p className="citizen-clock-summary">
          Day {overdue.elapsedDays} of the 15-day bank process window.
        </p>
      );
    }

    return (
      <p className="citizen-clock-summary">
        Day {overdue.elapsedDays} of the recorded {clock.durationDays}-day process window.
      </p>
    );
  }

  return (
    <div
      className={`clock ${overdue.isOverdue ? "clock-overdue" : "clock-on-time"}`}
      role="group"
      aria-labelledby={clockLabelId}
    >
      <strong id={clockLabelId}>
        {clock.stage === "ACCOUNT_HOLDER_NOTICE"
          ? CITIZEN_MESSAGES.clock.sopWindow.defaultMessage
          : clock.stage === "BANK_INTERIM_CUSTODY"
            ? CITIZEN_MESSAGES.clock.bankWindow.defaultMessage
            : clock.label.defaultMessage}
      </strong>
      <div className="clock-current">
        <span>{CITIZEN_MESSAGES.clock.currentCase.defaultMessage}: {UI_MESSAGES.clock.day.defaultMessage} {overdue.elapsedDays}.</span>
        {overdue.isOverdue ? (
          <span className="overdue-copy">
            This process step is {overdue.daysOverdue} {overdue.daysOverdue === 1 ? "day" : "days"} beyond that recorded window.
          </span>
        ) : (
          <span>{UI_MESSAGES.clock.withinWindow.defaultMessage}</span>
        )}
      </div>
    </div>
  );
}
