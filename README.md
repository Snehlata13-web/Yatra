# Yatra

Yatra is a hostel pass-management backend built with Node.js, Express, and Supabase. It includes authentication and role-based API modules for students, wardens, guards, approvals, passes, complaints, food reviews, and helpdesk requests.

## Requirements

- Node.js 22 or newer
- A Supabase project with the schema expected by the backend

## Run the backend locally

```sh
cd server
npm ci
if [ ! -f .env ]; then cp .env.example .env; fi
```

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a strong random `JWT_SECRET` in `server/.env`. Use a non-production Supabase project and test data during development. Then run:

```sh
npm test
npm run dev
```

The API listens on port `3000` by default. `GET /health` checks that the HTTP process is responding; it does not verify Supabase connectivity.

## API

Routes are mounted under `/api/v1`:

- `/auth` — registration and login
- `/users`, `/students`, `/admin` — user, student, and admin operations
- `/passes`, `/approvals`, `/wardens`, `/guards` — pass approvals and gate workflow
- `/complaints`, `/food`, `/helpdesk` — supporting student services

Most endpoints require a bearer token from `/auth/login`. Endpoints also enforce role authorization; see the route files under `server/src/modules/` for exact methods, paths, and role access.

## Environment and security

- Never commit `.env` files, API keys, JWT secrets, New Relic licenses, private keys, logs, or archives containing local configuration.
- `server/.env.example` contains placeholders only. Use `server/.env` locally and a secret manager or restricted server-side environment file for deployments.
- Use a separate Supabase project for development and staging. Do not use real student data in staging.
- Use only the Supabase publishable/anon key in the backend configuration unless the application architecture requires a more privileged key; never expose a service-role key to a browser or commit it.
- Use a long, unique `JWT_SECRET` and keep it consistent across API instances.
- Set `FRONTEND_ORIGIN` to the exact frontend origin. Do not use a permissive wildcard for authenticated browser APIs.
- The temporary EC2 staging deployment is HTTP-only and intended for testing. Do not send sensitive credentials or personal data over it. Configure HTTPS before production use.

## Deployment

Backend Docker Compose and Nginx staging guidance is in [server/README.md](server/README.md). The API container binds to localhost on the EC2 host and should be reached through Nginx; do not expose port `3000` publicly.
