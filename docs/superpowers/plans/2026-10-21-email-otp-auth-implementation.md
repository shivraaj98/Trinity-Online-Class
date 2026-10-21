# Email OTP Authentication and Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-safe email OTP login while retaining password/Google login and enforce server-side role authorization.

**Architecture:** Keep Auth.js as the session authority. Add a focused OTP service backed by a Prisma `LoginChallenge` model and SMTP delivery, expose request/verify endpoints, and use shared server authorization helpers from middleware, pages, and APIs.

**Tech Stack:** Next.js 15 App Router, TypeScript, Auth.js v5, Prisma/PostgreSQL, bcryptjs, Nodemailer, Zod, Node test runner with tsx.

**Spec:** `docs/superpowers/specs/2026-10-21-email-otp-auth-design.md`

## Global Constraints

- OTPs are six digits, expire after 10 minutes, and allow at most five failed attempts.
- Store only one-way OTP hashes; never log or return plaintext OTPs.
- Use generic request and verification responses that do not reveal account existence.
- Invalidate previous active challenges when a new OTP is requested.
- Consume a successful challenge exactly once.
- API authorization returns `401` for missing sessions and `403` for insufficient roles.
- Preserve password and Google login options.
- Do not use an in-memory-only rate limiter for production behavior.

## Review Focus

- Resubmitting a consumed or expired OTP must fail without creating another session; test in Task 2.
- Repeated wrong codes must exhaust the challenge without revealing remaining attempts; test in Task 2.
- Unknown and known emails must receive indistinguishable OTP-request responses; test in Task 3.
- A forged/client-supplied role must not grant protected access; test in Task 4.
- Missing production email/auth secrets must fail clearly at startup/configuration validation; test in Task 5.

### Task 1: OTP persistence and service

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/otp.ts`
- Create: `src/lib/otp.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `requestOtp(email: string, requestFingerprint?: string): Promise<{ accepted: true }>` and `verifyOtp(email: string, code: string): Promise<{ userId: string; isNewUser: boolean }>`.
- Produces `normalizeEmail(email: string): string` and `isValidOtp(code: string): boolean`.

- [ ] **Step 1: Write failing unit tests** for normalization, six-digit format, expiry, wrong-attempt exhaustion, single-use replay rejection, and resend invalidation.
- [ ] **Step 2: Run `npm test -- src/lib/otp.test.ts` and confirm failure** because the OTP service/model does not exist.
- [ ] **Step 3: Add `LoginChallenge`** with hashed code, expiry, attempts, max attempts, consumed timestamp, timestamps, fingerprint, and required indexes; run `npx prisma generate`.
- [ ] **Step 4: Implement OTP generation, bcrypt hashing/comparison, transactional invalidation/consumption, and user lookup/creation** in `src/lib/otp.ts`; use a student default for verified unknown addresses only when the existing user contract permits it.
- [ ] **Step 5: Run the focused tests and confirm they pass**, then run `npx prisma validate`.
- [ ] **Step 6: Commit** with `feat: add secure email otp service`.

### Task 2: Email delivery and request/verify APIs

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/app/api/auth/request-otp/route.ts`
- Create: `src/app/api/auth/verify-otp/route.ts`
- Create: `src/app/api/auth/request-otp/route.test.ts`
- Create: `src/app/api/auth/verify-otp/route.test.ts`
- Modify: `src/lib/auth.ts`

**Interfaces:**
- `sendLoginOtp(email: string, code: string): Promise<void>` sends the configured email without logging the code.
- Request route accepts `{ email }`; verify route accepts `{ email, code }`.

- [ ] **Step 1: Write failing route tests** for validation, generic request response, successful verification, and generic failures for missing/expired/wrong/replayed codes.
- [ ] **Step 2: Run the route tests and confirm expected failures**.
- [ ] **Step 3: Implement SMTP delivery** using `EMAIL_SERVER` and `EMAIL_FROM`, with safe production errors for missing configuration.
- [ ] **Step 4: Implement both routes** with Zod validation, request fingerprinting, database-backed throttling fields, audit events, and generic response messages/statuses.
- [ ] **Step 5: Update Auth.js callbacks/session handling** so OTP-created users and existing users receive the same role-bearing session shape as password/Google users.
- [ ] **Step 6: Run focused route tests and confirm they pass**; inspect output to ensure no OTP value appears.
- [ ] **Step 7: Commit** with `feat: add email otp authentication endpoints`.

### Task 3: Login UI and configuration

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Login UI calls the two OTP endpoints and keeps `signIn("credentials")` and `signIn("google")` intact.

- [ ] **Step 1: Add UI tests or route-level interaction tests** for idle → request → code entry → verify → success/error states.
- [ ] **Step 2: Run the new test and confirm it fails** because the UI has no OTP state flow.
- [ ] **Step 3: Add the OTP form state machine** with email validation, six-digit code input, loading states, resend cooldown from server response, and generic errors.
- [ ] **Step 4: Preserve password and Google actions** and ensure no client role or authorization decision is trusted.
- [ ] **Step 5: Document required production variables and deployment steps** for SMTP, Auth.js, HTTPS, and database migration.
- [ ] **Step 6: Run UI/type checks and confirm the focused tests pass**.
- [ ] **Step 7: Commit** with `feat: add otp login interface and configuration docs`.

### Task 4: Authorization helpers and protected routes

**Files:**
- Create: `src/lib/authorization.ts`
- Create: `src/lib/authorization.test.ts`
- Modify: `src/middleware.ts`
- Modify: protected API/page files identified during implementation review, including `src/app/api/profile/route.ts`, `src/app/api/enrollments/route.ts`, and admin/teacher routes.

**Interfaces:**
- `requireUser(): Promise<SessionUser>`.
- `requireRole(...roles: Role[]): Promise<SessionUser>`.
- `canAccessRolePath(pathname: string, role: Role): boolean`.

- [ ] **Step 1: Write failing authorization tests** for unauthenticated, student, teacher, admin, and support decisions, including forged role input.
- [ ] **Step 2: Run the tests and confirm failure**.
- [ ] **Step 3: Implement helpers** using the server session and current database user role for sensitive operations.
- [ ] **Step 4: Update middleware** to protect authenticated paths and role-specific paths while retaining existing redirects.
- [ ] **Step 5: Apply helpers to protected APIs/pages** and return `401`/`403` consistently.
- [ ] **Step 6: Run focused authorization tests and confirm they pass**.
- [ ] **Step 7: Commit** with `feat: enforce server-side role authorization`.

### Task 5: Production verification

**Files:**
- Modify: `package.json`
- Create or modify: test configuration files only if required by the existing test runner.

- [ ] **Step 1: Add a stable `test` script** that runs all auth tests through the repository’s TypeScript-compatible test runner.
- [ ] **Step 2: Run the full test suite** and fix failures without weakening assertions.
- [ ] **Step 3: Run `npx tsc --noEmit`** and resolve all type errors.
- [ ] **Step 4: Run `npx prisma validate` and `npm run build`**.
- [ ] **Step 5: Verify `git diff`, migration/schema status, and secret redaction**; confirm no OTP or credential values are present in source, logs, or test output.
- [ ] **Step 6: Commit** with `chore: verify production auth readiness`.
