import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES } from "../../content/en";
import {
  deriveCitizenDetailTitle,
  deriveCitizenOverviewDetails,
} from "../../presentation/citizen-case";
import { formatCurrency } from "../../presentation/format";

export function MoneyPathCard({ path, now }: { path: MoneyPath; now: string }) {
  const title = deriveCitizenDetailTitle(path);
  const details = deriveCitizenOverviewDetails(path, now);
  const cta = details.cta;

  return (
    <article className="citizen-amount-item">
      <p className="citizen-amount">{formatCurrency(path.amount)}</p>
      <h3>{title.defaultMessage}</h3>
      <p className="citizen-amount-explanation">{details.explanation.defaultMessage}</p>
      {details.citizenAction ? (
        <p className="citizen-amount-action">
          <span>{CITIZEN_MESSAGES.case.needToDo.defaultMessage}</span>
          <strong>{details.citizenAction.defaultMessage}</strong>
        </p>
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
