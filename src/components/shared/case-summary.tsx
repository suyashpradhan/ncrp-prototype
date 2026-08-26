import type { Case } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { formatCurrency } from "../../presentation/format";

export function CaseSummary({ caseData }: { caseData: Case }) {
  return (
    <dl className="case-summary" aria-label={UI_MESSAGES.overview.summaryLabel.defaultMessage}>
      <div>
        <dt>{UI_MESSAGES.common.reportedLoss.defaultMessage}</dt>
        <dd>{formatCurrency(caseData.complaint.reportedAmount)}</dd>
      </div>
      <div>
        <dt>{UI_MESSAGES.common.fraudType.defaultMessage}</dt>
        <dd>{caseData.reportedIncident.citizenLabel}</dd>
      </div>
      <div>
        <dt>{UI_MESSAGES.common.acknowledgement.defaultMessage}</dt>
        <dd>{caseData.complaint.acknowledgementId}</dd>
      </div>
      <div>
        <dt>{UI_MESSAGES.common.fir.defaultMessage}</dt>
        <dd>
          {caseData.complaint.firStatus === "REGISTERED"
            ? UI_MESSAGES.common.registered.defaultMessage
            : UI_MESSAGES.common.notRegistered.defaultMessage}
        </dd>
      </div>
    </dl>
  );
}
