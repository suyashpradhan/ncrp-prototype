const SENSITIVE_VALUE_PATTERN =
  /\b(UPI\s+PIN|one[\s-]?time password|OTP|CVV|CVC|password|passcode|PIN)\b(\s*(?:(?:number|code)\s*)?(?:(?:is|was|equals?)\s*|[:=\-]\s*|\s+))(["']?)([A-Za-z0-9@#$%^&*_-]{3,64})\3/gi;

export type SanitizedSensitiveText = {
  text: string;
  redacted: boolean;
};

function shouldRedact(keyword: string, separator: string, candidate: string) {
  const normalizedKeyword = keyword.toLowerCase();
  const explicitAssignment = /\b(?:is|was|equals?)\b|[:=\-]/i.test(separator);

  if (normalizedKeyword === "password" || normalizedKeyword === "passcode") {
    if (/^(?:incorrect|wrong|changed|reset|forgotten|compromised|recovered|expired|blocked|stolen)$/i.test(candidate)) {
      return false;
    }
    return explicitAssignment;
  }

  if (!/^\d+$/.test(candidate)) return false;
  if (/cvv|cvc/i.test(normalizedKeyword)) return candidate.length >= 3 && candidate.length <= 4;
  if (/pin/i.test(normalizedKeyword)) return candidate.length >= 4 && candidate.length <= 6;
  return candidate.length >= 4 && candidate.length <= 8;
}

export function sanitizeSensitiveText(value: string): SanitizedSensitiveText {
  let redacted = false;
  const text = value.replace(
    SENSITIVE_VALUE_PATTERN,
    (match, keyword: string, separator: string, _quote: string, candidate: string) => {
      if (!shouldRedact(keyword, separator, candidate)) return match;
      redacted = true;
      return `${keyword}${separator}[redacted]`;
    },
  );
  return { text, redacted };
}

export function containsSensitiveDetail(value: string | null | undefined) {
  return value ? sanitizeSensitiveText(value).redacted : false;
}
