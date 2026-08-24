import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { deriveCurrentStage, derivePlainLanguageStatus } from "../../sop/selectors";
import { formatCurrency } from "../../presentation/format";
import { CurrentOwner } from "../current-owner/current-owner";
import { CitizenActionView } from "../citizen-action/citizen-action";
import { SopClockView } from "../sop-clock/sop-clock";

export function MoneyPathCard({ path, now }: { path: MoneyPath; now: string }) {
  const status = derivePlainLanguageStatus(path);
  const stage = deriveCurrentStage(path);

  return (
    <article className={`money-path-card stage-${stage.toLowerCase()}`}>
      <div className="path-card-header">
        <div>
          <p className="path-amount">{formatCurrency(path.amount)}</p>
          {path.beneficiaryInstitution ? (
            <p className="path-institution">
              {path.beneficiaryInstitution.name}
              {path.beneficiaryInstitution.maskedAccount ? ` · ${path.beneficiaryInstitution.maskedAccount}` : ""}
            </p>
          ) : null}
        </div>
        <span className="state-marker">{UI_MESSAGES.common.moneyPath.defaultMessage}</span>
      </div>
      <div className="path-status">
        <span className="field-label">{UI_MESSAGES.common.currentStep.defaultMessage}</span>
        <h3>{status.defaultMessage}</h3>
      </div>
      <div className="path-fields">
        <CurrentOwner path={path} />
        <CitizenActionView path={path} />
      </div>
      <SopClockView path={path} now={now} compact />
      <Link className="text-link path-link" href={`/money-path/${path.id}`}>
        {UI_MESSAGES.common.viewPath.defaultMessage}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
