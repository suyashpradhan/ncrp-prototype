"use client";

import { EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { getNextSyntheticEventType } from "../../domain/money-path";
import { formatCurrency } from "../../presentation/format";
import { useDemoCase } from "./demo-case-provider";

export function DemoCasePlayer({ moneyPathId }: { moneyPathId: string }) {
  const { caseData, lastUpdate, simulateNextUpdate, resetDemo } = useDemoCase();
  const path = caseData.moneyPaths.find((item) => item.id === moneyPathId);
  if (!path) return null;

  const nextEvent = getNextSyntheticEventType(path);
  const latestForPath = lastUpdate?.moneyPathId === moneyPathId ? lastUpdate : null;
  const headingId = `demo-player-${moneyPathId}`;
  const descriptionId = `${headingId}-description`;
  const nextEventId = `${headingId}-next-event`;

  return (
    <aside className="demo-player" aria-labelledby={headingId}>
      <div className="demo-player-copy">
        <p className="demo-label">{UI_MESSAGES.demo.label.defaultMessage}</p>
        <h2 id={headingId}>{UI_MESSAGES.demo.title.defaultMessage}</h2>
        <p id={descriptionId}>{UI_MESSAGES.demo.description.defaultMessage}</p>
      </div>

      <p className="demo-next-update" id={nextEventId}>
        <strong>{formatCurrency(path.amount)}</strong>
        <span aria-hidden="true"> · </span>
        {UI_MESSAGES.demo.nextEvent.defaultMessage}: {nextEvent
          ? EVENT_MESSAGES[nextEvent].defaultMessage
          : UI_MESSAGES.demo.complete.defaultMessage}
      </p>

      <div className="demo-player-actions">
        <button
          className="demo-primary-button"
          type="button"
          disabled={!nextEvent}
          aria-describedby={`${descriptionId} ${nextEventId}`}
          onClick={() => simulateNextUpdate(moneyPathId)}
        >
          {UI_MESSAGES.demo.simulate.defaultMessage}
        </button>
        <button className="demo-reset-button" type="button" onClick={resetDemo}>
          {UI_MESSAGES.demo.reset.defaultMessage}
        </button>
      </div>

      <p className="demo-update" role="status" aria-live="polite" aria-atomic="true">
        {latestForPath
          ? `${UI_MESSAGES.demo.latestUpdate.defaultMessage}: ${EVENT_MESSAGES[latestForPath.eventType].defaultMessage}`
          : UI_MESSAGES.demo.noUpdate.defaultMessage}
      </p>
    </aside>
  );
}
