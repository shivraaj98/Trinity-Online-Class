import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasActiveOtpUser, normalizeEmail, requestOtp } from "@/lib/otp";
import { sendLoginOtp } from "@/lib/email";
import { recordAuditEvent } from "@/lib/audit";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email() });
const genericResponse = { message: "If an account exists, a sign-in code has been sent." };

function requestFingerprint(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  const ipHash = requestFingerprint(request);
  try {
    const shouldDeliver = await hasActiveOtpUser(email);
    await requestOtp(email, ipHash, shouldDeliver ? sendLoginOtp : undefined);
    await recordAuditEvent({ action: "AUTH_OTP_REQUESTED", resource: "LoginChallenge", ipHash });
  } catch {
    // Keep delivery/configuration failures indistinguishable from unknown accounts.
  }
  return NextResponse.json(genericResponse, { status: 202 });
}
