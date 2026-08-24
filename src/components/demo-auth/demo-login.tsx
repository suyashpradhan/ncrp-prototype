"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CITIZEN_MESSAGES } from "../../content/en";
import { DEMO_CREDENTIALS, useDemoCase } from "../demo-case/demo-case-provider";

export function DemoLogin() {
  const router = useRouter();
  const { authenticateDemo } = useDemoCase();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function useDemoAccount() {
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authenticateDemo(username, password)) {
      setError(CITIZEN_MESSAGES.login.invalid.defaultMessage);
      return;
    }
    router.push("/case");
  }

  return (
    <section className="login-section section-pad">
      <div className="shell login-layout">
        <div className="login-intro">
          <p className="eyebrow">{CITIZEN_MESSAGES.login.eyebrow.defaultMessage}</p>
          <h1>{CITIZEN_MESSAGES.login.title.defaultMessage}</h1>
          <p className="lede">{CITIZEN_MESSAGES.login.intro.defaultMessage}</p>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="demo-username">{CITIZEN_MESSAGES.login.username.defaultMessage}</label>
            <input
              id="demo-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />

            <label htmlFor="demo-password">{CITIZEN_MESSAGES.login.password.defaultMessage}</label>
            <input
              id="demo-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="form-error" role="alert">{error}</p> : null}

            <button className="secondary-button" type="button" onClick={useDemoAccount}>
              {CITIZEN_MESSAGES.login.useDemo.defaultMessage}
            </button>
            <button className="primary-button" type="submit">
              {CITIZEN_MESSAGES.login.continue.defaultMessage}
            </button>
          </form>

          <div className="demo-credentials" aria-label={CITIZEN_MESSAGES.login.demoCredentials.defaultMessage}>
            <p>{CITIZEN_MESSAGES.login.demoCredentials.defaultMessage}</p>
            <dl>
              <div><dt>{CITIZEN_MESSAGES.login.username.defaultMessage}</dt><dd><code>{DEMO_CREDENTIALS.username}</code></dd></div>
              <div><dt>{CITIZEN_MESSAGES.login.password.defaultMessage}</dt><dd><code>{DEMO_CREDENTIALS.password}</code></dd></div>
            </dl>
          </div>
          <p className="login-note">{CITIZEN_MESSAGES.login.disclosure.defaultMessage}</p>
        </div>
      </div>
    </section>
  );
}
