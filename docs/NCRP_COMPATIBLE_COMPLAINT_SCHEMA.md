# NCRP-compatible prototype complaint structure

Schema version: `prototype-2026-08`

## Claim boundary

This project does not have, expose, or claim to implement an official NCRP JSON, XML, API, or backend complaint schema. No public official machine-readable complaint schema was available to the project, and no live government integration exists.

The versioned TypeScript/Zod contract is a prototype mapping structured from:

- current public NCRP portal fields captured during product research;
- the current official public reporting checklist and FAQ; and
- the official NCRP Citizen Manual as supporting/reference documentation.

It is named `NcrpCompatibleComplaintSchema` to make that boundary explicit.

## Supported scope

Phase 1 fully demonstrates one financial-fraud path: **Internet Banking Related Fraud**, using a synthetic KYC-related banking-phishing case. Requirements can vary by NCRP sub-category. The architecture can add sub-category-specific requirements later, but other categories are not claimed as complete in this version.

`IncidentDraft` remains the output of citizen-language and evidence extraction. It is intentionally separate from the final complaint representation. The deterministic mapper combines:

1. `IncidentDraft`;
2. synthetic/test complainant profile data;
3. citizen answers and confirmations;
4. evidence attachment metadata; and
5. declaration state.

The result is an `NcrpCompatibleComplaint`.

## Major groups

### Incident

Category, sub-category, whether money was lost, incident date and time, reporting delay, conditional reason for delay, communication/occurrence channel, and incident description.

### Transactions

One or more transactions containing the bank/payment institution, masked source account or payment ID, transaction ID/UTR, amount, date, approximate time, and an additional reference where available.

### Evidence

Citizen statement, attachment metadata, and facts extracted from each evidence attachment are represented separately. The prototype never treats an extracted fact as if it were an attached file.

### Suspect

Optional suspect name, mobile number, email, URL, UPI ID, bank account, social handle, photograph, and address. Optional unknown suspect information does not block complaint preparation.

### Complainant / victim

Title, name, mobile, gender, date of birth, parent/spouse relationship and name, email, and relationship with the victim.

### Address / jurisdiction

House number, street, colony/locality, city/village/town, tehsil, country, state, district, police station, and PIN code.

### Identity document

Only whether a government-issued national identity document is represented as provided, plus attachment metadata and synthetic provenance. The Phase-1 prototype uses a visibly synthetic local placeholder and does not ask for, extract, reproduce, or store Aadhaar, PAN, passport, or other identity-document numbers.

### Declaration

Citizen review confirmation and declaration acceptance. Submission is disabled until the synthetic-demo declaration is accepted.

## Requiredness and provenance

`NCRP_FIELD_DEFINITIONS` centralizes supported field IDs, groups, user-facing label keys, required/conditional-required state, research source metadata, and prototype support.

Field values carry one or more provenance values:

- `VOICE`
- `EVIDENCE`
- `TYPED`
- `SIMULATED_PROFILE`
- `USER_INPUT`
- `USER_CONFIRMED`
- `SYSTEM_DERIVED`

When evidence modality is ambiguous, citizen-facing UI uses “From what you shared” rather than inventing a more precise source.

Field status is represented as `READY`, `NEEDS_INPUT`, `NOT_PROVIDED_OPTIONAL`, `CITIZEN_DOES_NOT_HAVE`, `NEEDS_CONFIRMATION`, or `CONFIRMED`.

Developer-only source metadata uses `CURRENT_PORTAL_UI`, `OFFICIAL_CHECKLIST`, and `OFFICIAL_CITIZEN_MANUAL_REFERENCE`. Those enum values are not shown to citizens.

## Safety and data handling

All canonical case, profile, account, phone, URL, evidence, identity, and acknowledgement data are synthetic. `.invalid` domains and masked identifiers are used deliberately. The identity document is outside multimodal incident extraction and contains no realistic government identifier.
