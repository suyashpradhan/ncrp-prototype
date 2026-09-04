"use client";

import type { IncidentTimelineEvent } from "../../presentation/incident-timeline";
import { useI18n } from "../../i18n/i18n-provider";
import { requestEvidencePreview } from "./evidence-preview-events";

type IncidentTimelineProps = {
  events: IncidentTimelineEvent[];
  heading: string;
  interactive?: boolean;
  groupByDate?: boolean;
};

export function IncidentTimeline({
  events,
  heading,
  interactive = true,
  groupByDate = false,
}: IncidentTimelineProps) {
  const { locale } = useI18n();
  if (events.length < 2) return null;

  let previousDate: string | null = null;

  return (
    <section className="incident-timeline" aria-labelledby="incident-timeline-heading">
      <h2 id="incident-timeline-heading">{heading}</h2>
      <ol>
        {events.flatMap((event) => {
          const timeParts = event.timeLabel?.split(" · ") ?? [];
          const date = groupByDate && timeParts.length > 1 ? timeParts[0] : null;
          const eventTime = date ? timeParts.slice(1).join(" · ") : event.timeLabel;
          const showDate = Boolean(date && date !== previousDate);
          if (date) previousDate = date;
          const isApplicationEvent = event.sourceRefs.every((source) =>
            ["SYSTEM", "PROTOTYPE", "USER_CONFIRMED"].includes(source.type),
          );
          return [
            ...(showDate
              ? [
                  <li className="timeline-date-heading" key={`${event.id}-date`}>
                    <h3>{date}</h3>
                  </li>,
                ]
              : []),
            <li
              key={event.id}
              className={isApplicationEvent ? "timeline-application-event" : undefined}
            >
              <time>{eventTime ? <span>{eventTime}</span> : null}</time>
              <span className="timeline-marker" aria-hidden="true" />
              <div>
                <p>{event.title}</p>
                <ul
                  className="timeline-sources"
                  aria-label={locale === "hi" ? "स्रोत" : "Sources"}
                >
                  {event.sourceRefs.map((source) => (
                    <li key={`${event.id}-${source.type}-${source.label}`}>
                      {interactive && source.evidenceId ? (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => requestEvidencePreview(source.evidenceId!)}
                        >
                          {source.label} →
                        </button>
                      ) : (
                        <span>{source.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>,
          ];
        })}
      </ol>
    </section>
  );
}
