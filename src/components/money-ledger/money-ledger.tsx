import Link from "next/link";
import type { Case } from "../../domain/case";
import { FINANCIAL_STATE_MESSAGES, UI_MESSAGES } from "../../content/en";
import { reconcileCaseAmounts } from "../../domain/reconciliation";
import { deriveCurrentOwner, deriveFinancialState, derivePlainLanguageStatus } from "../../sop/selectors";
import { formatCurrency, getActorLabel } from "../../presentation/format";

export function MoneyLedger({ caseData }: { caseData: Case }) {
  const reconciliation = reconcileCaseAmounts(caseData);

  return (
    <>
      <section className="page-intro section-pad">
        <div className="shell narrow-shell">
          <p className="eyebrow">{UI_MESSAGES.ledger.eyebrow.defaultMessage}</p>
          <h1>{UI_MESSAGES.ledger.title.defaultMessage}</h1>
          <p className="lede">{UI_MESSAGES.ledger.intro.defaultMessage}</p>
        </div>
      </section>

      <section className="section-pad ledger-section" aria-labelledby="ledger-list-heading">
        <div className="shell narrow-shell">
          <div className="reconciliation-panel" aria-label="Case amount reconciliation">
            <dl>
              <div>
                <dt>{UI_MESSAGES.ledger.reported.defaultMessage}</dt>
                <dd>{formatCurrency(reconciliation.reportedAmount)}</dd>
              </div>
              <div>
                <dt>{UI_MESSAGES.ledger.allocated.defaultMessage}</dt>
                <dd>{formatCurrency(reconciliation.allocatedAmount)}</dd>
              </div>
              <div>
                <dt>{UI_MESSAGES.ledger.difference.defaultMessage}</dt>
                <dd>{formatCurrency(Math.abs(reconciliation.difference))}</dd>
              </div>
            </dl>
            <p className="reconciled-message">
              <span aria-hidden="true">✓</span>
              {UI_MESSAGES.ledger.reconciled.defaultMessage}
            </p>
          </div>

          <h2 id="ledger-list-heading" className="ledger-list-heading">{UI_MESSAGES.ledger.pathList.defaultMessage}</h2>
          <ol className="ledger-list">
            {caseData.moneyPaths.map((path) => {
              const state = deriveFinancialState(path);
              const owner = deriveCurrentOwner(path);
              const status = derivePlainLanguageStatus(path);

              return (
                <li key={path.id} className="ledger-row">
                  <div className="ledger-amount-block">
                    <span className="ledger-amount">{formatCurrency(path.amount)}</span>
                    <span className={`financial-state financial-${state.toLowerCase()}`}>
                      {FINANCIAL_STATE_MESSAGES[state].defaultMessage}
                    </span>
                  </div>
                  <div className="ledger-status-block">
                    <span className="field-label">{UI_MESSAGES.common.currentStep.defaultMessage}</span>
                    <strong>{status.defaultMessage}</strong>
                    <span>{getActorLabel(owner, path)}</span>
                  </div>
                  <div className="ledger-institution-block">
                    <span className="field-label">{UI_MESSAGES.common.institution.defaultMessage}</span>
                    <span>{path.beneficiaryInstitution?.name ?? UI_MESSAGES.common.unknownInstitution.defaultMessage}</span>
                  </div>
                  <Link className="icon-link" href={`/money-path/${path.id}`} aria-label={`View ${formatCurrency(path.amount)} money path`}>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
