"use client";

import { useRouter } from "next/navigation";
import { EVENT_MESSAGES, UI_MESSAGES } from "../../content/en";
import { getNextSyntheticMilestoneEventType } from "../../domain/money-path";
import { useDemoCase } from "./demo-case-provider";
import { useI18n } from "../../i18n/i18n-provider";

export function PrototypeDemoControl({ moneyPathId }: { moneyPathId: string }) {
  const { m } = useI18n();
  const router = useRouter();
  const { caseData, lastUpdate, simulateNextUpdate, resetDemo } = useDemoCase();
  const path = caseData.moneyPaths.find((item) => item.id === moneyPathId);
  if (!path) return null;

  const nextEvent = getNextSyntheticMilestoneEventType(path);

  const latestForPath = lastUpdate?.moneyPathId === moneyPathId ? lastUpdate : null;
  const headingId = `prototype-control-${moneyPathId}`;
  const descriptionId = `${headingId}-description`;

  return (
    <details className="detail-disclosure prototype-demo-control">
      <summary id={headingId}>{m(UI_MESSAGES.demo.title)}</summary>
      <div className="detail-disclosure-content">
        <p id={descriptionId}>{m(UI_MESSAGES.demo.description)}</p>

        <div className="prototype-demo-actions">
          {nextEvent ? (
            <button
              className="primary-button"
              type="button"
              aria-describedby={descriptionId}
              onClick={() => simulateNextUpdate(moneyPathId)}
            >
              {m(UI_MESSAGES.demo.simulate)}
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={() => { resetDemo(); router.push("/"); }}>
            {m(UI_MESSAGES.demo.reset)}
          </button>
        </div>

        <p className="prototype-demo-update" role="status" aria-live="polite" aria-atomic="true">
          {latestForPath
            ? `${m(UI_MESSAGES.demo.latestUpdate)}: ${m(EVENT_MESSAGES[latestForPath.eventType])}`
            : nextEvent
              ? m(UI_MESSAGES.demo.noUpdate)
              : m(UI_MESSAGES.demo.complete)}
        </p>
      </div>
    </details>
  );
}
