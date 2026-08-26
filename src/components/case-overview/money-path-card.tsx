"use client";

import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES } from "../../content/en";
import {
  deriveCitizenDetailTitle,
  deriveCitizenOverviewDetails,
} from "../../presentation/citizen-case";
import { formatCurrency } from "../../presentation/format";
import { useI18n } from "../../i18n/i18n-provider";

export function MoneyPathCard({ path, now }: { path: MoneyPath; now: string }) {
  const { locale, m } = useI18n();
  const title = deriveCitizenDetailTitle(path);
  const details = deriveCitizenOverviewDetails(path, now);
  const cta = details.cta;

  return (
    <article className="citizen-amount-item">
      <p className="citizen-amount">{formatCurrency(path.amount)}</p>
      <h3>{m(title)}</h3>
      <p className="citizen-amount-explanation">{m(details.explanation)}</p>
      {details.citizenAction ? (
        <p className="citizen-amount-action">
          <span>{m(CITIZEN_MESSAGES.case.needToDo)}</span>
          <strong>{m(details.citizenAction)}</strong>
        </p>
      ) : null}
      <Link
        className="citizen-card-link"
        href={`/money-path/${path.id}`}
        aria-label={`${m(cta)}: ${formatCurrency(path.amount)}, ${m(title)}`}
      >
        {m(cta)}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
