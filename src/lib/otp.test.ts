import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidOtp,
  normalizeEmail,
  requestOtp,
  verifyOtp,
  __setOtpStoreForTests,
  __resetOtpStoreForTests,
} from "./otp";

test.afterEach(() => __resetOtpStoreForTests());

test("normalizes email addresses consistently", () => {
  assert.equal(normalizeEmail("  Student@Example.COM "), "student@example.com");
});

test("accepts only six decimal digits as OTPs", () => {
  assert.equal(isValidOtp("123456"), true);
  assert.equal(isValidOtp("12345"), false);
  assert.equal(isValidOtp("1234567"), false);
  assert.equal(isValidOtp("12a456"), false);
});

test("requests create a hashed, expiring challenge without retaining the plaintext code", async () => {
  const challenges: any[] = [];
  __setOtpStoreForTests({
    challenges,
    users: [{ id: "user-1", email: "known@example.com", isActive: true }],
  });

  const result = await requestOtp(" Known@Example.com ", "ip-hash");

  assert.deepEqual(result, { accepted: true });
  assert.equal(challenges.length, 1);
  assert.match(challenges[0].codeHash, /^\$2[aby]\$/);
  assert.equal("code" in challenges[0], false);
  assert.equal(challenges[0].requestedFromHash, "ip-hash");
  assert.ok(challenges[0].expiresAt.getTime() > Date.now());
});

test("rejects an expired challenge", async () => {
  const challenges: any[] = [{
    id: "expired",
    email: "known@example.com",
    codeHash: "not-a-real-code-hash",
    expiresAt: new Date(Date.now() - 1),
    attempts: 0,
    maxAttempts: 5,
    consumedAt: null,
  }];
  __setOtpStoreForTests({ challenges, users: [{ id: "user-1", email: "known@example.com", isActive: true }] });

  await assert.rejects(() => verifyOtp("known@example.com", "123456"), /Invalid or expired OTP/);
});

test("exhausts a challenge after five failed attempts", async () => {
  const challenges: any[] = [{
    id: "limited",
    email: "known@example.com",
    codeHash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCO5jM0xY7L7Vx1hYQX3P3sJ9pN7p5s5Qe",
    expiresAt: new Date(Date.now() + 60_000),
    attempts: 4,
    maxAttempts: 5,
    consumedAt: null,
  }];
  __setOtpStoreForTests({ challenges, users: [{ id: "user-1", email: "known@example.com", isActive: true }] });

  await assert.rejects(() => verifyOtp("known@example.com", "000000"), /Invalid or expired OTP/);
  assert.equal(challenges[0].attempts, 5);
  await assert.rejects(() => verifyOtp("known@example.com", "000000"), /Invalid or expired OTP/);
  assert.equal(challenges[0].attempts, 5);
});

test("consumes a valid challenge and rejects replay", async () => {
  const challenges: any[] = [];
  __setOtpStoreForTests({
    challenges,
    users: [{ id: "user-1", email: "known@example.com", isActive: true }],
  });
  await requestOtp("known@example.com");
  const code = challenges[0].testCode;

  const result = await verifyOtp("known@example.com", code);
  assert.deepEqual(result, { userId: "user-1", isNewUser: false });
  assert.ok(challenges[0].consumedAt instanceof Date);
  await assert.rejects(() => verifyOtp("known@example.com", code), /Invalid or expired OTP/);
});

test("a resend invalidates the previous challenge", async () => {
  const challenges: any[] = [];
  __setOtpStoreForTests({ challenges, users: [{ id: "user-1", email: "known@example.com", isActive: true }] });
  await requestOtp("known@example.com");
  const oldCode = challenges[0].testCode;
  await requestOtp("known@example.com");

  await assert.rejects(() => verifyOtp("known@example.com", oldCode), /Invalid or expired OTP/);
  assert.equal(challenges.filter((challenge) => challenge.consumedAt === null).length, 1);
});
