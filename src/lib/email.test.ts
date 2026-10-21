import assert from "node:assert/strict";
import { test } from "node:test";
import { __setEmailTransportForTests, __resetEmailTransportForTests, sendLoginOtp } from "./email";

test.afterEach(() => __resetEmailTransportForTests());

test("sends a login OTP through the configured transport without logging it", async () => {
  const messages: any[] = [];
  __setEmailTransportForTests({ sendMail: async (message: any) => { messages.push(message); } });
  process.env.EMAIL_SERVER = "smtp://user:password@example.test";
  process.env.EMAIL_FROM = "Trinity Classes <no-reply@example.test>";

  await sendLoginOtp("student@example.com", "123456");

  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, "student@example.com");
  assert.match(messages[0].text, /123456/);
});

test("fails clearly when email delivery configuration is missing", async () => {
  delete process.env.EMAIL_SERVER;
  delete process.env.EMAIL_FROM;
  await assert.rejects(() => sendLoginOtp("student@example.com", "123456"), /Email delivery is not configured/);
});
