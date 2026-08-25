"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CITIZEN_MESSAGES } from "../../content/en";
import { DEMO_CASE_ACCESS, useDemoCase } from "../demo-case/demo-case-provider";

export function DemoCaseEntry() {
  const router = useRouter();
  const { authenticateDemo } = useDemoCase();
  const [acknowledgementNumber, setAcknowledgementNumber] = useState("");
  const [registeredMobile, setRegisteredMobile] = useState("");
  const [error, setError] = useState("");

  function openDemoCase(acknowledgement: string, mobile: string) {
    if (!authenticateDemo(acknowledgement, mobile)) {
      setError(CITIZEN_MESSAGES.landing.invalid.defaultMessage);
      return;
    }

    setError("");
    router.push("/case");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openDemoCase(acknowledgementNumber, registeredMobile);
  }

  function handleUseDemoCase() {
    setAcknowledgementNumber(DEMO_CASE_ACCESS.acknowledgementNumber);
    setRegisteredMobile(DEMO_CASE_ACCESS.registeredMobile);
    openDemoCase(DEMO_CASE_ACCESS.acknowledgementNumber, DEMO_CASE_ACCESS.registeredMobile);
  }

  return (
    <form className="case-entry-form" aria-label={CITIZEN_MESSAGES.landing.formLabel.defaultMessage} onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="acknowledgement-number">
          {CITIZEN_MESSAGES.landing.acknowledgement.defaultMessage}
        </label>
        <input
          id="acknowledgement-number"
          name="acknowledgementNumber"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={acknowledgementNumber}
          placeholder={DEMO_CASE_ACCESS.acknowledgementNumber}
          onChange={(event) => setAcknowledgementNumber(event.target.value)}
          required
        />
        <p className="form-hint">
          Demo: <span>{DEMO_CASE_ACCESS.acknowledgementNumber}</span>
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="registered-mobile">
          {CITIZEN_MESSAGES.landing.registeredMobile.defaultMessage}
        </label>
        <input
          id="registered-mobile"
          name="registeredMobile"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={registeredMobile}
          placeholder={DEMO_CASE_ACCESS.registeredMobile}
          onChange={(event) => setRegisteredMobile(event.target.value)}
          required
        />
        <p className="form-hint">
          Demo: <span>{DEMO_CASE_ACCESS.registeredMobile}</span>
        </p>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="case-entry-actions">
        <button className="primary-button" type="submit">
          {CITIZEN_MESSAGES.landing.continue.defaultMessage}
        </button>
        <button className="text-button" type="button" onClick={handleUseDemoCase}>
          {CITIZEN_MESSAGES.landing.useDemo.defaultMessage}
        </button>
      </div>

      <p className="form-disclosure">{CITIZEN_MESSAGES.landing.disclosure.defaultMessage}</p>
    </form>
  );
}
