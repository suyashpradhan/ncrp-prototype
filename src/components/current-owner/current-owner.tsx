import type { MoneyPath } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { deriveCurrentOwner } from "../../sop/selectors";
import { getActorLabel } from "../../presentation/format";

export function CurrentOwner({ path }: { path: MoneyPath }) {
  const owner = deriveCurrentOwner(path);

  return (
    <div className="status-field">
      <span className="field-label">{UI_MESSAGES.common.waitingOn.defaultMessage}</span>
      <strong>{getActorLabel(owner, path)}</strong>
    </div>
  );
}
