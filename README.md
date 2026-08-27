# NCRP 2.0

An independent hackathon prototype for a simpler financial cyber-fraud reporting experience. It is not an official Government of India service and uses synthetic demo data only.

## What we are solving

After reporting a financial cyber fraud, citizens can find it difficult to turn a voice note, screenshots and partial transaction details into a complete, structured complaint.

NCRP 2.0 helps a citizen describe what happened in the way that feels easiest, then prepares the information needed for a report and lets them review it before submission.

## Why we are solving it

Financial cyber fraud is stressful and time-sensitive. A reporting experience should reduce form-filling effort without hiding what will be submitted. The prototype focuses on plain language, mobile readability, and clear review of the information collected.

## Product structure

The primary Phase 1 journey is deliberately small:

1. **Tell us** — speak, upload evidence, or type what happened.
2. **Review** — inspect the prepared incident, transaction, evidence, and profile information.
3. **Submit** — confirm a synthetic complaint.

The repository also retains the separate, event-driven money-restoration domain model for later stages. It is not part of the primary reporting journey.

## App structure

```text
src/
├── app/           Next.js pages and API routes
├── components/    Citizen-facing React components
├── incident/      Complaint schema, extraction normalisation and NCRP mapping
├── domain/        Case, money-path, event and outcome types
├── sop/           Deterministic SOP rules and pure selectors
├── presentation/  Citizen-friendly view models and formatting
├── i18n/          English/Hindi messages and locale provider
├── data/          Synthetic case data
└── tests/         Unit and transition tests
```

## Technologies used

- Next.js and React with TypeScript
- Zod for structured runtime validation
- OpenAI Responses API for evidence-grounded draft extraction
- Sarvam speech-to-text for live voice transcription
- Vitest for automated tests
- Vercel for deployment, analytics and speed insights

## System design

```text
Citizen statement / screenshots
            ↓
Speech transcription + evidence extraction
            ↓
Validated incident draft (Zod)
            ↓
Normalisation + NCRP-compatible complaint mapping
            ↓
Citizen review and synthetic submission
```

The reporting UI does not decide legal routes or mutate process state directly. The retained resolution model uses per-money-path records, ordered `ProcessEvent`s, deterministic SOP selectors, separate financial and legal outcomes, and case-level reconciliation.
