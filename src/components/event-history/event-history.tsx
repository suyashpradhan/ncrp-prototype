import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES, EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { deriveCitizenCurrentHistoryLabel } from "../../presentation/citizen-case";
import { formatCurrency, formatIndiaShortDate } from "../../presentation/format";
import { getChronologicalEvents } from "../../sop/selectors";

export function EventHistory({ path }: { path: MoneyPath }) {
  const events = getChronologicalEvents(path).filter(
    (event) => event.type !== "MONEY_PATH_IDENTIFIED",
  );
  const current = deriveCitizenCurrentHistoryLabel(path);

  return (
    <section className="citizen-detail-section" aria-labelledby="event-history-heading">
      <h2 id="event-history-heading">{CITIZEN_MESSAGES.detail.historyTitle.defaultMessage}</h2>
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
                : EVENT_MESSAGES[event.type].defaultMessage}
            </span>
          </li>
        ))}
      </ol>
      <div className="current-history-item">
        <span>{UI_MESSAGES.common.current.defaultMessage}</span>
        <span aria-hidden="true">—</span>
        <strong>{current.defaultMessage}</strong>
      </div>
    </section>
  );
}
