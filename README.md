# Yatra

Yatra is a hostel pass-management backend built with Node.js, Express, and Supabase. It includes authentication and role-based API modules for students, wardens, guards, approvals, passes, complaints, food reviews, and notices.

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
- `/complaints`, `/food`, `/notices` — supporting student services and warden announcements

### Food reviews

Students submit one review payload per meal using `POST /api/v1/food/reviews` with `meal_type` set to `breakfast`, `lunch`, `snacks`, or `dinner`, plus `review` and optional `review_date` (`YYYY-MM-DD`). Students can read only their own reviews at `GET /api/v1/food/reviews/me` and `GET /api/v1/food/reviews/:id`. Admins and wardens can view all students' reviews at `GET /api/v1/food/reviews` or `GET /api/v1/food/reviews/:id`. Both list endpoints accept optional `date` and `meal_type` filters.

Most endpoints require a bearer token from `/auth/login`. Endpoints also enforce role authorization; see the route files under `server/src/modules/` for exact methods, paths, and role access.

### Student registration

`POST /api/v1/auth/register` with `role: "student"` creates the common user, assigns the student role, and creates the related `students` profile. The request must include the profile columns shown in the Supabase schema:

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "StrongPass123",
  "phone": "+61412345678",
  "role": "student",
  "roll_number": "1234567890123",
  "admission_number": "ADM-2026-001",
  "college_email": "asha@college.edu",
  "branch": "CSE",
  "academic_year": 2,
  "room_number": "101",
  "block_no": "A",
  "batch": "2025-2029",
  "course": "B.Tech"
}
```

Non-student registration uses only the common account fields. If profile creation fails, registration attempts to remove the newly created role assignment and user; database-level uniqueness constraints remain necessary for duplicate protection.

New student registrations remain pending until a warden approves them. An authenticated warden can review `GET /api/v1/wardens/students/pending` and approve or reject with `PATCH /api/v1/wardens/students/:userId/approval` and `{"approval_status":"approved"}` or `{"approval_status":"rejected"}`. Login is blocked until approval.

Warden registration must also include `employee_id`, `phone_number`, and `hostel_block`. The phone number must use the same international format as the account phone. These values are saved in the related `wardens` profile.

Guard registration must include `employee_id` and `gate_number`; these values are saved in the related `guards` profile. Warden and guard accounts remain pending admin approval.

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
