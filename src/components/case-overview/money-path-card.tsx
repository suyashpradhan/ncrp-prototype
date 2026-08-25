import Link from "next/link";
import type { MoneyPath } from "../../domain/case";
import { CITIZEN_MESSAGES } from "../../content/en";
import { deriveCitizenAction, deriveCurrentOwner, deriveCurrentStage } from "../../sop/selectors";
import { deriveCitizenAmountPresentation } from "../../presentation/citizen-case";
import { formatCurrency, getActorLabel } from "../../presentation/format";
import { SopClockView } from "../sop-clock/sop-clock";

export function MoneyPathCard({ path, now }: { path: MoneyPath; now: string }) {
  const stage = deriveCurrentStage(path);
  const owner = deriveCurrentOwner(path);
  const presentation = deriveCitizenAmountPresentation(path);
  const action = deriveCitizenAction(path);
  const showsActiveActor = owner !== "NONE" && stage !== "EXITED_FINANCIAL_SYSTEM";
  const cta = path.selectedProcess
    ? CITIZEN_MESSAGES.case.seeDetails
    : CITIZEN_MESSAGES.case.whatMeans;

  return (
    <article className={`citizen-amount-card stage-${stage.toLowerCase()}`}>
      <p className="citizen-amount">{formatCurrency(path.amount)}</p>
      <h3>{presentation.title.defaultMessage}</h3>
      <p className="citizen-amount-explanation">{presentation.explanation.defaultMessage}</p>

      {showsActiveActor && path.selectedProcess ? (
        <div className="citizen-action-line">
          <span>{CITIZEN_MESSAGES.case.needToDo.defaultMessage}</span>
          <strong>{action.instruction.defaultMessage}</strong>
        </div>
      ) : null}

      <SopClockView path={path} now={now} compact />
      <Link
        className="citizen-card-link"
        href={`/money-path/${path.id}`}
        aria-label={`${cta.defaultMessage}: ${formatCurrency(path.amount)}, ${presentation.title.defaultMessage}, ${getActorLabel(owner, path)}`}
      >
        {cta.defaultMessage}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
