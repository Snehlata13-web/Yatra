# Yatra · Hostel Portal (React + plain CSS)

Secure hostel portal for **Students, Wardens, Gate Guards and Admins** — passes, complaints,
meal reviews and account approvals. Colour palette inspired by
GL Bajaj Institute (glbitm.org).

## Run locally

```bash
# 1. backend (in the server folder)
npm install
npm run dev                 # http://localhost:3000

# 2. frontend (this folder)
npm install
npm run dev                 # http://localhost:5173  (the backend's default CORS origin)
```

## Backend URL — ONE place

`src/config/api.config.js`

```js
BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://yatra-backend-as6l.onrender.com/api/v1',
```

Change that line, **or** create `.env.local` with `VITE_API_BASE_URL=https://<your-api>/api/v1`
(useful on Vercel/Netlify). All routes are listed in `ENDPOINTS` in the same file.

When you deploy, add the frontend URL to the backend env:
`FRONTEND_ORIGIN=https://your-frontend.app` (comma-separate multiple origins).

## Endpoint mapping (frontend → Yatra server)

| Screen / action | Backend route |
|---|---|
| Sign in | `POST /auth/login` → `{ data: { user, token } }` (role read from the JWT) |
| Register | `POST /auth/register` `{ name, email, password, role, phone? }` |
| Restore session / profile | `GET /users/:id` (id from JWT) + `GET /students/me` for students |
| Edit contact | `PUT /users/:id` `{ name, phone }` |
| Edit hostel record | `PUT /students/me` `{ roll_number, room_number, block_number, branch, academic_year }` |
| Student passes | `POST /passes`, `GET /passes` |
| Warden pass queue | `GET /passes`, `PATCH /approvals/:passId` `{ decision }` |
| Guard desk | `GET /guards/pending`, `GET /guards/approved`, `GET /guards/:id`, `PUT /guards/approve/:id`, `PATCH /guards/:id/gate` `{ action: OUT/IN }` |
| Student complaints | `POST /complaints`, `GET /complaints/me`, `PATCH /complaints/:id/confirm`, `PATCH /complaints/:id/reopen` |
| Warden complaints | `GET /complaints`, `PATCH /complaints/:id/status` `{ status: "In Progress" … }` |
| Food reviews | `GET /food/reviews`, `POST /food/reviews`, `PUT /food/reviews/:id` |
| Admin approvals | `GET /admin/users/pending` *(new)*, `PATCH /admin/users/:userId/approval` |

### Backend change

Only one route was missing — a way for the admin to **list pending Warden/Guard accounts**
(`GET /users` returns no role or approval status). Added:

- `GET /api/v1/admin/users/pending` (admin only) → `[{ id, name, email, phone, created_at, role, approval_status }]`
- Files: `src/modules/admins/admin.routes.js`, `admin.controller.js`, `admin.service.js`, `admin.model.js`
  (new functions only; existing code untouched).

## Project structure

```
src/
  config/api.config.js     ← backend URL + all endpoints
  config/app.config.js     roles, role-based navigation, statuses, meals
  api/client.js            fetch wrapper (bearer token, timeout, errors, 401 sign-out)
  api/services.js          one function per backend capability (request bodies in server shape)
  api/normalize.js         maps server responses → UI models
  api/tokenStore.js        token storage (never rendered)
  context/ hooks/ routes/ components/ pages/ styles/
```
