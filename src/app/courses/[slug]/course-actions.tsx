"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourseActions({ courseId, enrolled, signedIn }: { courseId: string; enrolled: boolean; signedIn: boolean }) {
  const [status, setStatus] = useState(enrolled ? "You are enrolled in this course." : ""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function enroll() { if (!signedIn) { router.push("/login"); return; } setLoading(true); const response = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) }); const result = await response.json(); setStatus(response.ok ? "Enrollment confirmed. Your course is now in the dashboard." : result.error ?? "Unable to enroll."); setLoading(false); }
  return <div><button className="button button-coral" onClick={enroll} disabled={loading || enrolled}>{loading ? "Enrolling…" : enrolled ? "Enrolled ✓" : "Enroll in this course ↗"}</button>{status && <p className="success-message">{status}</p>}</div>;
}
