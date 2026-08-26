"use client";

import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES, EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { deriveCitizenCurrentHistoryLabel } from "../../presentation/citizen-case";
import { formatCurrency, formatIndiaShortDate } from "../../presentation/format";
import { deriveCurrentStage, getChronologicalEvents } from "../../sop/selectors";
import { useI18n } from "../../i18n/i18n-provider";

export function EventHistory({ path }: { path: MoneyPath }) {
  const { locale, m, t } = useI18n();
  const stage = deriveCurrentStage(path);
  const isNonProcessState =
    stage === "EXITED_FINANCIAL_SYSTEM" || stage === "NOT_CURRENTLY_HELD";
  const isTerminalState =
    isNonProcessState || stage === "INTERIM_CUSTODY_CONFIRMED";
  const events = getChronologicalEvents(path).filter((event) =>
    isNonProcessState ? true : event.type !== "MONEY_PATH_IDENTIFIED",
  );
  const current = deriveCitizenCurrentHistoryLabel(path);
  const heading = isNonProcessState
    ? m(CITIZEN_MESSAGES.detail.amountHistoryTitle)
    : m(CITIZEN_MESSAGES.detail.historyTitle);
  const headingId = `history-${path.id}`;

  return (
    <section className="event-history-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <div>
        <ol className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <time className="event-date" dateTime={event.occurredAt}>
                {formatIndiaShortDate(event.occurredAt, locale)}
              </time>
              <span aria-hidden="true">—</span>
              <span className="event-title">
                {event.type === "AMOUNT_HELD"
                  ? t("history.held", { amount: formatCurrency(path.amount) })
                  : event.type === "AMOUNT_EXITED_FINANCIAL_SYSTEM"
                    ? t("history.cash")
                    : m(EVENT_MESSAGES[event.type])}
              </span>
            </li>
          ))}
        </ol>
        {!isTerminalState ? (
          <div className="current-history-item">
            <span>{m(UI_MESSAGES.common.current)}</span>
            <span aria-hidden="true">—</span>
            <strong>{m(current)}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
