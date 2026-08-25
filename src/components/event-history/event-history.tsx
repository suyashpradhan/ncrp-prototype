import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES, EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { deriveCitizenCurrentHistoryLabel } from "../../presentation/citizen-case";
import { formatCurrency, formatIndiaShortDate } from "../../presentation/format";
import { deriveCurrentStage, getChronologicalEvents } from "../../sop/selectors";

export function EventHistory({ path }: { path: MoneyPath }) {
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
    ? CITIZEN_MESSAGES.detail.amountHistoryTitle.defaultMessage
    : CITIZEN_MESSAGES.detail.historyTitle.defaultMessage;
  const headingId = `history-${path.id}`;

  return (
    <section className="event-history-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <div>
        <ol className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <time className="event-date" dateTime={event.occurredAt}>
                {formatIndiaShortDate(event.occurredAt)}
              </time>
              <span aria-hidden="true">—</span>
              <span className="event-title">
                {event.type === "AMOUNT_HELD"
                  ? `${formatCurrency(path.amount)} put on hold`
                  : event.type === "AMOUNT_EXITED_FINANCIAL_SYSTEM"
                    ? "Cash withdrawal recorded"
                    : EVENT_MESSAGES[event.type].defaultMessage}
              </span>
            </li>
          ))}
        </ol>
        {!isTerminalState ? (
          <div className="current-history-item">
            <span>{UI_MESSAGES.common.current.defaultMessage}</span>
            <span aria-hidden="true">—</span>
            <strong>{current.defaultMessage}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
