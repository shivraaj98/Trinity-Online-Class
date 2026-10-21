"use client";

import { FormEvent, useState } from "react";

export default function ProfileForm({ name, email, role, joined }: { name: string; email: string; role: string; joined: string }) {
  const [value, setValue] = useState(name); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(""); const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: value }) }); const result = await response.json(); setSaving(false); setMessage(response.ok ? "Profile saved." : result.error ?? "Unable to save profile."); }
  return <form onSubmit={submit}><p className="eyebrow">PROFILE DETAILS</p><label>Full name<input value={value} onChange={(event) => setValue(event.target.value)} minLength={2} maxLength={80} required /></label><label>Email<input value={email} disabled /></label><div className="metric-grid"><div><span>ROLE</span><strong>{role}</strong></div><div><span>MEMBER SINCE</span><strong>{joined}</strong></div></div>{message && <p className="success-message">{message}</p>}<button className="button button-coral" disabled={saving}>{saving ? "Saving…" : "Save profile ↗"}</button></form>;
}
