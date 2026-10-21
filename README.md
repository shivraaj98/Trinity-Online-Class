# Trinity Classes

Production-oriented online learning platform for students, teachers, admins, and support staff.

## Stack

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Auth.js-compatible credentials authentication
- Zod request validation
- Server-rendered dashboards with dynamic course API

## Local setup

1. Start PostgreSQL with `docker compose up -d postgres`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a strong `AUTH_SECRET`, and either Google OAuth or Gmail SMTP credentials.
3. Install dependencies with `npm install`.
4. Run `npm run db:push`.
5. Run `npm run db:seed` for local demo accounts.
6. Start with `npm run dev`.

Google OAuth must allow `http://localhost:3000/api/auth/callback/google` locally and the deployed callback URL in production. Gmail SMTP should use a Google app password, never a personal account password.

## Docker hosting

Docker is the independent hosting path. It does not depend on ChatGPT access.

```bash
cp .env.example .env
# Edit .env and set AUTH_SECRET, AUTH_URL, and your Google/email settings.
docker compose up -d --build
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

Open `http://localhost:3000`. Manage the service with `docker compose ps`, `docker compose logs -f app`, `docker compose restart app`, and `docker compose down`.

For internet access, run the stack on a VPS or home server with a public DNS record, expose only HTTPS through a reverse proxy such as Caddy or Nginx, and keep PostgreSQL private on the Docker network. Back up the database with `docker compose exec postgres pg_dump -U postgres trinity_classes > backups/trinity-$(date +%F).sql`.

The seed accounts are development-only and must be replaced before deployment.

## Roles

- `STUDENT`: browse, enroll, watch lessons, track progress
- `TEACHER`: create and manage assigned courses and lessons
- `ADMIN`: manage users, courses, content review, audit logs, and platform settings
- `SUPPORT`: operational support access without unrestricted administration

## Production security baseline

The application includes secure response headers, CSP, server-side authorization checks, password hashing, short-lived sessions, database constraints, request validation, audit events, scoped queries, and indexes for common access patterns. Production deployment still requires managed secrets, MFA enforcement for privileged roles, HTTPS, rate limiting at the edge, CSRF/session review, object-storage upload scanning, encrypted backups, monitoring, dependency scanning, and an independent penetration test.

Do not copy Unacademy source code, branding, assets, or proprietary content. This project uses original UI/UX while covering comparable public learning workflows.
