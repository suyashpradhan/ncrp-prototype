import type { FinancialState, LegalOutcomeState } from "../domain/outcomes";
import type { ProcessEventType } from "../domain/events";
import type { FraudType } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessRoute } from "../sop/processes";

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
    label: message("navigation.label", "Case sections"),
    overview: message("navigation.overview", "Case overview"),
    ledger: message("navigation.ledger", "Money ledger"),
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
