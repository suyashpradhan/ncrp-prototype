import type { MoneyPath } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { deriveCitizenAction } from "../../sop/selectors";

export function CitizenActionView({ path }: { path: MoneyPath }) {
  const action = deriveCitizenAction(path);

  return (
    <div className={`status-field action-field action-${action.code.toLowerCase()}`}>
      <span className="field-label">{UI_MESSAGES.common.citizenAction.defaultMessage}</span>
      <strong>{action.instruction.defaultMessage}</strong>
    </div>
  );
}
