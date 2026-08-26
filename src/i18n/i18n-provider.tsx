"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Message } from "../domain/messages";
import { HI_MESSAGE_OVERRIDES, HI_TEXT } from "./hi";

export type UiLocale = "en" | "hi";

const STORAGE_KEY = "ncrp-prototype-ui-locale-v1";

const EN_TEXT: Record<string, string> = {
  "language.english": "English",
  "language.hindi": "हिन्दी",
  "header.languageLabel": "Interface language",
  "header.secondaryNavigation": "Secondary navigation",
  "skip.main": "Skip to main content",
  "entry.heading": "Report a financial cyber fraud",
  "entry.support": "See how voice and evidence can be organised into the information needed for an NCRP complaint.",
  "entry.demo": "Try demo case",
  "entry.live": "Try with test evidence",
  "entry.note": "No government system is connected. The demo uses synthetic information only.",
  "entry.urgent": "Lost money recently? Call 1930 as soon as possible while you prepare the report.",
  "entry.noLogin": "No login, microphone or personal information is required.",
  "journey.report": "Report",
  "journey.restoration": "Restoration",
  "journey.resolution": "Resolution",
  "journey.progressLabel": "Service journey progress",
  "journey.completed": "completed",
  "report.forWhom": "Who are you reporting for?",
  "report.myself": "Myself",
  "report.someoneElse": "Someone else",
  "report.helpingHint": "The affected person should review the information before submission. Keep the person preparing the report separate from the person affected.",
  "report.continue": "Continue",
  "profile.heading": "Test profile information",
  "profile.support": "Use test information only. Do not enter a real identity or mobile number.",
  "profile.useSynthetic": "Use synthetic profile",
  "profile.fromSimulated": "From simulated NCRP profile",
  "profile.fromTest": "Test information",
  "profile.name": "Name",
  "profile.state": "State",
  "profile.mobile": "Mobile",
  "profile.required": "Complete the test profile or use the synthetic profile to continue.",
  "workspace.tell": "Tell us what happened",
  "workspace.yourInformation": "Your information",
  "workspace.intro": "Speak, upload evidence or type. Use whichever is easiest.",
  "workspace.reviewIntro": "The statement and evidence used to prepare this report.",
  "workspace.speak": "Speak",
  "workspace.upload": "Upload evidence",
  "workspace.type": "Type",
  "workspace.shareWays": "Ways to share what happened",
  "workspace.speakLanguage": "Speak in your language",
  "workspace.describeNaturally": "Describe what happened naturally.",
  "workspace.startRecording": "Start recording",
  "workspace.stopRecording": "Stop recording",
  "workspace.recordAgain": "Record again",
  "workspace.addEvidence": "Add evidence",
  "workspace.useDemo": "Try demo case",
  "workspace.chooseScreenshots": "Choose screenshots",
  "workspace.maxImages": "Maximum 2 images.",
  "workspace.safety": "Use test information only. Do not upload OTPs, PINs, passwords or CVVs.",
  "workspace.describe": "Describe what happened",
  "workspace.whatHappened": "What happened?",
  "workspace.placeholder": "I received a message asking me to update my SBI KYC…",
  "workspace.organise": "Organise report",
  "workspace.informationShared": "Information you shared",
  "workspace.sampleStatement": "Sample statement",
  "workspace.yourStatement": "Your statement",
  "workspace.typedDescription": "Typed description",
  "workspace.viewStatement": "View statement",
  "workspace.transcript": "Statement transcript",
  "workspace.viewEnglish": "View English translation",
  "workspace.evidence": "Evidence",
  "workspace.evidenceAdded": "Evidence added",
  "workspace.screenshots": "screenshots",
  "workspace.added": "Added",
  "workspace.openEvidence": "Open evidence preview",
  "workspace.closeEvidence": "Close preview",
  "workspace.demoMessage": "Synthetic message screenshot",
  "workspace.demoBank": "Synthetic bank transaction",
  "workspace.sampleNarration": "Sample narration",
  "workspace.play": "Play",
  "workspace.pause": "Pause",
  "workspace.approxSeconds": "approximately {seconds} seconds",
  "workspace.changeLanguage": "Change sample narration language",
  "workspace.reportInfo": "Information for your NCRP report",
  "workspace.reportInfoSupport": "We’ll organise what you share into the details required for the complaint.",
  "workspace.organisingSample": "Organising the information from the sample incident…",
  "workspace.emptyStrong": "Start by speaking, uploading evidence or typing what happened.",
  "workspace.emptyBody": "The required report details will appear here.",
  "workspace.errorHeading": "We couldn’t organise the information",
  "workspace.inputPreserved": "Your statement and evidence are still available on the left.",
  "workspace.tryAgain": "Try again",
  "workspace.shorter": "Record a shorter statement",
  "workspace.typeInstead": "Type instead",
  "workspace.ready": "Report information ready",
  "workspace.detailNeeded": "{count} required details still needed",
  "workspace.fromProfile": "From profile",
  "workspace.complete": "Complete",
  "workspace.actionNeeded": "action needed",
  "workspace.reviewContinue": "Review & continue",
  "workspace.reviewSubmit": "Review & submit",
  "workspace.reviewSupport": "This is a final check of the information prepared for your synthetic complaint.",
  "workspace.submitSynthetic": "Submit synthetic complaint",
  "workspace.backEdit": "Back to edit",
  "workspace.noSubmit": "This does not submit information to NCRP or any government system.",
  "workspace.whatShared": "What you shared",
  "workspace.reportDetails": "Report details",
  "workspace.saved": "Your statement has been saved.",
  "workspace.reportingView": "Reporting workspace view",
  "field.incident": "Incident",
  "field.transactions": "Transactions",
  "field.evidenceSuspect": "Evidence & suspect",
  "field.reporter": "Your details",
  "field.category": "Category of complaint",
  "field.subcategory": "Sub-category",
  "field.moneyLost": "Money lost?",
  "field.incidentDate": "Incident date",
  "field.approxTime": "Approximate time",
  "field.reportingDelay": "Delay in reporting",
  "field.delayReason": "Reason for delay",
  "field.occurredOn": "Where the conversation happened",
  "field.description": "Incident description",
  "field.amount": "Amount",
  "field.institution": "Bank or payment app",
  "field.account": "Account, wallet or UPI ID",
  "field.transactionReference": "Transaction reference",
  "field.transactionReferenceHelp": "Also called UTR on many bank receipts.",
  "field.transactionDate": "Transaction date",
  "field.reference": "Reference number",
  "field.totalLost": "Total money reported lost",
  "field.evidenceSupplied": "Evidence supplied",
  "field.suspectFound": "Suspect details found",
  "field.name": "Name",
  "field.state": "State",
  "field.registeredMobile": "Registered mobile",
  "field.fromShared": "From what you shared",
  "field.suggested": "Suggested from your information",
  "field.fromEvidence": "From uploaded evidence",
  "field.fromProfile": "From simulated profile",
  "field.provided": "Provided",
  "field.notProvided": "Not provided",
  "field.notAvailable": "Not available",
  "field.yes": "Yes",
  "field.no": "No",
  "field.transaction": "Transaction {number}",
  "field.chatScreenshot": "Chat screenshot",
  "field.paymentConfirmation": "Payment confirmation",
  "field.voiceStatement": "Voice statement",
  "field.otherEvidence": "Other evidence",
  "field.website": "Website",
  "field.phone": "Phone number",
  "field.change": "Change",
  "field.edit": "Edit",
  "field.save": "Save",
  "field.cancel": "Cancel",
  "field.ready": "Ready",
  "field.needsInput": "Needs your input",
  "field.syntheticSbiAccount": "Synthetic SBI account ending 0024",
  "field.demoNarrative": "Asha received a message claiming that the KYC for her SBI account needed to be updated. She opened the supplied link and followed the app instructions. At about 7:05 AM on 22 August 2026, ₹40,000 was transferred from her account. She later tried to contact the sender but received no response.",
  "complaint.registered": "Complaint registered",
  "complaint.response": "This is a synthetic acknowledgement. No complaint was submitted to a government system.",
  "complaint.next": "What happens next?",
  "complaint.nextBody": "Banks and law-enforcement agencies may act on the financial trail connected to the complaint.",
  "complaint.demoAdvance": "For this demo, we’ll move to a later stage where part of the reported amount is recorded as held and can enter the Money Restoration journey.",
  "complaint.continueRestoration": "Continue to Money Restoration",
  "mrm.existing": "Existing government stage · simplified for this prototype",
  "mrm.title": "Money Restoration Module",
  "mrm.request": "Restoration request",
  "mrm.complaint": "NCRP complaint",
  "mrm.reported": "Reported amount",
  "mrm.held": "Amounts currently recorded as held",
  "mrm.refund": "Refund account",
  "mrm.documents": "Required documents",
  "mrm.ready": "Ready",
  "mrm.submit": "Submit synthetic restoration request",
  "mrm.submitted": "Restoration request submitted",
  "mrm.response": "This synthetic request represents the existing government restoration stage in simplified form.",
  "mrm.split": "Different portions of the reported amount can now be in different recorded states across banks and police processes.",
  "mrm.questions": "This prototype explores a clearer way to answer:",
  "mrm.where": "Where is my money?",
  "mrm.who": "Who needs to act next?",
  "mrm.action": "Do I need to do anything?",
  "mrm.proposed": "Proposed Financial Resolution experience",
  "mrm.open": "See Financial Resolution",
  "case.where": "Where does your {amount} stand?",
  "case.amountSummary": "Amount summary",
  "case.viewSummary": "View summary",
  "case.reported": "Reported",
  "case.active": "Currently recorded in active held/restoration processes",
  "case.cash": "Cash withdrawal recorded",
  "case.notSecured": "Not currently secured",
  "detail.primaryCash": "A cash withdrawal is recorded.",
  "detail.primaryNotHeld": "This amount is not currently recorded as held by a financial institution.",
  "detail.primaryReceived": "The amount has been credited under the recorded process.",
  "detail.primaryBank": "The required direction has already been received by the bank.",
  "detail.account": "Synthetic account",
  "detail.outcomes": "Recorded outcomes",
  "detail.received": "{amount} received",
  "detail.cashHeld": "{amount} put on hold",
  "detail.cashWithdrawal": "Cash withdrawal recorded",
  "detail.day": "Day {day}",
  "detail.bankClock": "The recorded bank process requires action within {days} calendar days after receiving the direction.",
  "detail.processClock": "Recorded process window: {days} calendar days",
  "detail.currentCase": "Current synthetic case: {day}",
  "detail.overdue": "This step is currently {days} days beyond its recorded process window.",
  "detail.currentActorIo": "Investigating Officer",
  "detail.currentActorBank": "Bank",
  "detail.currentActorPolice": "Police",
  "detail.currentActorCitizen": "Citizen",
  "detail.currentActorCourt": "Court",
  "detail.currentActorNone": "No action currently recorded",
  "history.held": "{amount} put on hold",
  "history.cash": "Cash withdrawal recorded",
  "history.current": "Current",
  "demo.control": "Demo mode",
  "demo.reset": "Reset demo",
  "about.profile": "In a live NCRP implementation, verified citizen details could come from the existing authenticated NCRP profile. This prototype uses synthetic profile information and does not authenticate users.",
  "how.title": "How this works",
  "how.oneTitle": "1. Fraud is reported",
  "how.oneBody": "A citizen reports financial cyber fraud through NCRP or 1930.",
  "how.twoTitle": "2. Different portions can move through different processes",
  "how.twoBody": "Banks, police and other institutions may be responsible for different amounts at different times.",
  "how.threeTitle": "3. This prototype explains the process",
  "how.threeBody": "It shows what is happening to each amount, who needs to act and whether the citizen needs to do anything.",
};

export function textForLocale(
  locale: UiLocale,
  key: string,
  values?: Record<string, I18nValue>,
): string {
  const template = locale === "hi" ? HI_TEXT[key] : EN_TEXT[key];
  return interpolate(template ?? EN_TEXT[key] ?? key, values);
}

type I18nValue = string | number;
type I18nContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: (key: string, values?: Record<string, I18nValue>) => string;
  m: (message: Message) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, values?: Record<string, I18nValue>): string {
  if (!values) return template;
  return template.replace(/\{([^}]+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "hi" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
    document.documentElement.dataset.uiLocale = locale;
  }, [locale]);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, I18nValue>) => {
      return textForLocale(locale, key, values);
    },
    [locale],
  );

  const m = useCallback(
    (message: Message) =>
      locale === "hi"
        ? (HI_MESSAGE_OVERRIDES[message.key] ?? message.defaultMessage)
        : message.defaultMessage,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, m }), [locale, setLocale, t, m]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider.");
  return context;
}
