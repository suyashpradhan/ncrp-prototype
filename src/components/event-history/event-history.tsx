import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES, EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { ACTOR_MESSAGES } from "../../domain/actors";
import { deriveCitizenAmountPresentation } from "../../presentation/citizen-case";
import { formatIndiaDate } from "../../presentation/format";
import { getChronologicalEvents } from "../../sop/selectors";

export function EventHistory({ path }: { path: MoneyPath }) {
  const events = getChronologicalEvents(path);
  const current = deriveCitizenAmountPresentation(path).title;

  return (
    <section className="citizen-detail-section" aria-labelledby="event-history-heading">
      <h2 id="event-history-heading">{CITIZEN_MESSAGES.detail.historyTitle.defaultMessage}</h2>
      <ol className="event-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className="event-marker" aria-hidden="true" />
            <div className="event-content">
              <p className="event-title">{EVENT_MESSAGES[event.type].defaultMessage}</p>
              <p className="event-meta">
                <time dateTime={event.occurredAt}>{formatIndiaDate(event.occurredAt)}</time>
                <span aria-hidden="true">·</span>
                <span>{ACTOR_MESSAGES[event.actor].defaultMessage}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="current-history-item">
        <span>{UI_MESSAGES.common.current.defaultMessage}</span>
        <strong>{current.defaultMessage}</strong>
      </div>
    </section>
  );
}
