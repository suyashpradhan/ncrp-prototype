import type { MoneyPath } from "../../domain/case";
import { EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { ACTOR_MESSAGES } from "../../domain/actors";
import { formatIndiaDate } from "../../presentation/format";
import { getChronologicalEvents } from "../../sop/selectors";

export function EventHistory({ path }: { path: MoneyPath }) {
  const events = [...getChronologicalEvents(path)].reverse();

  return (
    <section className="detail-section" aria-labelledby="event-history-heading">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">{UI_MESSAGES.detail.eventDrivenState.defaultMessage}</p>
          <h2 id="event-history-heading">{UI_MESSAGES.detail.eventHistory.defaultMessage}</h2>
        </div>
        <p>{UI_MESSAGES.detail.eventHistoryIntro.defaultMessage}</p>
      </div>
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
    </section>
  );
}
