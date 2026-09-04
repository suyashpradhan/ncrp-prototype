import type { ReporterProfile } from "../experience/profile";
import { CITIZEN_DOES_NOT_HAVE, IncidentDraftSchema, type IncidentDraft, type TranscriptionResult } from "./schema";

export type DemoNarrationLanguage = "hi-IN" | "en-IN";
export type DemoCaseId =
  | "AMOUNT_MISMATCH"
  | "ACCOUNT_COMPROMISE"
  | "LOTTERY_ATTEMPT"
  | "EXTORTION";

export type DemoNarration = TranscriptionResult & {
  label: string;
  nativeLabel: string;
  audioPath: string;
  durationSeconds: number;
};

export type DemoEvidenceDefinition = {
  id: string;
  src: string;
  label: string;
  labelHi: string;
  typeLabel: string;
  typeLabelHi: string;
};

export type DemoCaseDefinition = {
  id: DemoCaseId;
  selectorLabel: string;
  selectorLabelHi: string;
  citizen: ReporterProfile;
  sourceLanguage: string;
  statement: string;
  narrations: Record<DemoNarrationLanguage, DemoNarration>;
  evidence: readonly DemoEvidenceDefinition[];
  draft: IncidentDraft;
  reference: string;
};

function demoProfile(
  displayName: string,
  gender: "Female" | "Male",
  suffix: string,
  emailName: string,
): ReporterProfile {
  return {
    title: gender === "Female" ? "Ms" : "Mr",
    displayName,
    registeredMobile: `••••••${suffix}`,
    gender,
    dateOfBirth: "1992-04-18",
    parentOrSpouseRelationship: "Parent",
    parentOrSpouseName: "Synthetic Parent",
    email: `${emailName}@example.invalid`,
    relationshipWithVictim: "Self",
    houseNumber: `Demo ${suffix}`,
    street: "Synthetic Service Road",
    colony: "Prototype Layout",
    city: "Bengaluru",
    tehsil: "Synthetic Tehsil",
    country: "India",
    state: "Karnataka",
    district: "Bengaluru Urban",
    policeStation: "Synthetic jurisdiction",
    pinCode: "TEST-560000",
    source: "SIMULATED_NCRP_PROFILE",
  };
}

function narration(
  languageCode: DemoNarrationLanguage,
  originalTranscript: string,
  durationSeconds: number,
  audioPath: string,
): DemoNarration {
  return {
    label: languageCode === "hi-IN" ? "Hindi" : "English",
    nativeLabel: languageCode === "hi-IN" ? "हिन्दी" : "English",
    audioPath,
    durationSeconds,
    languageCode,
    originalTranscript,
    englishTranscript: originalTranscript,
  };
}

const emptyAdaptiveFacts = {
  platform: null,
  messageSourcePlatforms: [] as string[],
  affectedPlatforms: [] as string[],
  entityRelationship: null,
  multipleIncidentThreads: null,
  platformType: null,
  affectedAccount: null,
  profileUrl: null,
  accountAccessStatus: null,
  accountCompromise: null,
  recoveryInformationChanged: null,
  recoveryEmailChanged: null,
  phoneNumberChanged: null,
  affectedSystem: null,
  filesEncrypted: null,
  ransomMessagePresent: null,
  accountCompromiseBasis: null,
  credentialExposure: null,
  maliciousLink: null,
  remoteAccess: null,
  threatOrExtortion: null,
  demandedAmount: null,
  threatChannel: null,
  threatDescription: null,
  sensitiveMaterialInvolved: null,
  impersonation: null,
  impersonatedEntity: null,
  communicationChannels: [] as string[],
  requestedSensitiveInfo: [] as string[],
  sharedSensitiveInfo: [] as string[],
  sensitiveEvidenceRedacted: null,
};

const amountMismatchStatement =
  "Kal mujhe WhatsApp pe SBI KYC update ka message aaya. Bola account block ho jayega agar KYC update nahi kiya. Maine link open kiya. Pehle ₹5,000 debit hua, phir thodi der baad ₹15,000 aur debit hua. Mujhe laga total ₹25,000 gaya hai. Exact UTR mere paas abhi nahi hai.";
const accountCompromiseStatement =
  "Yesterday morning I got an Instagram password reset message. Maine link open kiya because mujhe laga official hai. Uske baad Instagram ka password reset ho gaya, but later I also noticed ki mera WhatsApp account access nahi ho raha. I am not sure whether both things are connected. No money was lost.";
const lotteryStatement =
  "Mujhe WhatsApp aur ek call pe bola gaya ki mera number KBC lucky draw mein select hua hai aur maine ₹25 lakh jeeta hai. Prize lene ke liye ₹10,000 processing fee maang rahe the aur Aadhaar photo aur bank details WhatsApp pe bhejne ko bola. Maine koi paisa nahi diya aur details bhi share nahi ki.";
const extortionStatement =
  "Kal Telegram par kisi unknown account ne message kiya ki unke paas meri private photos hain. Unhone bola ki agar maine ₹20,000 nahi diye toh woh photos mere contacts ko bhej denge. Baad mein same threat email par bhi aaya. Maine koi payment nahi kiya. Mujhe nahi pata account real identity kiski hai.";

const amountMismatchEnglish =
  "Yesterday I received an SBI KYC update message on WhatsApp. I opened the link. First ₹5,000 was debited, and later another ₹15,000 was debited. I thought the total loss was ₹25,000. I do not have the exact transaction references right now.";
const amountMismatchHindi =
  "कल मुझे व्हाट्सऐप पर एसबीआई केवाईसी अपडेट का संदेश आया। उसमें लिखा था कि केवाईसी अपडेट नहीं करने पर मेरा खाता बंद हो जाएगा। मैंने लिंक खोल दिया। पहले ₹5,000 और थोड़ी देर बाद ₹15,000 डेबिट हुए। मुझे लगा कि कुल ₹25,000 गए हैं। अभी मेरे पास लेन-देन के सही संदर्भ नहीं हैं।";
const accountCompromiseEnglish =
  "Yesterday morning I received an Instagram password reset message. I opened the link because I thought it was official. After that, my Instagram password was reset. Later, I also found that I could not access my WhatsApp account. I am not sure whether both events are connected. No money was lost.";
const accountCompromiseHindi =
  "कल सुबह मुझे इंस्टाग्राम पासवर्ड रीसेट करने का संदेश मिला। मैंने लिंक खोला क्योंकि मुझे लगा कि वह आधिकारिक है। उसके बाद मेरा इंस्टाग्राम पासवर्ड रीसेट हो गया। बाद में मुझे पता चला कि मैं अपने व्हाट्सऐप खाते में भी प्रवेश नहीं कर पा रहा हूँ। मुझे नहीं पता कि दोनों घटनाएँ जुड़ी हुई हैं या नहीं। कोई पैसा नहीं गया।";
const lotteryEnglish =
  "I was told on WhatsApp and over a phone call that my number had been selected in a KBC lucky draw and that I had won ₹25 lakh. They asked for a ₹10,000 processing fee, an Aadhaar photo, and my bank details. I did not pay or share anything.";
const lotteryHindi =
  "मुझे व्हाट्सऐप और फोन कॉल पर बताया गया कि मेरा नंबर केबीसी लकी ड्रॉ में चुना गया है और मैंने ₹25 लाख जीते हैं। इनाम लेने के लिए उन्होंने ₹10,000 प्रोसेसिंग फीस, आधार की फोटो और बैंक की जानकारी मांगी। मैंने कोई पैसा नहीं दिया और कोई जानकारी साझा नहीं की।";
const extortionEnglish =
  "An unknown Telegram account threatened to share my private photos with my contacts unless I paid ₹20,000. The same threat later arrived by email. I made no payment, and I do not know the sender's real identity.";
const extortionHindi =
  "कल टेलीग्राम पर एक अनजान खाते ने संदेश भेजकर कहा कि उसके पास मेरी निजी तस्वीरें हैं। उसने धमकी दी कि अगर मैंने ₹20,000 नहीं दिए तो वह तस्वीरें मेरे संपर्कों को भेज देगा। बाद में वही धमकी ईमेल पर भी आई। मैंने कोई भुगतान नहीं किया और मुझे भेजने वाले की असली पहचान नहीं पता।";

const amountMismatchDraft: IncidentDraft = {
  classification: {
    reportFamily: "FINANCIAL_FRAUD",
    category: "Financial Fraud",
    subCategory: "Internet Banking Related Fraud",
    cyberElementPresent: true,
    moneyLost: true,
    platform: "WhatsApp",
    ambiguity: "NONE",
    explanation: "Two debits followed a fraudulent KYC message sent over WhatsApp.",
    requiresCitizenConfirmation: false,
  },
  adaptiveFacts: {
    ...emptyAdaptiveFacts,
    platform: "WhatsApp",
    messageSourcePlatforms: ["WhatsApp"],
    platformType: "MESSAGING",
    maliciousLink: true,
    impersonation: true,
    impersonatedEntity: "SBI",
    communicationChannels: ["WhatsApp"],
  },
  citizenSummary: {
    incidentLabel: "KYC-related banking fraud",
    shortSummary: "Asha opened a KYC link sent over WhatsApp. Two debits total ₹20,000, while she remembers the total as ₹25,000.",
  },
  officialMapping: {
    category: "FINANCIAL_FRAUD",
    categoryLabel: "Financial Fraud",
    subCategoryLabel: "Internet Banking Related Fraud",
    mappingConfidence: "HIGH",
  },
  incident: {
    financialLossState: "YES",
    moneyLost: true,
    statedTotalLoss: 25_000,
    citizenConfirmedLoss: null,
    reportedAmount: 25_000,
    openingBalance: null,
    intermediateBalances: [],
    closingBalance: null,
    incidentDate: "2026-09-03",
    incidentDateWithoutYear: null,
    approximateTime: "Morning",
    delayInReporting: false,
    delayReason: null,
    occurredOn: "WhatsApp",
    narrative: amountMismatchStatement,
  },
  financialExposure: {
    bankDetailsRequested: null,
    identityDocumentRequested: null,
    otpRequested: null,
    paymentLinkReceived: true,
    upiCollectRequestReceived: null,
  },
  mentionedInstitutions: ["SBI"],
  transactions: [
    {
      id: "asha-transaction-1",
      institution: "SBI",
      currency: "INR",
      paymentMethod: "Bank debit",
      accountOrUpiId: "Synthetic SBI account ending 0024",
      transactionIdOrUtr: CITIZEN_DOES_NOT_HAVE,
      amount: 5_000,
      transactionDate: "2026-09-03",
      approximateTime: "09:12",
      referenceNumber: "DEMO-ASHA-5000-01",
      status: "KNOWN",
    },
    {
      id: "asha-transaction-2",
      institution: "SBI",
      currency: "INR",
      paymentMethod: "Bank debit",
      accountOrUpiId: "Synthetic SBI account ending 0024",
      transactionIdOrUtr: CITIZEN_DOES_NOT_HAVE,
      amount: 15_000,
      transactionDate: "2026-09-03",
      approximateTime: "09:34",
      referenceNumber: "DEMO-ASHA-15000-02",
      status: "KNOWN",
    },
  ],
  suspectIdentifiers: [
    { type: "PHONE", value: "98XX XX4100" },
    { type: "URL", value: "https://sbi-kyc-demo.invalid/update" },
  ],
  evidence: [
    { type: "CHAT_SCREENSHOT", extractedFacts: ["WhatsApp KYC message claiming to be from SBI", "Synthetic sender 98XX XX4100", "KYC link shown"] },
    { type: "TRANSACTION_SCREENSHOT", extractedFacts: ["₹5,000 debit", "SBI account ending 0024", "3 September 2026 at about 9:12 AM"] },
    { type: "TRANSACTION_SCREENSHOT", extractedFacts: ["₹15,000 debit", "SBI account ending 0024", "3 September 2026 at about 9:34 AM"] },
  ],
  citizenConfirmedFields: [],
  missingRequiredFields: [],
  warnings: [],
};

const accountCompromiseDraft: IncidentDraft = {
  classification: {
    reportFamily: "OTHER_CYBER_CRIME",
    category: "Online and Social Media Related Crime",
    subCategory: "Profile Hacking",
    cyberElementPresent: true,
    moneyLost: false,
    platform: "WhatsApp",
    ambiguity: "NONE",
    explanation: "The account describes possible unauthorised access involving Instagram and WhatsApp.",
    requiresCitizenConfirmation: false,
  },
  adaptiveFacts: {
    ...emptyAdaptiveFacts,
    platform: "WhatsApp",
    messageSourcePlatforms: ["Instagram"],
    affectedPlatforms: ["WhatsApp"],
    platformType: "SOCIAL_MEDIA",
    affectedAccount: null,
    accountAccessStatus: "Lost",
    accountCompromise: true,
    accountCompromiseBasis: "Password reset and loss of account access",
    maliciousLink: true,
    communicationChannels: ["Instagram notification", "WhatsApp security notification"],
  },
  citizenSummary: {
    incidentLabel: "Possible social-media account compromise",
    shortSummary: "Shubham opened an Instagram password-reset link and later could not access WhatsApp. He is unsure whether the events are connected.",
  },
  officialMapping: {
    category: "OTHER_CYBER_CRIME",
    categoryLabel: "Online and Social Media Related Crime",
    subCategoryLabel: "Profile Hacking",
    mappingConfidence: "MEDIUM",
  },
  incident: {
    financialLossState: "NO",
    moneyLost: false,
    statedTotalLoss: null,
    citizenConfirmedLoss: null,
    reportedAmount: null,
    openingBalance: null,
    intermediateBalances: [],
    closingBalance: null,
    incidentDate: "2026-09-03",
    incidentDateWithoutYear: null,
    approximateTime: "Morning",
    delayInReporting: false,
    delayReason: null,
    occurredOn: "Instagram notification",
    narrative: accountCompromiseStatement,
  },
  financialExposure: {
    bankDetailsRequested: false,
    identityDocumentRequested: false,
    otpRequested: false,
    paymentLinkReceived: false,
    upiCollectRequestReceived: false,
  },
  mentionedInstitutions: [],
  transactions: [],
  suspectIdentifiers: [],
  evidence: [
    { type: "OTHER", extractedFacts: ["Instagram password-reset email", "Synthetic security notification", "Reset link was opened"] },
    { type: "CHAT_SCREENSHOT", extractedFacts: ["WhatsApp login/security notification", "Account access unavailable"] },
    { type: "OTHER", extractedFacts: ["Unknown device shown in synthetic login activity"] },
  ],
  citizenConfirmedFields: [],
  missingRequiredFields: [],
  warnings: [],
};

const lotteryDraft: IncidentDraft = {
  classification: {
    reportFamily: "FINANCIAL_FRAUD",
    category: "Financial Fraud",
    subCategory: "Online Lottery Scam",
    cyberElementPresent: true,
    moneyLost: false,
    platform: "WhatsApp",
    ambiguity: "NONE",
    explanation: "A false lottery prize was used to request a processing fee and sensitive information.",
    requiresCitizenConfirmation: false,
  },
  adaptiveFacts: {
    ...emptyAdaptiveFacts,
    platform: "WhatsApp",
    messageSourcePlatforms: ["WhatsApp"],
    platformType: "MESSAGING",
    impersonation: true,
    impersonatedEntity: "KBC lucky draw",
    communicationChannels: ["WhatsApp", "Phone call"],
    requestedSensitiveInfo: ["Aadhaar image", "Bank details"],
  },
  citizenSummary: {
    incidentLabel: "Online lottery attempt",
    shortSummary: "Vivek was promised a ₹25 lakh prize and asked for a ₹10,000 processing fee, Aadhaar image and bank details. He paid and shared nothing.",
  },
  officialMapping: {
    category: "FINANCIAL_FRAUD",
    categoryLabel: "Financial Fraud",
    subCategoryLabel: "Online Lottery Scam",
    mappingConfidence: "HIGH",
  },
  incident: {
    financialLossState: "NO",
    moneyLost: false,
    statedTotalLoss: null,
    citizenConfirmedLoss: null,
    reportedAmount: null,
    openingBalance: null,
    intermediateBalances: [],
    closingBalance: null,
    incidentDate: "2026-09-03",
    incidentDateWithoutYear: null,
    approximateTime: null,
    delayInReporting: false,
    delayReason: null,
    occurredOn: "WhatsApp and phone call",
    narrative: lotteryStatement,
  },
  financialExposure: {
    bankDetailsRequested: true,
    identityDocumentRequested: true,
    otpRequested: false,
    paymentLinkReceived: false,
    upiCollectRequestReceived: false,
  },
  mentionedInstitutions: [],
  transactions: [],
  suspectIdentifiers: [{ type: "PHONE", value: "97XX XX2500" }],
  evidence: [
    { type: "CHAT_SCREENSHOT", extractedFacts: ["Synthetic KBC lucky-draw claim", "Prize promised: ₹25,00,000", "Processing fee requested: ₹10,000"] },
    { type: "OTHER", extractedFacts: ["Synthetic missed call from 97XX XX2500"] },
    { type: "OTHER", extractedFacts: ["Synthetic prize image", "Aadhaar image and bank details requested"] },
  ],
  citizenConfirmedFields: [],
  missingRequiredFields: [],
  warnings: [],
};

const extortionDraft: IncidentDraft = {
  classification: {
    reportFamily: "WOMEN_CHILDREN_RELATED_CRIME",
    category: "Women / Children Related Crime",
    subCategory: "Online abusive-content report",
    cyberElementPresent: true,
    moneyLost: false,
    platform: "Telegram",
    ambiguity: "NONE",
    explanation: "An unknown account threatened to distribute private photos unless money was paid.",
    requiresCitizenConfirmation: false,
  },
  adaptiveFacts: {
    ...emptyAdaptiveFacts,
    platform: "Telegram",
    messageSourcePlatforms: ["Telegram", "Email"],
    platformType: "MESSAGING",
    threatOrExtortion: true,
    demandedAmount: 20_000,
    threatChannel: "Telegram and Email",
    threatDescription: "An unknown sender threatened to share private photos with the citizen's contacts unless money was paid.",
    sensitiveMaterialInvolved: true,
    communicationChannels: ["Telegram", "Email"],
    sensitiveEvidenceRedacted: true,
  },
  citizenSummary: {
    incidentLabel: "Online threat and extortion",
    shortSummary: "Riya received the same threat through Telegram and email. The sender demanded ₹20,000, but she made no payment.",
  },
  officialMapping: {
    category: "WOMEN_CHILDREN_RELATED_CRIME",
    categoryLabel: "Women / Children Related Crime",
    subCategoryLabel: "Online abusive-content report",
    mappingConfidence: "HIGH",
  },
  incident: {
    financialLossState: "NO",
    moneyLost: false,
    statedTotalLoss: null,
    citizenConfirmedLoss: null,
    reportedAmount: null,
    openingBalance: null,
    intermediateBalances: [],
    closingBalance: null,
    incidentDate: "2026-09-03",
    incidentDateWithoutYear: null,
    approximateTime: null,
    delayInReporting: false,
    delayReason: null,
    occurredOn: "Telegram and Email",
    narrative: extortionStatement,
  },
  financialExposure: {
    bankDetailsRequested: false,
    identityDocumentRequested: false,
    otpRequested: false,
    paymentLinkReceived: false,
    upiCollectRequestReceived: false,
  },
  mentionedInstitutions: [],
  transactions: [],
  suspectIdentifiers: [
    { type: "SOCIAL_HANDLE", value: "@unknown_demo_account" },
    { type: "EMAIL", value: "unknown.sender@example.invalid" },
  ],
  evidence: [
    { type: "CHAT_SCREENSHOT", extractedFacts: ["Synthetic Telegram threat message", "Sensitive wording redacted", "₹20,000 demanded"] },
    { type: "OTHER", extractedFacts: ["Synthetic email repeating the threat", "Sender address preserved"] },
    { type: "OTHER", extractedFacts: ["Synthetic Telegram profile", "Actual identity unknown"] },
  ],
  citizenConfirmedFields: [],
  missingRequiredFields: [],
  warnings: [],
};

for (const draft of [amountMismatchDraft, accountCompromiseDraft, lotteryDraft, extortionDraft]) {
  IncidentDraftSchema.parse(draft);
}

export const DEMO_CASES: readonly DemoCaseDefinition[] = [
  {
    id: "AMOUNT_MISMATCH",
    selectorLabel: "Amount mismatch",
    selectorLabelHi: "राशि में अंतर",
    citizen: demoProfile("Asha Verma", "Female", "0024", "asha.demo"),
    sourceLanguage: "Hinglish",
    statement: amountMismatchStatement,
    narrations: {
      "en-IN": narration("en-IN", amountMismatchEnglish, 19, "/demo/audio/amount-mismatch.mp3"),
      "hi-IN": narration("hi-IN", amountMismatchHindi, 25, "/demo/audio/amount-mismatch-hi.mp3"),
    },
    evidence: [
      { id: "demo-evidence-0", src: "/demo/evidence/asha-kyc-message-demo.svg", label: "WhatsApp KYC message", labelHi: "WhatsApp KYC संदेश", typeLabel: "Message screenshot", typeLabelHi: "संदेश का स्क्रीनशॉट" },
      { id: "demo-evidence-1", src: "/demo/evidence/asha-transaction-5000-demo.svg", label: "₹5,000 transaction", labelHi: "₹5,000 लेन-देन", typeLabel: "Transaction screenshot", typeLabelHi: "लेन-देन का स्क्रीनशॉट" },
      { id: "demo-evidence-2", src: "/demo/evidence/asha-transaction-15000-demo.svg", label: "₹15,000 transaction", labelHi: "₹15,000 लेन-देन", typeLabel: "Transaction screenshot", typeLabelHi: "लेन-देन का स्क्रीनशॉट" },
    ],
    draft: amountMismatchDraft,
    reference: "सचेत-DEMO-AMOUNT-001",
  },
  {
    id: "ACCOUNT_COMPROMISE",
    selectorLabel: "Account compromise",
    selectorLabelHi: "अकाउंट पर कब्ज़ा",
    citizen: demoProfile("Shubham Mehta", "Male", "1187", "shubham.demo"),
    sourceLanguage: "English + Hinglish",
    statement: accountCompromiseStatement,
    narrations: {
      "en-IN": narration("en-IN", accountCompromiseEnglish, 15, "/demo/audio/account-compromise.mp3"),
      "hi-IN": narration("hi-IN", accountCompromiseHindi, 17, "/demo/audio/account-compromise-hi.mp3"),
    },
    evidence: [
      { id: "demo-evidence-0", src: "/demo/evidence/account-reset-demo.svg", label: "Instagram password-reset email", labelHi: "Instagram पासवर्ड-रीसेट ईमेल", typeLabel: "Email screenshot", typeLabelHi: "ईमेल का स्क्रीनशॉट" },
      { id: "demo-evidence-1", src: "/demo/evidence/account-security-demo.svg", label: "WhatsApp security notification", labelHi: "WhatsApp सुरक्षा सूचना", typeLabel: "Security screenshot", typeLabelHi: "सुरक्षा स्क्रीनशॉट" },
      { id: "demo-evidence-2", src: "/demo/evidence/unknown-device-demo.svg", label: "Unknown login device", labelHi: "अनजान लॉगिन डिवाइस", typeLabel: "Account activity", typeLabelHi: "अकाउंट गतिविधि" },
    ],
    draft: accountCompromiseDraft,
    reference: "सचेत-DEMO-ACCOUNT-002",
  },
  {
    id: "LOTTERY_ATTEMPT",
    selectorLabel: "Lottery attempt",
    selectorLabelHi: "लॉटरी की कोशिश",
    citizen: demoProfile("Vivek Sharma", "Male", "2500", "vivek.demo"),
    sourceLanguage: "Hindi / Hinglish",
    statement: lotteryStatement,
    narrations: {
      "en-IN": narration("en-IN", lotteryEnglish, 16, "/demo/audio/lottery-attempt.mp3"),
      "hi-IN": narration("hi-IN", lotteryHindi, 16, "/demo/audio/lottery-attempt-hi.mp3"),
    },
    evidence: [
      { id: "demo-evidence-0", src: "/demo/evidence/lottery-message-demo.svg", label: "WhatsApp lottery message", labelHi: "WhatsApp लॉटरी संदेश", typeLabel: "Message screenshot", typeLabelHi: "संदेश का स्क्रीनशॉट" },
      { id: "demo-evidence-1", src: "/demo/evidence/call-log-demo.svg", label: "Missed-call log", labelHi: "मिस्ड-कॉल लॉग", typeLabel: "Call record", typeLabelHi: "कॉल रिकॉर्ड" },
      { id: "demo-evidence-2", src: "/demo/evidence/prize-claim-demo.svg", label: "Prize claim image", labelHi: "इनाम के दावे की तस्वीर", typeLabel: "Claim image", typeLabelHi: "दावे की तस्वीर" },
    ],
    draft: lotteryDraft,
    reference: "सचेत-DEMO-LOTTERY-003",
  },
  {
    id: "EXTORTION",
    selectorLabel: "Extortion",
    selectorLabelHi: "धमकी और वसूली",
    citizen: demoProfile("Riya Kapoor", "Female", "7721", "riya.demo"),
    sourceLanguage: "Hindi + English",
    statement: extortionStatement,
    narrations: {
      "en-IN": narration("en-IN", extortionEnglish, 15, "/demo/audio/extortion.mp3"),
      "hi-IN": narration("hi-IN", extortionHindi, 21, "/demo/audio/extortion-hi.mp3"),
    },
    evidence: [
      { id: "demo-evidence-0", src: "/demo/evidence/telegram-threat-demo.svg", label: "Redacted Telegram threat", labelHi: "छिपाया गया Telegram धमकी संदेश", typeLabel: "Message screenshot", typeLabelHi: "संदेश का स्क्रीनशॉट" },
      { id: "demo-evidence-1", src: "/demo/evidence/email-threat-demo.svg", label: "Threat email", labelHi: "धमकी वाला ईमेल", typeLabel: "Email screenshot", typeLabelHi: "ईमेल का स्क्रीनशॉट" },
      { id: "demo-evidence-2", src: "/demo/evidence/unknown-profile-demo.svg", label: "Unknown account profile", labelHi: "अनजान अकाउंट प्रोफ़ाइल", typeLabel: "Profile screenshot", typeLabelHi: "प्रोफ़ाइल स्क्रीनशॉट" },
    ],
    draft: extortionDraft,
    reference: "सचेत-DEMO-EXTORTION-004",
  },
];

export const DEFAULT_DEMO_CASE_ID: DemoCaseId = "AMOUNT_MISMATCH";

export function getDemoCase(caseId: DemoCaseId): DemoCaseDefinition {
  return DEMO_CASES.find((item) => item.id === caseId) ?? DEMO_CASES[0];
}

// Backward-compatible aliases for existing consumers and domain regression fixtures.
const defaultDemo = getDemoCase(DEFAULT_DEMO_CASE_ID);
export const DEMO_NARRATIONS = defaultDemo.narrations;
export const DEMO_TYPED_DESCRIPTION = defaultDemo.statement;
export const DEMO_INCIDENT_DRAFT = defaultDemo.draft;

export function createUnknownIncidentDraft(): IncidentDraft {
  return {
    classification: {
      reportFamily: "OUT_OF_SCOPE_OR_UNCLEAR",
      category: null,
      subCategory: null,
      cyberElementPresent: null,
      moneyLost: null,
      platform: null,
      ambiguity: "INSUFFICIENT_INFORMATION",
      explanation: null,
      requiresCitizenConfirmation: false,
    },
    adaptiveFacts: { ...emptyAdaptiveFacts },
    citizenSummary: { incidentLabel: "Incident details not yet known", shortSummary: "" },
    officialMapping: {
      category: null,
      categoryLabel: null,
      subCategoryLabel: null,
      mappingConfidence: "LOW",
    },
    incident: {
      financialLossState: "UNKNOWN",
      moneyLost: null,
      statedTotalLoss: null,
      citizenConfirmedLoss: null,
      reportedAmount: null,
      openingBalance: null,
      intermediateBalances: [],
      closingBalance: null,
      incidentDate: null,
      incidentDateWithoutYear: null,
      approximateTime: null,
      delayInReporting: null,
      delayReason: null,
      occurredOn: null,
      narrative: null,
    },
    financialExposure: {
      bankDetailsRequested: null,
      identityDocumentRequested: null,
      otpRequested: null,
      paymentLinkReceived: null,
      upiCollectRequestReceived: null,
    },
    mentionedInstitutions: [],
    transactions: [],
    suspectIdentifiers: [],
    evidence: [],
    citizenConfirmedFields: [],
    missingRequiredFields: [],
    warnings: [],
  };
}
