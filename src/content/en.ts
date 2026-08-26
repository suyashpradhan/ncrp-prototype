import type { FinancialState, LegalOutcomeState } from "../domain/outcomes";
import type { ProcessEventType } from "../domain/events";
import type { FraudType } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessRoute, Provenance } from "../sop/processes";

const message = (key: string, defaultMessage: string): Message => ({
  key,
  defaultMessage,
});

export const UI_MESSAGES = {
  prototype: {
    shortDisclosure: message(
      "prototype.shortDisclosure",
      "Independent prototype · Synthetic data",
    ),
    fullDisclosure: message(
      "prototype.fullDisclosure",
      "Uses synthetic case data · No government system is connected",
    ),
    label: message("prototype.label", "Independent prototype · Synthetic data"),
  },
  brand: {
    eyebrow: message("brand.eyebrow", "NCRP experience prototype"),
    name: message("brand.name", "Financial Cyber Fraud Reporting"),
  },
  navigation: {
    label: message("navigation.label", "Primary navigation"),
    overview: message("navigation.overview", "Your case"),
    ledger: message("navigation.ledger", "How this works"),
    about: message("navigation.about", "About this prototype"),
    fullFlow: message("navigation.fullFlow", "Full flow"),
  },
  common: {
    waitingOn: message("common.waitingOn", "Who needs to act?"),
    citizenAction: message("common.citizenAction", "You need to do"),
    currentStep: message("common.currentStep", "What’s happening"),
    institution: message("common.institution", "Bank / institution"),
    processClock: message("common.processClock", "Applicable process window"),
    current: message("common.current", "Current"),
    recordedProcess: message("common.recordedProcess", "Recorded process"),
    financialOutcome: message("common.financialOutcome", "Financial outcome"),
    legalOutcome: message("common.legalOutcome", "Legal status"),
    acknowledgement: message(
      "common.acknowledgement",
      "Synthetic acknowledgement",
    ),
    fir: message("common.fir", "FIR status"),
    jurisdiction: message("common.jurisdiction", "Jurisdiction"),
    reportedLoss: message("common.reportedLoss", "Reported"),
    fraudType: message("common.fraudType", "Fraud type"),
    registered: message("common.registered", "Registered"),
    notRegistered: message("common.notRegistered", "Not registered"),
    moneyPath: message("common.moneyPath", "This amount"),
    unknownInstitution: message(
      "common.unknownInstitution",
      "No institution currently recorded",
    ),
    noBeneficiaryInstitution: message(
      "common.noBeneficiaryInstitution",
      "No beneficiary institution currently recorded",
    ),
    viewPath: message("common.viewPath", "View this amount"),
    noClock: message(
      "common.noClock",
      "No procedural clock is encoded for the current stage.",
    ),
    basedOnSop: message(
      "common.basedOnSop",
      "Based on the January 2026 NCRP-CFCFRMS SOP.",
    ),
    backToOverview: message("common.backToOverview", "Back"),
  },
  overview: {
    eyebrow: message("overview.eyebrow", "Complaint financial resolution"),
    title: message(
      "overview.title",
      "Your complaint does not have one status.",
    ),
    intro: message(
      "overview.intro",
      "Different portions of your money are currently waiting on different actors. Here is what needs attention now.",
    ),
    sectionTitle: message(
      "overview.sectionTitle",
      "What is happening right now",
    ),
    sectionIntro: message(
      "overview.sectionIntro",
      "Amounts are ordered by what needs attention now, not by transaction time.",
    ),
    ledgerCtaTitle: message(
      "overview.ledgerCtaTitle",
      "See where the full reported amount went",
    ),
    ledgerCtaBody: message(
      "overview.ledgerCtaBody",
      "The amount summary accounts for every portion of the reported loss.",
    ),
    ledgerCta: message("overview.ledgerCta", "View amount summary"),
    pathCount: message(
      "overview.pathCount",
      "Four portions · four current states",
    ),
    summaryLabel: message(
      "overview.summaryLabel",
      "Synthetic complaint summary",
    ),
  },
  ledger: {
    eyebrow: message("ledger.eyebrow", "Reported amount overview"),
    title: message("ledger.title", "Where the reported money stands"),
    intro: message(
      "ledger.intro",
      "Together, these recorded amounts equal the full loss in this synthetic complaint.",
    ),
    reported: message("ledger.reported", "Reported"),
    allocated: message("ledger.allocated", "Across recorded amounts"),
    difference: message("ledger.difference", "Unaccounted difference"),
    reconciled: message(
      "ledger.reconciled",
      "All recorded amounts reconcile to the reported loss.",
    ),
    pathList: message("ledger.pathList", "Recorded amounts"),
    reconciliationLabel: message(
      "ledger.reconciliationLabel",
      "Case amount reconciliation",
    ),
  },
  detail: {
    eyebrow: message("detail.eyebrow", "Amount detail"),
    title: message("detail.title", "Why is this amount here?"),
    processSummary: message("detail.processSummary", "Current process state"),
    outcomes: message("detail.outcomes", "Financial and legal outcomes"),
    routeInterpreter: message(
      "detail.routeInterpreter",
      "Recorded process information",
    ),
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
    provenanceReference: message(
      "detail.provenanceReference",
      "Reference used in this demo",
    ),
    provenanceNote: message("detail.provenanceNote", "Prototype note"),
    provenanceMissing: message(
      "detail.provenanceMissing",
      "No SOP-derived source is attached to this amount, so the application does not infer a restoration route or deadline.",
    ),
    provenanceLearnMore: message(
      "detail.provenanceLearnMore",
      "How this prototype uses process sources",
    ),
    noRecordedProcess: message(
      "detail.noRecordedProcess",
      "No process route currently recorded",
    ),
    rightNow: message("detail.rightNow", "Right now"),
    honestOutcomes: message("detail.honestOutcomes", "Honest outcomes"),
    authoritativeRecord: message(
      "detail.authoritativeRecord",
      "Authoritative synthetic record",
    ),
    eventDrivenState: message(
      "detail.eventDrivenState",
      "State derived from recorded updates",
    ),
  },
  clock: {
    day: message("clock.day", "Day"),
    overdue: message("clock.overdue", "days beyond this process window"),
    withinWindow: message(
      "clock.withinWindow",
      "Within the recorded process window",
    ),
  },
  demo: {
    label: message("demo.label", "Demo mode"),
    title: message("demo.title", "Prototype demo control"),
    description: message(
      "demo.description",
      "In a live service, these updates would come from NCRP/CFCFRMS, police or participating banks.",
    ),
    focus: message("demo.focus", "Demo focus"),
    caseDate: message("demo.caseDate", "Synthetic case date"),
    nextEvent: message("demo.nextEvent", "Next recorded event"),
    simulate: message("demo.simulate", "Simulate next official update"),
    reset: message("demo.reset", "Reset demo"),
    complete: message(
      "demo.complete",
      "No further synthetic update is modelled for this amount.",
    ),
    latestUpdate: message("demo.latestUpdate", "Latest simulated event"),
    noUpdate: message(
      "demo.noUpdate",
      "No simulated update has been applied yet.",
    ),
  },
  footer: {
    guardrail: message(
      "footer.guardrail",
      "Independent hackathon prototype. Not affiliated with an official government service. All case information shown is synthetic.",
    ),
    aboutLink: message("footer.aboutLink", "About"),
    howLink: message("footer.howLink", "How this works"),
    sourcesLink: message("footer.sourcesLink", "Sources"),
  },
  about: {
    eyebrow: message("about.eyebrow", "About this prototype"),
    title: message("about.title", "About this prototype"),
    intro: message(
      "about.intro",
      "This independent hackathon prototype explores one citizen journey from organising a financial-cyber-fraud report to understanding restoration and resolution.",
    ),
    conciseIntro: message(
      "about.conciseIntro",
      "The prototype redesigns how a citizen supplies structured NCRP complaint information, shows the existing Money Restoration Module as a simplified handoff, and proposes a clearer Financial Resolution experience afterwards.",
    ),
    noLiveSystem: message(
      "about.noLiveSystem",
      "No live NCRP, police or banking system is connected. This prototype is not affiliated with or endorsed by any official government service.",
    ),
    existingStagesTitle: message(
      "about.existingStagesTitle",
      "Research-grounded process structure",
    ),
    existingStagesBody: message(
      "about.existingStagesBody",
      "Complaint fields, Money Restoration concepts, institutional actors and relevant procedural rules represented in the demo.",
    ),
    proposedTitle: message(
      "about.proposedTitle",
      "Proposed citizen experience",
    ),
    proposedBody: message(
      "about.proposedBody",
      "Plain-language evidence organisation before submission and clear per-amount explanations after submission.",
    ),
    dataTitle: message("about.dataTitle", "Data"),
    dataBody: message(
      "about.dataBody",
      "The citizen, evidence, complaint, transactions, bank and police events are all synthetic.",
    ),
    disclosureTitle: message(
      "about.disclosureTitle",
      "This is not a government service.",
    ),
    disclosureBody: message(
      "about.disclosureBody",
      "It is not NCRP or MRM, it is not connected to a live complaint, and it does not represent government endorsement or deployment.",
    ),
    modeledEyebrow: message("about.modeledEyebrow", "Research-grounded"),
    modeledTitle: message("about.modeledTitle", "Grounded in real processes"),
    modeledIntro: message(
      "about.modeledIntro",
      "These are conceptual relationships and encoded rules represented in the demonstration.",
    ),
    modeledItems: [
      message(
        "about.modeledItem.moneyPaths",
        "NCRP/CFCFRMS actors and the Money Restoration concept.",
      ),
      message(
        "about.modeledItem.actors",
        "The process structure used by police, banks and beneficiary account holders.",
      ),
      message(
        "about.modeledItem.rules",
        "Relevant SOP rules and procedural clocks represented in the demo.",
      ),
      message(
        "about.modeledItem.separation",
        "Separate financial outcomes, legal outcomes and recorded process state.",
      ),
    ],
    syntheticEyebrow: message("about.syntheticEyebrow", "Synthetic case data"),
    syntheticTitle: message("about.syntheticTitle", "Synthetic"),
    syntheticIntro: message(
      "about.syntheticIntro",
      "None of the case details shown in this application describe a real person or live government record.",
    ),
    syntheticItems: [
      message(
        "about.syntheticItem.citizen",
        "The citizen and complaint number.",
      ),
      message(
        "about.syntheticItem.accounts",
        "Bank details and beneficiary accounts.",
      ),
      message("about.syntheticItem.activity", "Police and bank activity."),
      message("about.syntheticItem.events", "Timestamps and financial events."),
      message(
        "about.syntheticItem.integrations",
        "All government, police and banking integrations.",
      ),
    ],
    boundariesEyebrow: message("about.boundariesEyebrow", "Product boundaries"),
    boundariesTitle: message(
      "about.boundariesTitle",
      "What this prototype does not do",
    ),
    boundariesIntro: message(
      "about.boundariesIntro",
      "The interface explains supplied synthetic state. It does not create or alter official state.",
    ),
    boundaryItems: [
      message(
        "about.boundaryItem.reporting",
        "It does not file or modify a cybercrime complaint or restoration request.",
      ),
      message(
        "about.boundaryItem.route",
        "It does not select an SOP process or decide legal entitlement.",
      ),
      message(
        "about.boundaryItem.deadline",
        "It does not invent an end-to-end deadline or predict a refund date.",
      ),
      message(
        "about.boundaryItem.advice",
        "It does not provide personalised legal advice or declare an actor legally at fault.",
      ),
    ],
    provenanceEyebrow: message(
      "about.provenanceEyebrow",
      "Source transparency",
    ),
    provenanceTitle: message("about.provenanceTitle", "How provenance is used"),
    provenanceSummary: message(
      "about.provenanceSummary",
      "Source / provenance details",
    ),
    provenanceBody: message(
      "about.provenanceBody",
      "When an amount shows an SOP-derived route or procedural clock, its detail view can expose the encoded source, recorded process, demonstration reference and a prototype note. Provenance explains why information is displayed; it is not evidence of live official action or legal entitlement.",
    ),
    principle: message(
      "about.principle",
      "Rules determine state. The interface explains state.",
    ),
    principleSummary: message(
      "about.principleSummary",
      "Technical design principle",
    ),
  },
  notFound: {
    eyebrow: message("notFound.eyebrow", "Amount not found"),
    title: message("notFound.title", "This synthetic amount is not available."),
    body: message(
      "notFound.body",
      "Return to your case to view the four recorded amounts.",
    ),
  },
} as const;

export const CITIZEN_MESSAGES = {
  landing: {
    title: message(
      "landing.title",
      "Check what is happening to your reported money",
    ),
    intro: message(
      "landing.intro",
      "Already reported financial cyber fraud through NCRP or 1930? Enter your case details below.",
    ),
    acknowledgement: message(
      "landing.acknowledgement",
      "NCRP acknowledgement number",
    ),
    registeredMobile: message(
      "landing.registeredMobile",
      "Registered mobile number",
    ),
    continue: message("landing.continue", "Continue"),
    useDemo: message("landing.useDemo", "Use demo case"),
    disclosure: message(
      "landing.disclosure",
      "Demo only. No real NCRP account or personal information is used.",
    ),
    invalid: message(
      "landing.invalid",
      "These details do not match the synthetic demo case. Use the demo case to continue.",
    ),
    formLabel: message("landing.formLabel", "Check a reported case"),
  },
  journey: {
    serviceTitle: message(
      "journey.serviceTitle",
      "Track how a reported financial fraud moves from complaint to restoration.",
    ),
    viewDemo: message("journey.viewDemo", "View demo journey"),
    alreadyCase: message("journey.alreadyCase", "Already have a case?"),
    checkCase: message("journey.checkCase", "Check case"),
    note: message("journey.note", "Independent prototype · Synthetic data"),
    victim: message("journey.victim", "Asha Verma — synthetic"),
    progressReport: message("journey.progress.report", "Report"),
    progressTrace: message("journey.progress.trace", "Trace"),
    progressRestore: message("journey.progress.restore", "Restore"),
    progressResolution: message("journey.progress.resolution", "Resolution"),
    fraudTitle: message("journey.fraud.title", "Financial fraud reported"),
    fraudLost: message("journey.fraud.lost", "lost"),
    fraudReported: message(
      "journey.fraud.reported",
      "Asha reports the financial fraud through NCRP / 1930.",
    ),
    continue: message("journey.continue", "Continue"),
    existingNcrp: message(
      "journey.ncrp.existing",
      "Existing NCRP service · redesigned citizen interaction",
    ),
    reportTitle: message("journey.ncrp.title", "Report financial cyber fraud"),
    amount: message("journey.amount", "Amount"),
    incidentDate: message("journey.incidentDate", "Incident date"),
    evidence: message("journey.evidence", "Transaction evidence"),
    transactionRecord: message(
      "journey.evidence.transaction",
      "Transaction record",
    ),
    screenshots: message("journey.evidence.screenshots", "Screenshots"),
    bankStatement: message("journey.evidence.bankStatement", "Bank statement"),
    submitComplaint: message(
      "journey.ncrp.submit",
      "Submit synthetic complaint",
    ),
    complaintRegistered: message(
      "journey.ncrp.registered",
      "Complaint registered",
    ),
    complaintResponse: message(
      "journey.ncrp.response",
      "Your financial cyber-fraud report has been registered in this synthetic demo.",
    ),
    afterReportingTitle: message(
      "journey.afterReporting.title",
      "What happens after reporting?",
    ),
    afterReportingResponse: message(
      "journey.afterReporting.response",
      "Banks and law-enforcement agencies may act on the financial trail connected to a financial cyber-fraud complaint.",
    ),
    afterReportingRestoration: message(
      "journey.afterReporting.restoration",
      "If money becomes eligible for restoration, the citizen may use the separate Money Restoration Module.",
    ),
    afterReportingDemo: message(
      "journey.afterReporting.demo",
      "For this prototype, we’ll move to a later synthetic stage where part of the reported money has been identified for restoration-related processing.",
    ),
    trailTitle: message(
      "journey.trail.title",
      "What happened to the reported money?",
    ),
    trailIntro: message(
      "journey.trail.intro",
      "Different portions of one fraud can end up in different financial situations.",
    ),
    heldAt: message("journey.trail.heldAt", "Held at"),
    received: message(
      "journey.trail.received",
      "Received under interim custody",
    ),
    cashWithdrawal: message("journey.trail.cash", "Cash withdrawal recorded"),
    notSecured: message("journey.trail.notSecured", "Not currently secured"),
    attributionPending: message(
      "journey.trail.attribution",
      "Attribution pending",
    ),
    totalReported: message("journey.trail.total", "Total reported"),
    heldClarification: message(
      "journey.trail.heldClarification",
      "Some money is recorded as held or inside active financial processes in this synthetic case. Held is not the same as received.",
    ),
    continueRestoration: message(
      "journey.trail.continue",
      "Continue to Money Restoration",
    ),
    existingRestoration: message(
      "journey.mrm.existing",
      "Existing government stage · simplified for this prototype",
    ),
    restorationTitle: message("journey.mrm.title", "Money Restoration Module"),
    restorationRequestTitle: message(
      "journey.mrm.requestTitle",
      "Restoration request",
    ),
    ncrpComplaint: message("journey.mrm.complaint", "NCRP complaint"),
    heldEntering: message(
      "journey.mrm.heldEntering",
      "Amounts currently recorded as held",
    ),
    refundAccount: message("journey.mrm.refund", "Refund account"),
    documents: message("journey.mrm.documents", "Required information"),
    ready: message("journey.mrm.ready", "Ready"),
    submitRestoration: message(
      "journey.mrm.submit",
      "Submit synthetic restoration request",
    ),
    restorationSubmitted: message(
      "journey.mrm.submitted",
      "Restoration request submitted",
    ),
    requestId: message("journey.mrm.requestId", "Request ID"),
    requestResponse: message(
      "journey.mrm.response",
      "Your synthetic restoration request has been recorded. It can now move through police, banks and other recorded procedural steps.",
    ),
    seeWhatHappens: message(
      "journey.mrm.next",
      "See what happens next",
    ),
    afterRestoration: message(
      "journey.handoff.title",
      "After requesting restoration",
    ),
    handoffIntro: message(
      "journey.handoff.intro",
      "A request number tells the citizen that the request exists. The underlying process can involve different banks, police actions and different portions of the reported money.",
    ),
    handoffWhere: message("journey.handoff.where", "Where is each amount now?"),
    handoffWho: message("journey.handoff.who", "Who needs to act?"),
    handoffAction: message(
      "journey.handoff.action",
      "Do I need to do anything?",
    ),
    proposedView: message(
      "journey.handoff.proposed",
      "Proposed citizen experience",
    ),
    openResolution: message(
      "journey.handoff.open",
      "See where my money stands",
    ),
  },
  case: {
    eyebrow: message("case.eyebrow", "Financial Resolution"),
    resolutionQuestion: message(
      "case.resolutionQuestion",
      "Where does your reported money stand?",
    ),
    reportedOn: message("case.reportedOn", "Reported"),
    context: message(
      "case.context",
      "You have already reported this fraud and submitted a Money Restoration request.",
    ),
    historyTitle: message("case.historyTitle", "What has happened so far"),
    historyDisclosure: message(
      "case.historyDisclosure",
      "How did we get here?",
    ),
    historyItems: [
      message("case.history.reported", "Fraud reported"),
      message("case.history.trail", "Financial trail started"),
      message("case.history.held", "Some money identified or held"),
      message("case.history.request", "Money Restoration request raised"),
    ],
    actionQuestion: message(
      "case.actionQuestion",
      "Do you need to do anything?",
    ),
    noAction: message(
      "case.noAction",
      "No action required from you right now.",
    ),
    actionRequired: message(
      "case.actionRequired",
      "An action is recorded for you.",
    ),
    nowTitle: message("case.nowTitle", "What is happening to your money?"),
    nowIntro: message(
      "case.nowIntro",
      "Different portions of your reported amount are currently in different situations.",
    ),
    standingTitle: message(
      "case.standingTitle",
      "Where each amount stands",
    ),
    needToDo: message("case.needToDo", "You need to do"),
    seeDetails: message("case.seeDetails", "View details"),
    whatMeans: message("case.whatMeans", "What does this mean?"),
    reconciliationLabel: message(
      "case.reconciliationLabel",
      "Where your money stands",
    ),
    proposedView: message(
      "case.proposedView",
      "Proposed citizen experience",
    ),
    restorationRequest: message(
      "case.restorationRequest",
      "Money Restoration request",
    ),
    active: message(
      "case.active",
      "Currently recorded in active held/restoration processes",
    ),
    received: message("case.received", "Received under interim custody"),
    exited: message("case.exited", "Cash withdrawal recorded"),
    notHeld: message("case.notHeld", "Not currently secured"),
    total: message("case.total", "Total"),
    signInPrompt: message(
      "case.signInPrompt",
      "Start the synthetic complaint journey to open this case.",
    ),
    signInAction: message("case.signInAction", "Start demo journey"),
  },
  amount: {
    ioTitle: message("amount.ioTitle", "Waiting on the Investigating Officer"),
    ioExplanation: message(
      "amount.ioExplanation",
      "The next recorded police verification step is still pending.",
    ),
    bankTitle: message("amount.bankTitle", "Waiting on the bank"),
    bankExplanation: message(
      "amount.bankExplanation",
      "The bank has received the recorded restoration direction.",
    ),
    exitedTitle: message(
      "amount.exitedTitle",
      "Cash withdrawal recorded",
    ),
    exitedExplanation: message(
      "amount.exitedExplanation",
      "This amount is no longer recorded inside the active bank-restoration process.",
    ),
    notHeldTitle: message("amount.notHeldTitle", "Not currently secured"),
    notHeldExplanation: message(
      "amount.notHeldExplanation",
      "This portion is not currently recorded as held.",
    ),
    receivedTitle: message(
      "amount.receivedTitle",
      "Received under interim custody",
    ),
    receivedExplanation: message(
      "amount.receivedExplanation",
      "This amount has been credited under the recorded interim-custody process.",
    ),
    genericTitle: message(
      "amount.genericTitle",
      "An official step is in progress",
    ),
    genericExplanation: message(
      "amount.genericExplanation",
      "This amount is moving through the recorded restoration process.",
    ),
  },
  detail: {
    whatsHappening: message(
      "citizenDetail.whatsHappening",
      "What is happening?",
    ),
    receivedQuestion: message(
      "citizenDetail.receivedQuestion",
      "What has happened?",
    ),
    actionTitle: message(
      "citizenDetail.actionTitle",
      "Do I need to do anything?",
    ),
    no: message("citizenDetail.no", "No."),
    yes: message("citizenDetail.yes", "Yes."),
    noAction: message(
      "citizenDetail.noAction",
      "No action is currently required from you.",
    ),
    clockTitle: message(
      "citizenDetail.clockTitle",
      "How long does this step have?",
    ),
    noClock: message(
      "citizenDetail.noClock",
      "No procedural time window is recorded for this current step.",
    ),
    nextTitle: message("citizenDetail.nextTitle", "What happens next?"),
    historyTitle: message(
      "citizenDetail.historyTitle",
      "What has happened so far?",
    ),
    amountHistoryTitle: message(
      "citizenDetail.amountHistoryTitle",
      "What happened to this amount?",
    ),
    compactActionTitle: message(
      "citizenDetail.compactActionTitle",
      "Your action",
    ),
    compactNoAction: message(
      "citizenDetail.compactNoAction",
      "Nothing required right now.",
    ),
    compactNoActionShort: message(
      "citizenDetail.compactNoActionShort",
      "Nothing required right now.",
    ),
    compactClockTitle: message(
      "citizenDetail.compactClockTitle",
      "Process window",
    ),
    meaningTitle: message("citizenDetail.meaningTitle", "What does this mean?"),
    exitedMeaning: message(
      "citizenDetail.exitedMeaning",
      "No bank-restoration process is currently recorded for this amount.",
    ),
    notHeldMeaning: message(
      "citizenDetail.notHeldMeaning",
      "No active restoration process or process window is currently recorded for this amount.",
    ),
    officialSummary: message(
      "citizenDetail.officialSummary",
      "View official process details",
    ),
    officialTitle: message(
      "citizenDetail.officialTitle",
      "Official process details",
    ),
    recordedFacts: message(
      "citizenDetail.recordedFacts",
      "Recorded case facts",
    ),
    ioDetail: message(
      "citizenDetail.ioDetail",
      "Before this amount can move forward, the recorded account-holder verification step needs to be completed.",
    ),
    ioNext: message(
      "citizenDetail.ioNext",
      "After verification, the case can move to the next police step and later toward bank action.",
    ),
    bankNext: message(
      "citizenDetail.bankNext",
      "Once the bank completes this step, the amount can be recorded as received under interim custody.",
    ),
    receivedNext: message(
      "citizenDetail.receivedNext",
      "No further financial transfer step is recorded for this amount in the prototype.",
    ),
    genericNext: message(
      "citizenDetail.genericNext",
      "The next update will be shown when the responsible institution records it.",
    ),
    interimStatus: message("citizenDetail.interimStatus", "Interim custody"),
    interimHelp: message(
      "citizenDetail.interimHelp",
      "What does interim custody mean?",
    ),
    interimExplanation: message(
      "citizenDetail.interimExplanation",
      "The synthetic case records an indemnity bond. Further court directions may still apply.",
    ),
  },
  clock: {
    sopWindow: message(
      "citizenClock.sopWindow",
      "The recorded process contains a 7-calendar-day window for this step.",
    ),
    currentCase: message("citizenClock.currentCase", "Synthetic case"),
    beyond: message(
      "citizenClock.beyond",
      "This process step is beyond that recorded window.",
    ),
    bankWindow: message(
      "citizenClock.bankWindow",
      "The recorded bank process requires action within 15 calendar days after receiving the direction.",
    ),
  },
  how: {
    eyebrow: message("how.eyebrow", "How this works"),
    title: message("how.title", "How this works"),
    intro: message(
      "how.intro",
      "This prototype helps a citizen report financial cyber fraud, review the information and understand what happens to the money afterwards.",
    ),
    steps: [
      {
        title: message("how.step1.title", "1. Report"),
        body: message(
          "how.step1.body",
          "Existing NCRP service, with a redesigned citizen interaction: share what happened by speaking, uploading synthetic evidence or typing, then review the structured complaint information.",
        ),
      },
      {
        title: message("how.step2.title", "2. Restoration"),
        body: message(
          "how.step2.body",
          "The separate, existing Money Restoration Module is shown only as a simplified government-stage handoff in this prototype.",
        ),
      },
      {
        title: message("how.step3.title", "3. Resolution"),
        body: message(
          "how.step3.body",
          "The proposed Financial Resolution experience explains where each amount stands, who needs to act and whether the citizen needs to do anything.",
        ),
      },
    ],
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
  INVESTMENT_SCAM: message("fraudType.investmentScam", "Investment fraud"),
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
  RESTORATION_PROCESSING: message(
    "financialState.processing",
    "Held · restoration processing",
  ),
  INTERIM_CUSTODY: message(
    "financialState.interimCustody",
    "Interim custody confirmed",
  ),
  EXITED_FINANCIAL_SYSTEM: message(
    "financialState.exited",
    "Exited the financial system",
  ),
  NOT_CURRENTLY_HELD: message("financialState.notHeld", "Not currently held"),
  MULTI_VICTIM_ATTRIBUTION: message(
    "financialState.attribution",
    "Attribution pending",
  ),
} satisfies Record<FinancialState, Message>;

export const LEGAL_OUTCOME_MESSAGES = {
  RECORDED_PROCESS_ACTIVE: message(
    "legalOutcome.active",
    "Recorded process active",
  ),
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
  COMPLAINT_REGISTERED: message(
    "event.complaintRegistered",
    "Complaint registered",
  ),
  FIR_REGISTERED: message("event.firRegistered", "FIR registered"),
  MONEY_PATH_IDENTIFIED: message(
    "event.moneyPathIdentified",
    "Amount identified in the financial trail",
  ),
  AMOUNT_HELD: message("event.amountHeld", "Amount put on hold"),
  AMOUNT_EXITED_FINANCIAL_SYSTEM: message(
    "event.amountExited",
    "Amount recorded as having exited the financial system",
  ),
  AMOUNT_NOT_CURRENTLY_HELD: message(
    "event.amountNotHeld",
    "Amount recorded as not currently held",
  ),
  MRM_REQUEST_RAISED: message(
    "event.mrmRequestRaised",
    "Money Restoration request raised",
  ),
  REQUEST_ASSIGNED_TO_IO: message(
    "event.requestAssignedToIo",
    "Request received by concerned police",
  ),
  ACCOUNT_HOLDER_NOTICE_REQUIRED: message(
    "event.noticeRequired",
    "Account-holder notice marked as required",
  ),
  ACCOUNT_HOLDER_NOTICE_ISSUED: message(
    "event.noticeIssued",
    "Account-holder notice issued",
  ),
  ACCOUNT_HOLDER_RESPONDED: message(
    "event.accountHolderResponded",
    "Account holder responded",
  ),
  ACCOUNT_HOLDER_NON_RESPONSE_RECORDED: message(
    "event.nonResponse",
    "Account-holder non-response recorded",
  ),
  SP_DCP_APPROVAL_RECORDED: message(
    "event.approval",
    "SP / DCP approval recorded",
  ),
  INDEMNITY_BOND_RECORDED: message("event.bond", "Indemnity bond recorded"),
  BANK_DIRECTION_ISSUED: message(
    "event.bankDirectionIssued",
    "Direction issued to the bank",
  ),
  BANK_DIRECTION_RECEIVED: message(
    "event.bankDirectionReceived",
    "Direction recorded as received by the bank",
  ),
  INTERIM_CUSTODY_CONFIRMED: message(
    "event.interimCustodyConfirmed",
    "Interim custody confirmed",
  ),
  ACCOUNT_HOLDER_CONTESTED: message(
    "event.contested",
    "Account holder contested the action",
  ),
  COURT_ROUTE_RECORDED: message("event.courtRoute", "Court route recorded"),
} satisfies Record<ProcessEventType, Message>;
