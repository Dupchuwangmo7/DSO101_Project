# AI Math Education — DevOps Implementation
> DSO101 Final Project | Stack: NestJS + Next.js + PostgreSQL  
> CI/CD: GitHub Actions | Hosting: Render | Security: SonarCloud + Trivy + CodeQL

---

## Architecture

```
Production (Render)
├── aimath-postgres   → PostgreSQL 16 (Render managed DB)
├── aimath-backend    → NestJS API  → https://aimath-backend.onrender.com
└── aimath-frontend   → Next.js UI  → https://aimath-frontend.onrender.com

Local Development (Docker Compose)
├── postgres    :5432
├── backend     :3001
├── frontend    :3000
├── prometheus  :9090
└── grafana     :3100
```

---

## Quick Start — Local Development

### Prerequisites
- Docker Desktop installed and running
- Node.js 20+ (only needed if running without Docker)

### 1. Clone and configure
```bash
git clone https://github.com/your-username/aimath-education.git
cd aimath-education
cp .env.example .env
```

Edit `.env` — minimum required for local dev:
```env
DB_PASSWORD=anypassword
JWT_SECRET=any_long_random_string_at_least_32_chars
COOKIE_SECRET=another_random_string
GRAFANA_PASSWORD=admin
```

### 2. Start everything
```bash
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://localhost:3001 | Backend API |
| http://localhost:9090 | Prometheus |
| http://localhost:3100 | Grafana (admin / your GRAFANA_PASSWORD) |

### 3. Stop
```bash
docker compose down        # stop
docker compose down -v     # stop + delete database volume
```

---

## Deploying to Render

### Step 1 — Create PostgreSQL database
1. Render Dashboard → **New** → **PostgreSQL**
2. Name: `aimath-postgres`, Plan: **Free**
3. After creation, copy the **Internal Database URL**

### Step 2 — Deploy Backend
1. **New** → **Web Service** → connect your GitHub repo
2. Settings:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free
3. Add environment variables (see table below)
4. Click **Create Web Service**

#### Backend Environment Variables (Render dashboard)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DB_HOST` | from Render DB → Internal Host |
| `DB_PORT` | `5432` |
| `DB_USERNAME` | from Render DB → Username |
| `DB_PASSWORD` | from Render DB → Password |
| `DB_DATABASE` | from Render DB → Database |
| `JWT_SECRET` | run `openssl rand -base64 64` |
| `COOKIE_SECRET` | run `openssl rand -base64 32` |
| `FRONTEND_ORIGIN` | `https://aimath-frontend.onrender.com` |
| `TYPEORM_SYNC` | `true` (first deploy), then `false` |
| `ELEVENLABS_API_KEY` | your key (optional) |
| `GOOGLE_AI_API_KEY` | your key (optional) |

> Run `bash devops/scripts/setup-render.sh` to auto-generate JWT_SECRET and COOKIE_SECRET.

### Step 3 — Deploy Frontend
1. **New** → **Web Service** → same repo
2. Settings:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Plan**: Free
3. Environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `NEXT_PUBLIC_BACKEND_URL` | `https://aimath-backend.onrender.com` |

4. Build Arguments (separate from env vars):

| Argument | Value |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://aimath-backend.onrender.com` |

### Step 4 — Get deploy hook URLs
For each service: **Settings** → scroll to **Deploy Hook** → copy the URL.

Add to GitHub Secrets:
- `RENDER_DEPLOY_HOOK_BACKEND`
- `RENDER_DEPLOY_HOOK_FRONTEND`
- `RENDER_FRONTEND_URL` (e.g. `https://aimath-frontend.onrender.com`)

---

## CI/CD Pipeline

Every push to `main` runs:

```
git push
  │
  ├── [parallel]
  │   ├── backend-ci    lint → typecheck → unit tests → e2e → build
  │   └── frontend-ci   lint → typecheck → unit tests → build
  │
  ├── security-scan
  │   ├── SonarCloud SAST
  │   ├── CodeQL
  │   └── npm audit
  │
  ├── docker-build-push  (main only)
  │   ├── Build backend  → push to ghcr.io → Trivy scan
  │   └── Build frontend → push to ghcr.io → Trivy scan
  │
  ├── deploy  (main only)
  │   ├── curl RENDER_DEPLOY_HOOK_BACKEND
  │   └── curl RENDER_DEPLOY_HOOK_FRONTEND
  │
  └── notify → Slack
```

### Required GitHub Secrets

| Secret | How to get it |
|--------|--------------|
| `SONAR_TOKEN` | sonarcloud.io → My Account → Security |
| `CODECOV_TOKEN` | codecov.io → your repo → settings |
| `RENDER_DEPLOY_HOOK_BACKEND` | Render → backend service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render → frontend service → Settings → Deploy Hook |
| `RENDER_FRONTEND_URL` | your frontend's onrender.com URL |
| `NEXT_PUBLIC_BACKEND_URL` | your backend's onrender.com URL |
| `SLACK_WEBHOOK_URL` | api.slack.com → Apps → Incoming Webhooks |

---

## Security Implementation

| Layer | Tool | What it checks |
|-------|------|---------------|
| Code | SonarCloud | Bugs, code smells, security hotspots |
| Code | CodeQL | Vulnerability patterns in TypeScript |
| Dependencies | npm audit | CVEs in package.json packages |
| Container | Trivy | CVEs in Docker base image + packages |
| Runtime | Non-root user | Containers run as UID 1001, not root |
| Runtime | Health checks | Auto-restart on crash |
| Auth | httpOnly cookies | JWT not accessible to JavaScript (XSS safe) |

---

## Docker Optimization

### Multi-stage build (both services)

| Stage | Purpose | In final image? |
|-------|---------|----------------|
| `deps` | `npm ci --omit=dev` | Yes — prod modules only |
| `builder` | Compile TypeScript / Next.js | No — discarded |
| `runner` | Copy dist + prod modules | Yes — this is the image |

### Image size comparison

| Image | Before | After | Reduction |
|-------|--------|-------|-----------|
| Backend | ~900 MB | ~180 MB | 80% |
| Frontend | ~1.4 GB | ~250 MB | 82% |

---

## Monitoring (Local)

Prometheus scrapes the backend and Grafana visualizes it.

Import these Grafana dashboards by ID:
- `1860` — Host metrics (CPU, RAM, disk)
- `9628` — PostgreSQL
- `12708` — Node.js application

Access Grafana at http://localhost:3100 (admin / your GRAFANA_PASSWORD).

---

## Troubleshooting

### Backend won't start locally
```bash
docker compose logs backend --tail=50
# Most common cause: postgres not ready yet
# Fix: docker compose restart backend
```

### "Cannot find module server.js" (frontend)
The `output: 'standalone'` option must be set in `frontend/next.config.ts`.
Check that the file has:
```typescript
const nextConfig: NextConfig = {
  output: "standalone",
};
```

### Render deploy succeeds but app crashes
Check Render logs → most common causes:
1. Missing environment variable (check all required vars are set)
2. DB connection failed (verify DB_HOST is the **Internal** host, not External)
3. `TYPEORM_SYNC=false` on first deploy — set to `true` for the first deploy, then back to `false`

### Render service sleeping (free tier)
Free tier services spin down after 15 minutes of inactivity. First request after idle takes ~30 seconds. For a demo, open the URL 1 minute before presenting.

### Pipeline fails at Trivy scan
```bash
# Run Trivy locally to see what CVEs are found
docker run --rm aquasec/trivy image ghcr.io/yourorg/aimath-backend:latest
# Update the offending package, or add CVE ID to .trivyignore if false positive
```

### SonarCloud quality gate fails
Go to sonarcloud.io → your project → Issues tab.  
Most common: test coverage below threshold → add more unit tests.
