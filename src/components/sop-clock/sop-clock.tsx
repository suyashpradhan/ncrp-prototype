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
      return <p className="citizen-clock-summary">This step is currently on Day {overdue.elapsedDays} of its recorded 7-day process window.</p>;
    }

    if (clock.stage === "BANK_INTERIM_CUSTODY") {
      return (
        <p className="citizen-clock-summary">
          Day {overdue.elapsedDays} of the bank&apos;s recorded 15-day process window.
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
      className="citizen-clock-detail"
      role="group"
      aria-labelledby={clockLabelId}
    >
      <p id={clockLabelId}>
        {clock.stage === "ACCOUNT_HOLDER_NOTICE"
          ? CITIZEN_MESSAGES.clock.sopWindow.defaultMessage
          : clock.stage === "BANK_INTERIM_CUSTODY"
            ? CITIZEN_MESSAGES.clock.bankWindow.defaultMessage
            : clock.label.defaultMessage}
      </p>
      <div className="synthetic-day">
        <span>{CITIZEN_MESSAGES.clock.currentCase.defaultMessage}</span>
        <strong>{UI_MESSAGES.clock.day.defaultMessage} {overdue.elapsedDays}</strong>
      </div>
      {overdue.isOverdue ? (
        <p className="clock-context">
          This is currently {overdue.daysOverdue} {overdue.daysOverdue === 1 ? "day" : "days"} beyond that recorded process window.
        </p>
      ) : null}
    </div>
  );
}
