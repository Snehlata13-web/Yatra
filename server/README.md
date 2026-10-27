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