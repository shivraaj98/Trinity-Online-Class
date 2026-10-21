import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "./route";
import { __setOtpStoreForTests, __resetOtpStoreForTests, requestOtp } from "@/lib/otp";
import { __setAuditRecorderForTests, __resetAuditRecorderForTests } from "@/lib/audit";
import { __setOtpSessionForTests, __resetOtpSessionForTests } from "@/lib/auth";

test.beforeEach(() => { __setAuditRecorderForTests(async () => {}); __setOtpSessionForTests(async () => {}); });
test.afterEach(() => { __resetOtpStoreForTests(); __resetAuditRecorderForTests(); __resetOtpSessionForTests(); });

test("rejects an invalid OTP payload generically", async () => {
  const response = await POST(new Request("http://localhost/api/auth/verify-otp", {
    method: "POST", body: JSON.stringify({ email: "student@example.com", code: "bad" }), headers: { "content-type": "application/json" },
  }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "The sign-in code is invalid or expired." });
});

test("verifies an OTP, records the request fingerprint, and creates a session", async () => {
  const challenges: any[] = [];
  __setOtpStoreForTests({ challenges, users: [{ id: "user-1", email: "student@example.com", isActive: true }] });
  await requestOtp("student@example.com");
  const response = await POST(new Request("http://localhost/api/auth/verify-otp", {
    method: "POST", body: JSON.stringify({ email: "student@example.com", code: challenges[0].testCode }), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.11" },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: "Signed in successfully." });
});

test("keeps invalid and replayed codes generic", async () => {
  __setOtpStoreForTests({ challenges: [], users: [] });
  const response = await POST(new Request("http://localhost/api/auth/verify-otp", {
    method: "POST", body: JSON.stringify({ email: "unknown@example.com", code: "123456" }), headers: { "content-type": "application/json" },
  }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "The sign-in code is invalid or expired." });
});
