# Deploying Cloudevy to Fly.io

Three apps + a managed Postgres cluster:

| App | Fly app name | Public? | Notes |
|---|---|---|---|
| Backend API | `cloudevy-backend` | Yes (HTTPS) | Express, port 8002 |
| Frontend | `cloudevy-frontend` | Yes (HTTPS) | nginx SPA, proxies `/api` → backend over private 6PN |
| Scheduler | `cloudevy-scheduler` | No | downtime jobs, internal-only |
| Postgres | (managed) | — | shared by backend + scheduler |

InfluxDB is **not** deployed — the code only has TODOs around it; metrics are in-memory today. Add InfluxDB Cloud when those TODOs get wired up.

App names are globally unique on Fly. If any of `cloudevy-backend`/`cloudevy-frontend`/`cloudevy-scheduler` are taken, edit the `app =` line in each `fly.toml` and adjust the `BACKEND_HOST` in `frontend/fly.toml` to match.

All commands below are run from the **repo root** unless noted otherwise.

---

## 1. Prereqs

```bash
fly auth whoami        # confirm you're logged in
```

Pick a region close to your users. The fly.toml files default to `bom` (Mumbai). To change, edit `primary_region` in each fly.toml — list with `fly platform regions`.

---

## 2. Provision Postgres

Fly's Managed Postgres (recommended — managed backups, HA):

```bash
fly mpg create --name cloudevy-db --region bom --plan basic
```

When it's done, get the connection string:

```bash
fly mpg connect cloudevy-db          # opens psql, or
fly mpg status cloudevy-db           # shows connection details
```

You'll need the `DATABASE_URL` (postgres://...) for the next step. Treat it as a secret.

---

## 3. Backend

Create the app and set secrets:

```bash
cd backend

fly apps create cloudevy-backend --org personal      # or your org

# Generate strong values for these:
#   JWT_SECRET:     openssl rand -hex 32
#   ENCRYPTION_KEY: openssl rand -hex 16   (32 hex chars = 32 bytes)
fly secrets set \
  DATABASE_URL='postgres://...from step 2...' \
  JWT_SECRET='...' \
  ENCRYPTION_KEY='...' \
  -a cloudevy-backend

fly deploy -a cloudevy-backend
```

`NODE_ENV=production` (set in `fly.toml`) already makes the backend default `CORS_ORIGIN` to `https://cloudevy.in`. Override with a secret only if you use a different domain.

`fly deploy` will run `npx prisma migrate deploy` as a release command before the new version goes live (see `[deploy]` in `backend/fly.toml`).

Verify:

```bash
fly status -a cloudevy-backend
curl https://cloudevy-backend.fly.dev/health
```

---

## 4. Frontend

```bash
cd ../frontend

fly apps create cloudevy-frontend --org personal
fly deploy -a cloudevy-frontend
```

No secrets needed — nginx proxies `/api` to `cloudevy-backend.internal:8002` over Fly's private network (configured in `frontend/fly.toml`).

Verify:

```bash
curl https://cloudevy-frontend.fly.dev/                       # SPA
curl https://cloudevy-frontend.fly.dev/api/auth/health 2>&1   # proxied to backend
```

---

## 5. Scheduler

The scheduler's Dockerfile reads from `backend/prisma`, so it must be built from the repo root:

```bash
# from REPO ROOT
fly apps create cloudevy-scheduler --org personal

fly secrets set \
  DATABASE_URL='postgres://...same as backend...' \
  ENCRYPTION_KEY='...same as backend...' \
  -a cloudevy-scheduler

fly deploy \
  --config downtime-scheduler/fly.toml \
  --dockerfile downtime-scheduler/Dockerfile \
  -a cloudevy-scheduler \
  .
```

The trailing `.` sets the build context to the repo root. Verify:

```bash
fly logs -a cloudevy-scheduler
```

---

## 6. Point cloudevy.in at the frontend

Apex domains need a dedicated IPv4 on Fly (the shared v4 only works for subdomains). IPv6 is free.

```bash
# allocate IPs on the frontend app
fly ips allocate-v4 -a cloudevy-frontend            # ~$2/mo for dedicated v4
fly ips allocate-v6 -a cloudevy-frontend            # free
fly ips list -a cloudevy-frontend                   # copy the v4 + v6 values
```

At your DNS provider, set these records on `cloudevy.in`:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | (the dedicated IPv4 from above) |
| `AAAA` | `@` | (the dedicated IPv6 from above) |
| `CNAME` | `www` | `cloudevy.in.` |

Issue Fly-managed certs for both names:

```bash
fly certs create cloudevy.in     -a cloudevy-frontend
fly certs create www.cloudevy.in -a cloudevy-frontend
fly certs show   cloudevy.in     -a cloudevy-frontend   # verify Let's Encrypt
fly certs show   www.cloudevy.in -a cloudevy-frontend
```

Wait until both certs report `Issued` (usually < 1 min after DNS propagates), then open https://cloudevy.in. The SPA now makes same-origin `/api` calls — no extra CORS config needed for either `cloudevy.in` or `www.cloudevy.in`.

---

## Redeploys

```bash
# Backend
fly deploy -a cloudevy-backend                     # from backend/

# Frontend
fly deploy -a cloudevy-frontend                    # from frontend/

# Scheduler (always from repo root)
fly deploy --config downtime-scheduler/fly.toml \
           --dockerfile downtime-scheduler/Dockerfile \
           -a cloudevy-scheduler .
```

## Common ops

```bash
fly logs -a cloudevy-backend                       # tail logs
fly ssh console -a cloudevy-backend                # shell in
fly machines list -a cloudevy-backend
fly scale count 2 -a cloudevy-backend              # horizontal scale
fly secrets list -a cloudevy-backend
```
