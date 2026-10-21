import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail, verifyOtp } from "@/lib/otp";
import { createOtpSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

const verifySchema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/) });
const genericError = { error: "The sign-in code is invalid or expired." };

function requestFingerprint(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json(genericError, { status: 400 }); }
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(genericError, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  const ipHash = requestFingerprint(request);
  try {
    const result = await verifyOtp(email, parsed.data.code);
    await createOtpSession(result.userId);
    await recordAuditEvent({ action: "AUTH_OTP_VERIFIED", resource: "User", resourceId: result.userId, actorId: result.userId, ipHash });
    return NextResponse.json({ message: "Signed in successfully." });
  } catch {
    await recordAuditEvent({ action: "AUTH_OTP_FAILED", resource: "LoginChallenge", ipHash });
    return NextResponse.json(genericError, { status: 401 });
  }
}
