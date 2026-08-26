"use client";

import type { MoneyPath } from "../../domain/case";
import { deriveApplicableSopClock, deriveOverdueState } from "../../sop/selectors";
import { useI18n } from "../../i18n/i18n-provider";

export function SopClockView({ path, now }: { path: MoneyPath; now: string }) {
  const { t } = useI18n();
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
          ? t("detail.bankClock", { days: overdue.durationDays })
          : t("detail.processClock", { days: overdue.durationDays })}
      </p>
      <p className="clock-primary">{t("detail.currentCase", { day: t("detail.day", { day: overdue.elapsedDays }) })}</p>
      {overdue.isOverdue ? (
        <p className="clock-context">
          {t("detail.overdue", { days: overdue.daysOverdue })}
        </p>
      ) : null}
    </div>
  );
}
