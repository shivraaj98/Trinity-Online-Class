# Email OTP Authentication and Authorization Design

## Goal

Make Trinity Classes production-ready for email-based authentication while preserving the existing password and Google login options. Users can request and verify a short-lived email OTP, receive an Auth.js session after successful verification, and access only the resources allowed by their role.

## Scope

### In scope

- Email OTP request and verification APIs.
- OTP persistence using hashed values, expiry, single-use consumption, and attempt limits.
- SMTP delivery using the existing Nodemailer configuration.
- Login UI for password login, Google login, and OTP login.
- Authenticated and role-based authorization helpers for server code and middleware.
- Protection of dashboard, teacher, admin, and support routes.
- Auth audit events and production environment documentation.
- Automated tests for security-sensitive behavior and API contracts.

### Out of scope

- Replacing Auth.js with a custom session implementation.
- SMS or authenticator-app MFA.
- Password reset workflows beyond the existing login options.
- Billing, course permissions, or content moderation redesign.

## Proposed architecture

Auth.js remains the session authority. Credentials and Google providers continue to create sessions through the existing Auth.js configuration. Email OTP uses dedicated request and verification endpoints because the flow needs explicit rate limiting, attempt tracking, and a two-step UI.

The OTP service normalizes the email, generates a cryptographically secure six-digit code, stores only a one-way hash, and sends the plaintext code through SMTP. Verification compares the submitted code against the stored hash, rejects expired or consumed challenges, increments failed-attempt counters, and marks a successful challenge consumed before creating or locating the user.

The database stores one active challenge per normalized email. Creating a new challenge invalidates prior active challenges for that email. A scheduled cleanup is not required for correctness; expired records are deleted opportunistically during request/verification and can also be removed by an operational database job.

## Data model

Add `LoginChallenge`:

- `id`: cuid primary key.
- `email`: normalized email address.
- `codeHash`: bcrypt hash of the OTP.
- `expiresAt`: ten minutes after creation.
- `attempts`: failed verification count.
- `maxAttempts`: fixed server-side limit, initially five.
- `consumedAt`: nullable timestamp for single-use enforcement.
- `createdAt`: creation timestamp.
- `requestedFromHash`: optional privacy-preserving request fingerprint for audit/rate limiting.
- Indexes on `(email, createdAt)` and `(expiresAt)`.

User email remains unique and normalized. No plaintext OTP is stored, logged, returned by APIs, or included in audit metadata.

## API behavior

### `POST /api/auth/request-otp`

Accept `{ email }` after Zod validation. Apply per-email and per-IP throttles before generating a code. Return the same successful response for known and unknown addresses to reduce account enumeration. For an existing inactive user, do not issue a session; the response remains generic.

For an existing user, send the OTP and record `AUTH_OTP_REQUESTED`. For a new address, the verification step may create a student account with a safe default name derived only from the email local part, or the UI may collect a display name before verification if the current registration requirement is retained. The implementation plan must choose one consistent behavior and cover it with tests.

### `POST /api/auth/verify-otp`

Accept `{ email, code }`. Validate the format, retrieve the newest active challenge, reject missing/expired/consumed/exhausted challenges with a generic message, and compare using the stored hash. On success, mark the challenge consumed, create or locate the user, record `AUTH_OTP_VERIFIED`, and establish an Auth.js session. A replayed code must fail.

The endpoint must not expose whether the email exists, whether a code was wrong versus expired, or the remaining attempt count.

## Authorization

Create server-side helpers:

- `requireUser()` returns the authenticated user identity or throws/returns a standard unauthorized response.
- `requireRole(...roles)` verifies the current user role and rejects unauthorized roles.
- `canAccessRolePath(pathname, role)` provides the middleware-safe route decision without database access.

Use these helpers for protected server-rendered pages and API routes. Middleware should redirect unauthenticated browser requests to `/login` and reject or redirect role-incompatible requests for `/admin`, `/teacher`, and support-only paths. API routes must return `401` for missing sessions and `403` for insufficient roles; client redirects are not a substitute for server checks.

Role values remain `STUDENT`, `TEACHER`, `ADMIN`, and `SUPPORT`. Administrative access must never depend on a client-provided role or unverified JWT field. Where a route performs sensitive mutations, fetch the current role from the database or use a short-lived session claim with a documented revalidation strategy.

## UI flow

The login page will offer three choices:

1. Continue with Google.
2. Continue with email OTP: enter email, request code, then enter six-digit code.
3. Continue with password: preserve the current email/password form.

OTP states include idle, sending, code entry, verifying, success, and generic failure. The UI must not reveal account existence. Resend is disabled until the server permits another request. The existing registration page remains available for password-based account creation.

## Production security controls

- Use `crypto.randomInt` for OTP generation.
- Hash OTPs with bcrypt and compare with `compare`.
- Expire challenges after ten minutes and cap attempts at five.
- Invalidate previous challenges on resend and consume successful challenges atomically.
- Add request throttling per email and IP; use a database-backed implementation that works across multiple app instances, or document the required edge rate limit if the existing deployment architecture cannot support it.
- Use generic responses for request and verification failures.
- Never log OTP values or SMTP credentials.
- Require `AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, `EMAIL_SERVER`, and `EMAIL_FROM` in production, with startup validation for missing/unsafe values.
- Set secure session cookies in production and keep the current short session lifetime.
- Audit request, success, failure, password login, Google login, and authorization-denied events without sensitive values.

## Testing and verification

Tests will cover:

- OTP format and secure generation boundary.
- Hash-only persistence and successful comparison.
- Expiry, maximum attempts, single-use replay rejection, and resend invalidation.
- Generic responses for known and unknown emails.
- Rate-limit behavior.
- Authenticated versus unauthenticated API access.
- Role allow/deny decisions for student, teacher, admin, and support routes.
- Login UI request/verify state transitions where the repository test setup supports component tests.

Verification will include the focused auth tests, the full project test command if present, TypeScript checking, Prisma client generation, and a production build.

## Decisions required during implementation

- Whether OTP verification creates a new student account automatically or requires the existing registration form first. The implementation should default to automatic student creation only if it does not weaken the existing registration contract; otherwise it should return a generic verification failure for unknown addresses and keep registration separate.
- The exact cross-instance rate-limit storage strategy based on the available deployment dependencies. No in-memory-only limiter is acceptable for production.
