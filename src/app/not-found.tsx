import Link from "next/link";
import { UI_MESSAGES } from "../content/en";

export default function NotFound() {
  return (
    <section className="empty-state section-pad">
      <div className="shell narrow-shell">
        <p className="eyebrow">{UI_MESSAGES.notFound.eyebrow.defaultMessage}</p>
        <h1>{UI_MESSAGES.notFound.title.defaultMessage}</h1>
        <p>{UI_MESSAGES.notFound.body.defaultMessage}</p>
        <Link className="button-link" href="/case">{UI_MESSAGES.common.backToOverview.defaultMessage}</Link>
      </div>
    </section>
  );
}
