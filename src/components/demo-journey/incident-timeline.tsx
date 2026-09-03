"use client";

import type { IncidentTimelineEvent } from "../../presentation/incident-timeline";

type IncidentTimelineProps = {
  events: IncidentTimelineEvent[];
  heading: string;
  interactive?: boolean;
};

function openEvidence(evidenceId: string) {
  document
    .querySelector<HTMLButtonElement>(`[data-evidence-id="${evidenceId}"]`)
    ?.click();
}

export function IncidentTimeline({
  events,
  heading,
  interactive = true,
}: IncidentTimelineProps) {
  if (events.length < 2) return null;

  return (
    <section className="incident-timeline" aria-labelledby="incident-timeline-heading">
      <h2 id="incident-timeline-heading">{heading}</h2>
      <ol>
        {events.map((event) => (
          <li key={event.id}>
            <time>
              {event.timeLabel?.split(" · ").map((part) => (
                <span key={part}>{part}</span>
              ))}
            </time>
            <span className="timeline-marker" aria-hidden="true" />
            <div>
              <p>{event.title}</p>
              <ul className="timeline-sources" aria-label="Sources">
                {event.sourceRefs.map((source) => (
                  <li key={`${event.id}-${source.type}-${source.label}`}>
                    {interactive && source.evidenceId ? (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => openEvidence(source.evidenceId!)}
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
          </li>
        ))}
      </ol>
    </section>
  );
}
