"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Could not create your account."); setLoading(false); return; }
    await signIn("credentials", { email: values.email, password: values.password, callbackUrl: "/dashboard" });
  }
  return <main className="auth-page"><Link href="/" className="brand"><span className="brand-mark">T</span><span>Trinity <em>Classes</em></span></Link><form className="auth-card" onSubmit={submit}><p className="eyebrow">JOIN TRINITY</p><h1>Build your<br /><i>next chapter.</i></h1><label>Full name<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>{error && <p className="error-message">{error}</p>}<button className="button button-coral" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create student account ↗"}</button><p className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></p></form></main>;
}
