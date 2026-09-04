import type { IncidentDraft } from "./schema";

export type PlatformFieldConfig = {
  displayName: string;
  identifierLabel: string;
  urlLabel: string | null;
  platformType: string;
};

const PLATFORM_REGISTRY: Record<string, PlatformFieldConfig> = {
  instagram: { displayName: "Instagram", identifierLabel: "Instagram username", urlLabel: "Instagram profile URL", platformType: "SOCIAL_MEDIA" },
  facebook: { displayName: "Facebook", identifierLabel: "Facebook profile name or username", urlLabel: "Facebook profile URL", platformType: "SOCIAL_MEDIA" },
  snapchat: { displayName: "Snapchat", identifierLabel: "Snapchat username", urlLabel: null, platformType: "SOCIAL_MEDIA" },
  x: { displayName: "X", identifierLabel: "X username", urlLabel: "Profile URL", platformType: "SOCIAL_MEDIA" },
  twitter: { displayName: "X", identifierLabel: "X username", urlLabel: "Profile URL", platformType: "SOCIAL_MEDIA" },
  linkedin: { displayName: "LinkedIn", identifierLabel: "LinkedIn profile or account", urlLabel: "LinkedIn profile URL", platformType: "PROFESSIONAL_NETWORK" },
  telegram: { displayName: "Telegram", identifierLabel: "Telegram username or account", urlLabel: null, platformType: "MESSAGING" },
  whatsapp: { displayName: "WhatsApp", identifierLabel: "WhatsApp phone number or account", urlLabel: null, platformType: "MESSAGING" },
  gmail: { displayName: "Gmail", identifierLabel: "Gmail address", urlLabel: null, platformType: "EMAIL" },
  outlook: { displayName: "Outlook", identifierLabel: "Outlook email address", urlLabel: null, platformType: "EMAIL" },
  discord: { displayName: "Discord", identifierLabel: "Discord username", urlLabel: null, platformType: "COMMUNITY" },
  youtube: { displayName: "YouTube", identifierLabel: "YouTube channel or account", urlLabel: "Channel URL", platformType: "VIDEO" },
  amazon: { displayName: "Amazon", identifierLabel: "Amazon account email or phone", urlLabel: null, platformType: "COMMERCE" },
  flipkart: { displayName: "Flipkart", identifierLabel: "Flipkart account email or phone", urlLabel: null, platformType: "COMMERCE" },
};

const GENERIC_PLATFORM_CONFIG: PlatformFieldConfig = {
  displayName: "Affected platform",
  identifierLabel: "Account or profile name or ID",
  urlLabel: "Profile or account URL",
  platformType: "OTHER",
};

function normalizePlatformKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getPlatformConfig(platformName: string | null | undefined): PlatformFieldConfig {
  if (!platformName) return GENERIC_PLATFORM_CONFIG;
  const known = PLATFORM_REGISTRY[normalizePlatformKey(platformName)];
  return known ?? { ...GENERIC_PLATFORM_CONFIG, displayName: platformName };
}

export type IncidentCapabilities = {
  financialLoss: boolean;
  attemptedFinancialScam: boolean;
  accountCompromise: boolean;
  threatOrExtortion: boolean;
  impersonation: boolean;
  maliciousLink: boolean;
  remoteAccess: boolean;
  requestedSensitiveInformation: boolean;
  sharedSensitiveInformation: boolean;
  ransomware: boolean;
};

export function getIncidentCapabilities(draft: IncidentDraft): IncidentCapabilities {
  const facts = draft.adaptiveFacts;
  const story = `${draft.incident.narrative ?? ""} ${draft.citizenSummary.shortSummary}`;
  const accountCompromise = facts.accountCompromise === true ||
    facts.affectedPlatforms.length > 0 ||
    Boolean(facts.affectedAccount || facts.accountAccessStatus || facts.accountCompromiseBasis) ||
    /\b(?:account|profile)\b[^.!?\n]{0,45}\b(?:hacked|taken over|compromised|lost access)\b|\b(?:hacked|took over|compromised)\b[^.!?\n]{0,45}\b(?:account|profile)\b/i.test(story);
  return {
    financialLoss: draft.incident.financialLossState === "YES",
    attemptedFinancialScam: draft.classification.reportFamily === "FINANCIAL_FRAUD" && draft.incident.financialLossState !== "YES",
    accountCompromise,
    threatOrExtortion: facts.threatOrExtortion === true || /\b(?:threatened|threatening|blackmail|extort|coerc)\b/i.test(story),
    impersonation: facts.impersonation === true || /\b(?:pretended|impersonat|claimed to be|posing as)\b/i.test(story),
    maliciousLink: facts.maliciousLink === true,
    remoteAccess: facts.remoteAccess === true,
    requestedSensitiveInformation: facts.requestedSensitiveInfo.length > 0 || Object.values(draft.financialExposure).some((value) => value === true),
    sharedSensitiveInformation: facts.sharedSensitiveInfo.length > 0 || facts.credentialExposure === true,
    ransomware: facts.filesEncrypted === true || facts.ransomMessagePresent === true,
  };
}
