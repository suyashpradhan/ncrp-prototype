"use client";

import { EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { getNextSyntheticMilestoneEventType } from "../../domain/money-path";
import { useDemoCase } from "./demo-case-provider";

export function PrototypeDemoControl({ moneyPathId }: { moneyPathId: string }) {
  const { caseData, lastUpdate, simulateNextUpdate, resetDemo } = useDemoCase();
  const path = caseData.moneyPaths.find((item) => item.id === moneyPathId);
  if (!path) return null;

  const nextEvent = getNextSyntheticMilestoneEventType(path);
  if (!nextEvent) return null;

  const latestForPath = lastUpdate?.moneyPathId === moneyPathId ? lastUpdate : null;
  const headingId = `prototype-control-${moneyPathId}`;
  const descriptionId = `${headingId}-description`;

  return (
    <details className="detail-disclosure prototype-demo-control">
      <summary id={headingId}>{UI_MESSAGES.demo.title.defaultMessage}</summary>
      <div className="detail-disclosure-content">
        <p id={descriptionId}>{UI_MESSAGES.demo.description.defaultMessage}</p>

        <div className="prototype-demo-actions">
          <button
            className="primary-button"
            type="button"
            aria-describedby={descriptionId}
            onClick={() => simulateNextUpdate(moneyPathId)}
          >
            {UI_MESSAGES.demo.simulate.defaultMessage}
          </button>
          <button className="secondary-button" type="button" onClick={resetDemo}>
            {UI_MESSAGES.demo.reset.defaultMessage}
          </button>
        </div>

        <p className="prototype-demo-update" role="status" aria-live="polite" aria-atomic="true">
          {latestForPath
            ? `${UI_MESSAGES.demo.latestUpdate.defaultMessage}: ${EVENT_MESSAGES[latestForPath.eventType].defaultMessage}`
            : UI_MESSAGES.demo.noUpdate.defaultMessage}
        </p>
      </div>
    </details>
  );
}
