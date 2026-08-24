import type { MoneyPath } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { deriveApplicableSopClock, deriveOverdueState } from "../../sop/selectors";

export function SopClockView({ path, now, compact = false }: { path: MoneyPath; now: string; compact?: boolean }) {
  const clock = deriveApplicableSopClock(path);
  const overdue = deriveOverdueState(path, now);

  if (!clock || !overdue) {
    return compact ? null : <p className="no-clock">{UI_MESSAGES.common.noClock.defaultMessage}</p>;
  }

  return (
    <div className={`clock ${overdue.isOverdue ? "clock-overdue" : "clock-on-time"}`}>
      <span className="field-label">{UI_MESSAGES.common.processClock.defaultMessage}</span>
      <strong>{clock.label.defaultMessage}</strong>
      <div className="clock-current">
        <span>{UI_MESSAGES.clock.day.defaultMessage} {overdue.elapsedDays}</span>
        {overdue.isOverdue ? (
          <span className="overdue-copy">
            {overdue.daysOverdue} {UI_MESSAGES.clock.overdue.defaultMessage}
          </span>
        ) : (
          <span>{UI_MESSAGES.clock.withinWindow.defaultMessage}</span>
        )}
      </div>
    </div>
  );
}
