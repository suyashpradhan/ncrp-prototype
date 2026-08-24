"use client";

import { EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { getNextSyntheticEventType } from "../../domain/money-path";
import { formatCurrency, formatIndiaDate } from "../../presentation/format";
import { useDemoCase } from "./demo-case-provider";

export function DemoCasePlayer({ moneyPathId }: { moneyPathId: string }) {
  const { caseData, now, lastUpdate, simulateNextUpdate, resetDemo } = useDemoCase();
  const path = caseData.moneyPaths.find((item) => item.id === moneyPathId);
  if (!path) return null;

  const nextEvent = getNextSyntheticEventType(path);
  const latestForPath = lastUpdate?.moneyPathId === moneyPathId ? lastUpdate : null;
  const headingId = `demo-player-${moneyPathId}`;

  return (
    <aside className="demo-player" aria-labelledby={headingId}>
      <div className="demo-player-copy">
        <p className="demo-label">{UI_MESSAGES.demo.label.defaultMessage}</p>
        <h2 id={headingId}>{UI_MESSAGES.demo.title.defaultMessage}</h2>
        <p>{UI_MESSAGES.demo.description.defaultMessage}</p>
      </div>

      <dl className="demo-player-facts">
        <div>
          <dt>{UI_MESSAGES.demo.focus.defaultMessage}</dt>
          <dd>{formatCurrency(path.amount)}</dd>
        </div>
        <div>
          <dt>{UI_MESSAGES.demo.caseDate.defaultMessage}</dt>
          <dd>{formatIndiaDate(now)}</dd>
        </div>
        <div>
          <dt>{UI_MESSAGES.demo.nextEvent.defaultMessage}</dt>
          <dd>
            {nextEvent
              ? EVENT_MESSAGES[nextEvent].defaultMessage
              : UI_MESSAGES.demo.complete.defaultMessage}
          </dd>
        </div>
      </dl>

      <div className="demo-player-actions">
        <button
          className="demo-primary-button"
          type="button"
          disabled={!nextEvent}
          onClick={() => simulateNextUpdate(moneyPathId)}
        >
          {UI_MESSAGES.demo.simulate.defaultMessage}
        </button>
        <button className="demo-reset-button" type="button" onClick={resetDemo}>
          {UI_MESSAGES.demo.reset.defaultMessage}
        </button>
      </div>

      <p className="demo-update" aria-live="polite">
        {latestForPath
          ? `${UI_MESSAGES.demo.latestUpdate.defaultMessage}: ${EVENT_MESSAGES[latestForPath.eventType].defaultMessage}`
          : UI_MESSAGES.demo.noUpdate.defaultMessage}
      </p>
    </aside>
  );
}
