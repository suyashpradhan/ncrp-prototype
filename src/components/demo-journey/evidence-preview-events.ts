export const OPEN_EVIDENCE_PREVIEW_EVENT = "sachet:open-evidence-preview";

export function requestEvidencePreview(evidenceId: string) {
  window.dispatchEvent(
    new CustomEvent<string>(OPEN_EVIDENCE_PREVIEW_EVENT, {
      detail: evidenceId,
    }),
  );
}
