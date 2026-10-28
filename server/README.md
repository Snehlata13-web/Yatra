# Yatra backend

## Run locally

```sh
if [ ! -f .env ]; then cp .env.example .env; fi
npm ci
npm test
npm start
```

Configure the local `.env` with a non-production Supabase project URL and publishable key, a unique staging/development `JWT_SECRET`, and `FRONTEND_ORIGIN` before testing database-backed routes.

The API listens on `PORT` (default `3000`). `GET /health` returns a basic readiness response without exposing configuration or database details.

Student registration at `POST /api/v1/auth/register` also requires `roll_number`, `admission_number`, `college_email`, `branch`, integer `academic_year`, `room_number`, `block_no`, `batch`, and `course`. These values are validated and saved to the `students` row linked to the new `users.id`.

Student accounts start with `approval_status: pending`; warden approval is required before login. Wardens list requests with `GET /api/v1/wardens/students/pending` and decide using `PATCH /api/v1/wardens/students/:userId/approval` with `{"approval_status":"approved"}` or `{"approval_status":"rejected"}`.

## Warden notices

Apply `supabase/migrations/20261028_create_notices.sql` to create the notices table and the private `warden-notices` Storage bucket. Configure `SUPABASE_SERVICE_ROLE_KEY` only in the backend environment (never in a frontend build or Git); the API uses it to create upload/download signed URLs. The frontend uploads media with Supabase Storage `uploadToSignedUrl(path, token, file)` and then creates a notice referencing the returned path.

- `POST /api/v1/notices/uploads/sign` — warden-only; request `{ "file_name": "poster.png", "content_type": "image/png", "file_size": 1024 }`
- `POST /api/v1/notices` — warden-only; request `{ "title": "Notice title", "body": "Notice text", "media": [{ "path": "<signed-upload-path>", "content_type": "image/png" }] }`
- `GET /api/v1/notices` and `GET /api/v1/notices/:id` — approved student/warden access; media is returned as private signed URLs valid for one hour.

At most five attachments are accepted. Images are limited to 10 MB each; videos to 50 MB each. Supported MIME types are JPEG, PNG, WebP, GIF, MP4, WebM, and QuickTime. This checkout has no React client, so the endpoints are ready for a frontend but no warden notice screen is included here.

Warden registration additionally requires `employee_id`, `phone_number`, and `hostel_block`; these values are validated and saved to the related `wardens` row.

Guard registration additionally requires `employee_id` and `gate_number`; these values are validated and saved to the related `guards` row. Staff accounts stay pending until admin approval.

## EC2 deployment (Docker Compose)

The deployment files run the API in a non-root Node 22 container and bind it only to `127.0.0.1:3000` on the EC2 host. Put Nginx in front of it for public HTTPS access; do not expose port 3000 in the EC2 security group.

### Prepare the EC2 instance

Use a supported Ubuntu LTS EC2 instance, attach an IAM role only if the host needs AWS API access, and install Docker Engine plus the Docker Compose plugin. In the security group, allow:

- SSH (22) only from your current trusted IP, or use AWS Systems Manager Session Manager instead.
- HTTP (80) and HTTPS (443) for public web traffic.
- Do not allow public inbound access to 3000.

### Deploy the backend

Copy the `server/` directory to the instance, excluding local `node_modules`, logs, and any local `.env`. Create the production environment file on the instance with restrictive permissions:

```sh
cd /opt/yatra/server
sudo install -m 600 /dev/null .env
sudoedit .env
```

Set the required values from the deployment's own secret store:

```dotenv
PORT=3000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_ORIGIN=https://your-frontend.example.com
LOG_LEVEL=info
NEW_RELIC_APP_NAME=Yatra Backend
NEW_RELIC_ENABLED=false
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
NEW_RELIC_NATIVE_METRICS_ENABLED=false
```

Set `NEW_RELIC_ENABLED=true` only after confirming the deployed agent/runtime combination works. Never place a service-role key, JWT secret, New Relic license, or `.env` in Git or a frontend environment.

Start and verify:

```sh
sudo docker compose up -d --build
sudo docker compose ps
curl --fail http://127.0.0.1:3000/health
sudo docker compose logs --tail=100 yatra-api
```

### Nginx and HTTPS

Copy `deploy/nginx-yatra-api.conf` to `/etc/nginx/sites-available/yatra-api`, replace `api.example.com` with the API DNS name, enable the site, then validate and reload Nginx:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

Issue and configure a TLS certificate for the API hostname with your chosen certificate manager (for example, Certbot), then verify `https://api.example.com/health`. Keep the security group limited to 80/443 and trusted SSH/SSM access.

### Updates and rollback

Before replacing a running version, retain the previous image tag or deployment directory. Deploy an update with:

```sh
sudo docker compose up -d --build
sudo docker compose ps
curl --fail http://127.0.0.1:3000/health
```

If health verification fails, inspect `docker compose logs` and redeploy the previous image/revision. Database/schema changes are intentionally not included in this deployment.

### Frontend status

There is no `client/` directory in this checkout, so this guide deploys the backend API only. Once the React frontend is present, host its production build behind Nginx (or a static hosting service) and set `FRONTEND_ORIGIN` to its exact HTTPS origin.