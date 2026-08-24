import type { FinancialState, LegalOutcomeState } from "../domain/outcomes";
import type { ProcessEventType } from "../domain/events";
import type { FraudType } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessRoute, Provenance } from "../sop/processes";

const message = (key: string, defaultMessage: string): Message => ({ key, defaultMessage });

export const UI_MESSAGES = {
  prototype: {
    shortDisclosure: message(
      "prototype.shortDisclosure",
      "Synthetic demo. No live NCRP, police or banking system is connected.",
    ),
    fullDisclosure: message(
      "prototype.fullDisclosure",
      "Prototype using synthetic NCRP/CFCFRMS data. No live government systems are connected.",
    ),
    label: message("prototype.label", "Independent hackathon prototype"),
  },
  brand: {
    eyebrow: message("brand.eyebrow", "Financial resolution"),
    name: message("brand.name", "Money Path"),
  },
  navigation: {
    label: message("navigation.label", "Primary navigation"),
    overview: message("navigation.overview", "Case overview"),
    ledger: message("navigation.ledger", "Money ledger"),
    about: message("navigation.about", "About"),
  },
  common: {
    waitingOn: message("common.waitingOn", "Waiting on"),
    citizenAction: message("common.citizenAction", "Your action"),
    currentStep: message("common.currentStep", "What’s happening"),
    institution: message("common.institution", "Bank / institution"),
    processClock: message("common.processClock", "Applicable process window"),
    current: message("common.current", "Current"),
    recordedProcess: message("common.recordedProcess", "Recorded process"),
    financialOutcome: message("common.financialOutcome", "Financial outcome"),
    legalOutcome: message("common.legalOutcome", "Legal status"),
    acknowledgement: message("common.acknowledgement", "Synthetic acknowledgement"),
    fir: message("common.fir", "FIR status"),
    jurisdiction: message("common.jurisdiction", "Jurisdiction"),
    reportedLoss: message("common.reportedLoss", "Reported loss"),
    fraudType: message("common.fraudType", "Fraud type"),
    registered: message("common.registered", "Registered"),
    notRegistered: message("common.notRegistered", "Not registered"),
    moneyPath: message("common.moneyPath", "Money path"),
    unknownInstitution: message(
      "common.unknownInstitution",
      "No institution currently recorded",
    ),
    noBeneficiaryInstitution: message(
      "common.noBeneficiaryInstitution",
      "No beneficiary institution currently recorded",
    ),
    viewPath: message("common.viewPath", "View this money path"),
    noClock: message(
      "common.noClock",
      "No procedural clock is encoded for the current stage.",
    ),
    basedOnSop: message("common.basedOnSop", "Based on the January 2026 NCRP-CFCFRMS SOP."),
    backToOverview: message("common.backToOverview", "Back to case overview"),
  },
  overview: {
    eyebrow: message("overview.eyebrow", "Complaint financial resolution"),
    title: message("overview.title", "Your complaint does not have one status."),
    intro: message(
      "overview.intro",
      "Different portions of your money are currently waiting on different actors. Here is what needs attention now.",
    ),
    sectionTitle: message("overview.sectionTitle", "What is happening right now"),
    sectionIntro: message(
      "overview.sectionIntro",
      "Money paths are ordered by current relevance, not by transaction time.",
    ),
    ledgerCtaTitle: message("overview.ledgerCtaTitle", "See where the full reported amount went"),
    ledgerCtaBody: message(
      "overview.ledgerCtaBody",
      "The money ledger reconciles every portion to your reported loss.",
    ),
    ledgerCta: message("overview.ledgerCta", "Open money ledger"),
    pathCount: message("overview.pathCount", "Four portions · four current states"),
    summaryLabel: message("overview.summaryLabel", "Synthetic complaint summary"),
  },
  ledger: {
    eyebrow: message("ledger.eyebrow", "Reconciled money ledger"),
    title: message("ledger.title", "Where did the reported money go in the system?"),
    intro: message(
      "ledger.intro",
      "Each row is one money path. Together, the paths equal the full amount reported in this synthetic complaint.",
    ),
    reported: message("ledger.reported", "Reported"),
    allocated: message("ledger.allocated", "Across money paths"),
    difference: message("ledger.difference", "Unaccounted difference"),
    reconciled: message("ledger.reconciled", "All money paths reconcile to the reported loss."),
    pathList: message("ledger.pathList", "Money paths"),
    reconciliationLabel: message("ledger.reconciliationLabel", "Case amount reconciliation"),
  },
  detail: {
    eyebrow: message("detail.eyebrow", "Money path detail"),
    title: message("detail.title", "Why is this amount here?"),
    processSummary: message("detail.processSummary", "Current process state"),
    outcomes: message("detail.outcomes", "Financial and legal outcomes"),
    routeInterpreter: message("detail.routeInterpreter", "Recorded process information"),
    routeGuardrail: message(
      "detail.routeGuardrail",
      "These are recorded synthetic case facts. The application did not choose this process.",
    ),
    eventHistory: message("detail.eventHistory", "Recorded event history"),
    eventHistoryIntro: message(
      "detail.eventHistoryIntro",
      "Events are shown most recent first. This is a history, not a whole-case progress bar.",
    ),
    provenance: message("detail.provenance", "Why is this shown?"),
    provenanceIntro: message(
      "detail.provenanceIntro",
      "This explains the encoded source behind the recorded process information shown above.",
    ),
    provenanceSource: message("detail.provenanceSource", "Source"),
    provenanceProcess: message("detail.provenanceProcess", "Recorded process"),
    provenanceReference: message("detail.provenanceReference", "Reference used in this demo"),
    provenanceNote: message("detail.provenanceNote", "Prototype note"),
    provenanceMissing: message(
      "detail.provenanceMissing",
      "No SOP-derived source is attached to this money path, so the application does not infer a restoration route or deadline.",
    ),
    provenanceLearnMore: message(
      "detail.provenanceLearnMore",
      "How this prototype uses process sources",
    ),
    noRecordedProcess: message("detail.noRecordedProcess", "No process route currently recorded"),
    rightNow: message("detail.rightNow", "Right now"),
    honestOutcomes: message("detail.honestOutcomes", "Honest outcomes"),
    authoritativeRecord: message(
      "detail.authoritativeRecord",
      "Authoritative synthetic record",
    ),
    eventDrivenState: message("detail.eventDrivenState", "Event-driven state"),
  },
  clock: {
    day: message("clock.day", "Day"),
    overdue: message("clock.overdue", "days beyond this process window"),
    withinWindow: message("clock.withinWindow", "Within the recorded process window"),
  },
  demo: {
    label: message("demo.label", "Prototype case player"),
    title: message("demo.title", "Watch the process engine update this money path"),
    description: message(
      "demo.description",
      "This control appends the next synthetic event. It does not replace display text or select a legal route.",
    ),
    focus: message("demo.focus", "Demo focus"),
    caseDate: message("demo.caseDate", "Synthetic case date"),
    nextEvent: message("demo.nextEvent", "Next recorded event"),
    simulate: message("demo.simulate", "Simulate next case update"),
    reset: message("demo.reset", "Reset synthetic case"),
    complete: message(
      "demo.complete",
      "No further Process 1 event is modeled for this path.",
    ),
    latestUpdate: message("demo.latestUpdate", "Latest simulated event"),
    noUpdate: message("demo.noUpdate", "No simulated update has been applied yet."),
  },
  footer: {
    guardrail: message(
      "footer.guardrail",
      "This prototype explains supplied synthetic state; it does not determine legal entitlement.",
    ),
    aboutLink: message("footer.aboutLink", "About this prototype"),
  },
  about: {
    eyebrow: message("about.eyebrow", "About this prototype"),
    title: message(
      "about.title",
      "A clearer view of an existing financial-resolution process.",
    ),
    intro: message(
      "about.intro",
      "Money Path is a standalone hackathon prototype showing how one reported cyber-fraud loss can become several concurrent money paths with different actors and process states.",
    ),
    disclosureTitle: message("about.disclosureTitle", "This is not a government service."),
    disclosureBody: message(
      "about.disclosureBody",
      "It is not NCRP or MRM, it is not connected to a live complaint, and it does not represent government endorsement or deployment.",
    ),
    modeledEyebrow: message("about.modeledEyebrow", "Modeled structure"),
    modeledTitle: message("about.modeledTitle", "What the process model represents"),
    modeledIntro: message(
      "about.modeledIntro",
      "These are conceptual relationships and encoded rules represented in the demonstration.",
    ),
    modeledItems: [
      message(
        "about.modeledItem.moneyPaths",
        "One reported loss can be represented as several money paths that reconcile to the reported total.",
      ),
      message(
        "about.modeledItem.actors",
        "The represented actors include the citizen, Investigating Officer, police authority, beneficiary account holder and bank.",
      ),
      message(
        "about.modeledItem.rules",
        "Process 1 stages and procedural clocks are encoded for the demonstration from the January 2026 NCRP-CFCFRMS SOP.",
      ),
      message(
        "about.modeledItem.separation",
        "Recorded process, financial outcome and legal outcome remain separate concepts.",
      ),
    ],
    syntheticEyebrow: message("about.syntheticEyebrow", "Synthetic case data"),
    syntheticTitle: message("about.syntheticTitle", "What is completely mocked"),
    syntheticIntro: message(
      "about.syntheticIntro",
      "None of the case details shown in this application describe a real person or live government record.",
    ),
    syntheticItems: [
      message("about.syntheticItem.citizen", "The citizen, complaint and acknowledgement number."),
      message("about.syntheticItem.accounts", "Banks, beneficiary accounts and masked account numbers."),
      message("about.syntheticItem.activity", "Police, bank, court and account-holder activity."),
      message("about.syntheticItem.events", "Timestamps, holds, requests, directions and restoration events."),
      message("about.syntheticItem.integrations", "All NCRP, CFCFRMS, MRM, police and banking integrations."),
    ],
    boundariesEyebrow: message("about.boundariesEyebrow", "Product boundaries"),
    boundariesTitle: message("about.boundariesTitle", "What this prototype does not do"),
    boundariesIntro: message(
      "about.boundariesIntro",
      "The interface explains supplied synthetic state. It does not create or alter official state.",
    ),
    boundaryItems: [
      message("about.boundaryItem.reporting", "It does not file or modify a cybercrime complaint or restoration request."),
      message("about.boundaryItem.route", "It does not select an SOP process or decide legal entitlement."),
      message("about.boundaryItem.deadline", "It does not invent an end-to-end deadline or predict a refund date."),
      message("about.boundaryItem.advice", "It does not provide personalised legal advice or declare an actor legally at fault."),
    ],
    provenanceEyebrow: message("about.provenanceEyebrow", "Source transparency"),
    provenanceTitle: message("about.provenanceTitle", "How provenance is used"),
    provenanceBody: message(
      "about.provenanceBody",
      "When a money path shows an SOP-derived route or procedural clock, its detail view can expose the encoded source, recorded process, demonstration reference and a prototype note. Provenance explains why information is displayed; it is not evidence of live official action or legal entitlement.",
    ),
    principle: message("about.principle", "Rules determine state. The interface explains state."),
  },
  notFound: {
    eyebrow: message("notFound.eyebrow", "Money path not found"),
    title: message("notFound.title", "This synthetic money path is not available."),
    body: message(
      "notFound.body",
      "Return to the case overview to view the four recorded paths.",
    ),
  },
} as const;

export const PROVENANCE_SOURCE_MESSAGES = {
  JAN_2026_NCRP_CFCFRMS_SOP: message(
    "provenanceSource.january2026Sop",
    "January 2026 NCRP-CFCFRMS SOP",
  ),
} satisfies Record<Provenance["source"], Message>;

export const PROCESS_ROUTE_MESSAGES = {
  PROCESS_1: message("processRoute.process1", "Process 1"),
  PROCESS_2: message("processRoute.process2", "Process 2"),
  PROCESS_3: message("processRoute.process3", "Process 3"),
  PROCESS_4: message("processRoute.process4", "Process 4"),
  PROCESS_5: message("processRoute.process5", "Process 5"),
} satisfies Record<ProcessRoute, Message>;

export const FRAUD_TYPE_MESSAGES = {
  INVESTMENT_SCAM: message("fraudType.investmentScam", "Investment scam"),
  UPI_FRAUD: message("fraudType.upiFraud", "UPI fraud"),
  DIGITAL_ARREST: message("fraudType.digitalArrest", "Digital arrest"),
  TASK_SCAM: message("fraudType.taskScam", "Task scam"),
  IMPERSONATION: message("fraudType.impersonation", "Impersonation"),
  CARD_FRAUD: message("fraudType.cardFraud", "Card fraud"),
  MARKETPLACE_SCAM: message("fraudType.marketplaceScam", "Marketplace scam"),
  BETTING_LINKED: message("fraudType.bettingLinked", "Betting-linked fraud"),
  OTHER_FINANCIAL_FRAUD: message("fraudType.other", "Other financial fraud"),
} satisfies Record<FraudType, Message>;

export const FINANCIAL_STATE_MESSAGES = {
  HELD: message("financialState.held", "Held"),
  RESTORATION_PROCESSING: message("financialState.processing", "Held · restoration processing"),
  INTERIM_CUSTODY: message("financialState.interimCustody", "Interim custody confirmed"),
  EXITED_FINANCIAL_SYSTEM: message("financialState.exited", "Exited the financial system"),
  NOT_CURRENTLY_HELD: message("financialState.notHeld", "Not currently held"),
  MULTI_VICTIM_ATTRIBUTION: message("financialState.attribution", "Attribution pending"),
} satisfies Record<FinancialState, Message>;

export const LEGAL_OUTCOME_MESSAGES = {
  RECORDED_PROCESS_ACTIVE: message("legalOutcome.active", "Recorded process active"),
  INTERIM_CUSTODY_UNDER_RECORDED_PROCESS: message(
    "legalOutcome.interimCustody",
    "Interim custody under the recorded process",
  ),
  COURT_ROUTE_RECORDED: message("legalOutcome.court", "Court route recorded"),
  NO_RECORDED_RESTORATION_PROCESS: message(
    "legalOutcome.noProcess",
    "No restoration process currently recorded",
  ),
} satisfies Record<LegalOutcomeState, Message>;

export const EVENT_MESSAGES = {
  COMPLAINT_REGISTERED: message("event.complaintRegistered", "Complaint registered"),
  FIR_REGISTERED: message("event.firRegistered", "FIR registered"),
  MONEY_PATH_IDENTIFIED: message("event.moneyPathIdentified", "Money path identified"),
  AMOUNT_HELD: message("event.amountHeld", "Amount recorded as held"),
  AMOUNT_EXITED_FINANCIAL_SYSTEM: message(
    "event.amountExited",
    "Amount recorded as having exited the financial system",
  ),
  AMOUNT_NOT_CURRENTLY_HELD: message(
    "event.amountNotHeld",
    "Amount recorded as not currently held",
  ),
  MRM_REQUEST_RAISED: message("event.mrmRequestRaised", "Restoration request raised in MRM"),
  REQUEST_ASSIGNED_TO_IO: message(
    "event.requestAssignedToIo",
    "Restoration request assigned to the concerned Investigating Officer",
  ),
  ACCOUNT_HOLDER_NOTICE_REQUIRED: message(
    "event.noticeRequired",
    "Account-holder notice marked as required",
  ),
  ACCOUNT_HOLDER_NOTICE_ISSUED: message("event.noticeIssued", "Account-holder notice issued"),
  ACCOUNT_HOLDER_RESPONDED: message("event.accountHolderResponded", "Account holder responded"),
  ACCOUNT_HOLDER_NON_RESPONSE_RECORDED: message(
    "event.nonResponse",
    "Account-holder non-response recorded",
  ),
  SP_DCP_APPROVAL_RECORDED: message("event.approval", "SP / DCP approval recorded"),
  INDEMNITY_BOND_RECORDED: message("event.bond", "Indemnity bond recorded"),
  BANK_DIRECTION_ISSUED: message("event.bankDirectionIssued", "Direction issued to the bank"),
  BANK_DIRECTION_RECEIVED: message(
    "event.bankDirectionReceived",
    "Direction recorded as received by the bank",
  ),
  INTERIM_CUSTODY_CONFIRMED: message(
    "event.interimCustodyConfirmed",
    "Interim custody confirmed",
  ),
  ACCOUNT_HOLDER_CONTESTED: message("event.contested", "Account holder contested the action"),
  COURT_ROUTE_RECORDED: message("event.courtRoute", "Court route recorded"),
} satisfies Record<ProcessEventType, Message>;
