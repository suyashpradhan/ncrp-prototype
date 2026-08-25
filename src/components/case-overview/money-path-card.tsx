import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES } from "../../content/en";
import {
  deriveCitizenDetailTitle,
  deriveCitizenOverviewMeta,
} from "../../presentation/citizen-case";
import { formatCurrency } from "../../presentation/format";

export function MoneyPathCard({ path, now }: { path: MoneyPath; now: string }) {
  const title = deriveCitizenDetailTitle(path);
  const overviewMeta = deriveCitizenOverviewMeta(path, now);
  const cta = CITIZEN_MESSAGES.case.seeDetails;

  return (
    <article className="citizen-amount-item">
      <p className="citizen-amount">{formatCurrency(path.amount)}</p>
      <h3>{title.defaultMessage}</h3>
      {overviewMeta ? (
        <p className="citizen-amount-meta">{overviewMeta.defaultMessage}</p>
      ) : null}
      <Link
        className="citizen-card-link"
        href={`/money-path/${path.id}`}
        aria-label={`${cta.defaultMessage}: ${formatCurrency(path.amount)}, ${title.defaultMessage}`}
      >
        {cta.defaultMessage}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
