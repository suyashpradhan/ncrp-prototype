"use client";

import Link from "next/link";
import { UI_MESSAGES } from "../content/en";
import { useI18n } from "../i18n/i18n-provider";

export default function NotFound() {
  const { m } = useI18n();
  return (
    <section className="empty-state section-pad">
      <div className="shell narrow-shell">
        <p className="eyebrow">{m(UI_MESSAGES.notFound.eyebrow)}</p>
        <h1>{m(UI_MESSAGES.notFound.title)}</h1>
        <p>{m(UI_MESSAGES.notFound.body)}</p>
        <Link className="button-link" href="/case">{m(UI_MESSAGES.common.backToOverview)}</Link>
      </div>
    </section>
  );
}
