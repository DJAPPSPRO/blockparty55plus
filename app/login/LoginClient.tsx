"use client";

import { FormEvent, useState } from "react";
import styles from "./login.module.css";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, displayName };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data: { error?: string } = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!response.ok) throw new Error(data.error || "The server could not complete that request. Please try again.");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.logo}>55+</div>
        <h1>Block Party 55+</h1>
        <p className={styles.tagline}>Your neighborhood. Your people. Your community.</p>
        <div className={styles.reassurance}>
          <div><strong>Stay connected</strong><span>Neighbors, events, help, and messages in one easy place.</span></div>
          <div><strong>Designed to be simple</strong><span>Large text, clear buttons, and no confusing menus.</span></div>
          <div><strong>Safety first</strong><span>Clear scam warnings and easy reporting.</span></div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.tabs}>
          <button className={mode === "login" ? styles.active : ""} onClick={() => setMode("login")}>Sign In</button>
          <button className={mode === "register" ? styles.active : ""} onClick={() => setMode("register")}>Create Account</button>
        </div>

        <h2>{mode === "login" ? "Welcome back" : "Join your community"}</h2>
        <p className={styles.instructions}>
          {mode === "login" ? "Enter your email and password." : "Just three things to get started."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Your name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Ryan Grau" />
            </label>
          )}
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} type="password" placeholder="At least 8 characters" />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.submit} disabled={busy} type="submit">
            {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className={styles.help}>Need help? Ask a family member or trusted friend to help you sign up.</p>
      </section>
    </main>
  );
}
