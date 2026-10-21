# Trinity Classes

Production-oriented online learning platform for students, teachers, admins, and support staff.

## Stack

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Auth.js-compatible credentials authentication
- Zod request validation
- Server-rendered dashboards with dynamic course API

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `AUTH_SECRET`.
2. Install dependencies with `npm install`.
3. Run `npm run db:push`.
4. Run `npm run db:seed` for local demo accounts.
5. Start with `npm run dev`.

The seed accounts are development-only and must be replaced before deployment.

## Roles

- `STUDENT`: browse, enroll, watch lessons, track progress
- `TEACHER`: create and manage assigned courses and lessons
- `ADMIN`: manage users, courses, content review, audit logs, and platform settings
- `SUPPORT`: operational support access without unrestricted administration

## Production security baseline

The application includes secure response headers, CSP, server-side authorization checks, password hashing, short-lived sessions, database constraints, request validation, audit events, scoped queries, and indexes for common access patterns. Production deployment still requires managed secrets, MFA enforcement for privileged roles, HTTPS, rate limiting at the edge, CSRF/session review, object-storage upload scanning, encrypted backups, monitoring, dependency scanning, and an independent penetration test.

Do not copy Unacademy source code, branding, assets, or proprietary content. This project uses original UI/UX while covering comparable public learning workflows.
