import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "./route";
import { __setOtpStoreForTests, __resetOtpStoreForTests } from "@/lib/otp";
import { __setAuditRecorderForTests, __resetAuditRecorderForTests } from "@/lib/audit";

test.beforeEach(() => __setAuditRecorderForTests(async () => {}));
test.afterEach(() => { __resetOtpStoreForTests(); __resetAuditRecorderForTests(); });

test("rejects an invalid email request", async () => {
  const response = await POST(new Request("http://localhost/api/auth/request-otp", {
    method: "POST", body: JSON.stringify({ email: "not-an-email" }), headers: { "content-type": "application/json" },
  }));
  assert.equal(response.status, 400);
});

test("returns the same generic response for an OTP request", async () => {
  __setOtpStoreForTests({ challenges: [], users: [] });
  const response = await POST(new Request("http://localhost/api/auth/request-otp", {
    method: "POST", body: JSON.stringify({ email: "  Unknown@Example.COM " }), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
  }));
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { message: "If an account exists, a sign-in code has been sent." });
});
