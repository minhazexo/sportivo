# 🚀 Sportivo - Deployment Guide

> **Project:** Full-stack sports news platform  
> **Stack:** React 19 + TypeScript + Vite (Frontend) · Express.js (Backend) · Neon PostgreSQL (Database) · Prisma (ORM)  
> **Last Updated:** May 2026

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Project Architecture Overview](#3-project-architecture-overview)
4. [Local Development Setup](#4-local-development-setup)
5. [Production Build Process](#5-production-build-process)
6. [Deployment Options](#6-deployment-options)
   - [Option A: VPS (DigitalOcean, Linode, Hetzner)](#option-a-vps-digitalocean-linode-hetzner)
   - [Option B: PaaS (Railway, Render, Fly.io)](#option-b-paas-railway-render-flyio)
   - [Option C: Docker Deployment](#option-c-docker-deployment)
7. [Database Setup with Neon PostgreSQL](#7-database-setup-with-neon-postgresql)
8. [Data Ingestion & Seeding](#8-data-ingestion--seeding)
9. [Admin Setup](#9-admin-setup)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)
11. [Troubleshooting](#11-troubleshooting)
12. [Security Checklist](#12-security-checklist)

---

## 1. Prerequisites

### Required Software
- **Node.js** v18+ (recommended: v20 LTS or v22)
- **npm** v9+ (comes with Node.js)
- **Git**

### Required Accounts
- **Neon PostgreSQL** — Serverless Postgres database ([neon.tech](https://neon.tech)) — Free tier available
- **JWT Secret** — Generate a strong random secret (instructions below)
- **Optional but recommended:**
  - **Gemini API Key** ([aistudio.google.com](https://aistudio.google.com/app/apikey)) — For AI article generation
  - **NewsAPI Key** ([newsapi.org](https://newsapi.org/register)) — For sports news integration
  - **Google Analytics** Measurement ID — For analytics
  - **Google AdSense** Client ID — For ads

### System Requirements
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 512 MB | 1 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 1 GB | 5 GB |
| Node.js | v18 | v20 LTS |

---

## 2. Environment Variables

### Complete Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description | How to Get |
|----------|----------|-------------|------------|
| `DATABASE_URL` | **✅ Yes** | PostgreSQL connection string for Neon | Neon dashboard → Connection Details |
| `JWT_SECRET` | **✅ Yes** | Random secret for signing JWT tokens | `openssl rand -hex 32` |
| `GEMINI_API_KEY` | ❌ Optional | Google Gemini AI API key | [aistudio.google.com](https://aistudio.google.com) |
| `NEWSAPI_API_KEY` | ❌ Optional | NewsAPI.org API key | [newsapi.org](https://newsapi.org/register) |
| `VITE_SITE_URL` | ⚠️ Recommended | Public URL of your site | Your deployment URL (e.g., `https://sportivo.example.com`) |
| `APP_URL` | ⚠️ Recommended | Same as VITE_SITE_URL | Same as above |
| `VITE_GA_MEASUREMENT_ID` | ❌ Optional | Google Analytics | Google Analytics Admin |
| `VITE_ADSENSE_CLIENT` | ❌ Optional | AdSense Publisher ID | Google AdSense |
| `VITE_API_FOOTBALL_KEY` | ❌ Optional | API-Football key | [api-football.com](https://www.api-football.com/) |
| `VITE_SPORTMONKS_TOKEN` | ❌ Optional | SportMonks API token | [sportmonks.com](https://www.sportmonks.com/) |
| `DB_POOL_MAX` | ❌ Optional | Max DB pool connections (default: 10) | Neondb pooler supports up to 25 connections |
| `PORT` | ❌ Optional | Server port (default: 3000) | Override if needed |
| `JWT_EXPIRES_IN` | ❌ Optional | JWT expiry (default: `7d`) | e.g., `24h`, `30d` |
| `NODE_ENV` | **Set automatically** | `production` in prod, `development` in dev | Set by deployment platform |

### Generate a Strong JWT Secret

```bash
# Linux/macOS/Git Bash
openssl rand -hex 32

# Windows (PowerShell)
[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
```

---

## 3. Project Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│              React 19 + TypeScript + Vite                    │
├──────────────────────────────────────────────────────────────┤
│                   Express.js Server (server.ts)              │
│           Vite Dev Middleware (dev) / Static (prod)           │
├──────────────────────────────────────────────────────────────┤
│                     Prisma ORM Layer                         │
├──────────────────────────────────────────────────────────────┤
│                Neon PostgreSQL Database                      │
└──────────────────────────────────────────────────────────────┘
```

**Key Notes:**
- **Single server:** Express serves both the API and the built frontend (no separate frontend/backend deployment needed)
- **In development:** Vite dev middleware runs inside Express for HMR
- **In production:** Vite builds static files → Express serves them from `dist/`
- **Database:** All external sports API data is cached in database tables (no direct external API calls at runtime)

---

## 4. Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url> sportivo
cd sportivo

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# 4. Run database migrations
npx prisma migrate deploy

# 5. Seed sample data (optional)
npm run seed

# 6. Ingest sports data (optional, but recommended)
npx tsx scripts/ingest-data.ts

# 7. Start development server
npm run dev
# Server runs at http://localhost:3000
```

---

## 5. Production Build Process

### Build Command

```bash
npm run build
```

This runs two things:
1. **`vite build`** — Builds the React frontend → outputs to `dist/` (static HTML/JS/CSS)
2. **`esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`** — Bundles the Express server into a single file `dist/server.cjs`

### Start Production Server

```bash
NODE_ENV=production npm run start
# or
NODE_ENV=production node dist/server.cjs
```

### What Happens in Production Mode

In `server.ts`, when `NODE_ENV === "production"`:
```typescript
// Instead of Vite dev middleware:
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
```

The Express server serves the pre-built static files from `dist/` and handles all `/api/*` routes.

### Clean Build Artifacts

```bash
npm run clean
# Removes the dist/ folder
```

---

## 6. Deployment Options

### Option A: VPS (DigitalOcean, Linode, Hetzner)

Best for: **Full control, custom domain, long-running instance**

#### Step-by-Step

1. **Provision a VPS** (Ubuntu 22.04 LTS recommended, 1 GB RAM minimum)

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git nginx
   node --version  # Should be v20.x
   ```

3. **Clone and Prepare Project**
   ```bash
   cd /var/www
   git clone <your-repo-url> sportivo
   cd sportivo
   npm install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env   # Fill in DATABASE_URL, JWT_SECRET, VITE_SITE_URL, etc.
   ```

5. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

6. **Seed & Ingest Data**
   ```bash
   npm run seed
   npx tsx scripts/ingest-data.ts
   ```

7. **Build Production Artifacts**
   ```bash
   npm run build
   ```

8. **Setup PM2 Process Manager** (auto-restart on crash)
   ```bash
   sudo npm install -g pm2
   
   # Start the app
   NODE_ENV=production pm2 start dist/server.cjs --name sportivo
   
   # Save PM2 config
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx Reverse Proxy**
   ```nginx
   # /etc/nginx/sites-available/sportivo
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 60s;
       }
   
       # Increase upload size for file uploads
       client_max_body_size 10M;
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/sportivo /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

10. **Enable HTTPS with Certbot**
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

11. **Cron Job for Auto-Ingestion** (optional)
    ```cron
    # Run data ingestion every hour
    0 * * * * cd /var/www/sportivo && /usr/bin/node /usr/local/bin/npx tsx scripts/ingest-data.ts --quick >> /var/log/sportivo-ingest.log 2>&1
    ```

---

### Option B: PaaS (Railway, Render, Fly.io)

Best for: **Quick setup, auto-deploy from GitHub, managed infrastructure**

#### Railway (Recommended)

1. **Push your repo to GitHub**

2. **Create a new project on Railway**
   - Connect your GitHub repository
   - Select "Deploy from GitHub repo"

3. **Railway will auto-detect the project type**

4. **Add Environment Variables** in Railway dashboard:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `JWT_SECRET` - Generated secret
   - `NODE_ENV` = `production`
   - `VITE_SITE_URL` = `https://your-app.up.railway.app`
   - `APP_URL` = `https://your-app.up.railway.app`
   - Any other optional keys

5. **Configure Start Command:**
   ```
   npm run build && npm run start
   ```

6. **Add a Cron Job** (Railway cron)
   - Schedule: `0 * * * *`
   - Command: `npx tsx scripts/ingest-data.ts --quick`

#### Render

1. **Create a "Web Service"** on Render
2. **Connect GitHub repository**
3. **Settings:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment:** Add all environment variables
4. **Health Check Path:** `/api/health`

#### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy

# Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret"
fly secrets set NODE_ENV=production
fly secrets set VITE_SITE_URL="https://your-app.fly.dev"
```

---

### Option C: Docker Deployment

Best for: **Containerized environments, Kubernetes, consistent environments**

Since this project doesn't have a Dockerfile yet, here's one you can use:

#### Dockerfile

```dockerfile
# ─── Build Stage ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (separate for layer caching)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build production artifacts (frontend + server bundle)
RUN npm run build

# ─── Production Stage ────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --only=production

# Copy build artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]
```

#### .dockerignore

```
node_modules
.git
.env
dist
*.md
.next
coverage
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - VITE_SITE_URL=${VITE_SITE_URL:-http://localhost:3000}
      - APP_URL=${APP_URL:-http://localhost:3000}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID:-}
      - VITE_ADSENSE_CLIENT=${VITE_ADSENSE_CLIENT:-}
    volumes:
      - uploads:/app/public/uploads
    restart: unless-stopped

volumes:
  uploads:
```

#### Build and Run with Docker

```bash
# Build the image
docker build -t sportivo .

# Run with environment file
docker run -p 3000:3000 --env-file .env sportivo

# Or use docker-compose
docker-compose up -d
```

---

## 7. Database Setup with Neon PostgreSQL

### Create a Neon Database

1. **Sign up** at [neon.tech](https://neon.tech) (free tier includes 0.5 GB storage)
2. **Create a project** in the Neon console
3. **Get connection string** from Connection Details:
   - Copy the pooled connection (ends with `-pooler` suffix)
   - Format: `postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

### Run Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# If this is a fresh database with no migrations yet:
npx prisma migrate dev --name init
npx prisma migrate deploy
```

### Verify Database

```bash
npx tsx scripts/check-db.ts
```

Expected output:
```
📊 DATABASE STATUS
─────────────────────
  articles: 0 rows
  users: 0 rows
  cached_matches: 0 rows
  cached_teams: 0 rows
  cached_standings: 0 rows
  cached_news: 0 rows
  cache_metadata: 0 rows
  notifications: 0 rows
  ad_placements: 0 rows
```

### Database Models (for reference)

| Table | Purpose | Populated By |
|-------|---------|-------------|
| `users` | User accounts, roles, preferences | Registration / `make-admin.ts` |
| `articles` | Blog/news articles with markdown content | Admin panel / `seed.ts` |
| `cached_matches` | Sports scores and fixtures | `ingest-data.ts` / Admin ingestion |
| `cached_teams` | Team details and logos | `ingest-data.ts` / Admin ingestion |
| `cached_standings` | League standings tables | `ingest-data.ts` / Admin ingestion |
| `cached_news` | External sports news articles | `ingest-data.ts` / Admin ingestion |
| `cache_metadata` | TTL tracking for cached data | `ingest-data.ts` |
| `notifications` | User notifications | API calls |
| `notification_preferences` | User notification settings | Registration |
| `ad_placements` | Ad configuration | Admin panel (not yet connected to API) |
| `page_hits` | Analytics page view data | API middleware |
| `refresh_tokens` | JWT refresh token storage | Auth flow |
| `password_reset_tokens` | Password reset tokens | Forgot password flow |

---

## 8. Data Ingestion & Seeding

### Seed Sample Articles

```bash
# Seeds 8 sample sports articles into the database
npm run seed
```

### Ingest Live Sports Data

The ingestion script fetches data from **free public sources** (no API keys required for TheSportsDB and RSS feeds):

```bash
# Full ingestion (sports data + news) — may take 2-5 minutes
npx tsx scripts/ingest-data.ts

# Sports data only
npx tsx scripts/ingest-data.ts --sports

# News only
npx tsx scripts/ingest-data.ts --news

# Quick refresh (scores + news)
npx tsx scripts/ingest-data.ts --quick
```

**Data Sources:**
| Source | Data Type | Cost | API Key Required |
|--------|-----------|------|-----------------|
| TheSportsDB | Scores, fixtures, standings, teams | Free | No |
| BBC Sport RSS | Sports news articles | Free | No |
| The Guardian RSS | Sports news articles | Free | No |
| ESPN RSS | Sports news articles | Free | No |
| NewsAPI.org | Additional sports news | Free tier (100 req/day) | Yes (optional) |

### Admin Panel Ingestion

In production, admins can trigger data ingestion from the Settings page (if available) or via the API:

```bash
curl -X POST https://your-domain.com/api/admin/ingest \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

### Scheduled Ingestion (Cron)

To keep data fresh, set up a cron job (see VPS section above) or use the platform's cron feature.

**Recommended schedule:**
- Scores: Every 5 minutes (or every hour if API rate limiting is a concern)
- Fixtures: Every hour
- Standings: Every 6 hours
- Teams: Once daily
- News: Every hour

---

## 9. Admin Setup

### Create an Admin User

1. **Register via the web app** (Sign Up → Create Account)
2. **Promote to admin** using the CLI tool:
   ```bash
   npx tsx scripts/make-admin.ts promote your-email@example.com
   ```
3. **Refresh the app** to see the admin panel link in the navbar

### Using the Admin Panel

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with articles overview |
| `/admin/articles/new` | Create new article |
| `/admin/articles/edit/:id` | Edit existing article |
| `/admin/users` | Manage user roles |
| `/admin/analytics` | Analytics dashboard (mock data) |
| `/admin/settings` | Site configuration (mock data) |

### CLI Admin Tool

```bash
# List all users with their roles (no arguments)
npx tsx scripts/make-admin.ts

# Promote a user to admin (by email or user ID)
npx tsx scripts/make-admin.ts promote user@example.com

# Demote an admin to regular user
npx tsx scripts/make-admin.ts demote user@example.com
```

---

## 10. Monitoring & Maintenance

### Health Check Endpoint

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "database": "neon",
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

Use this for load balancer health checks or monitoring services.

### Logging

The server outputs structured logs with timestamps:
```
[2026-05-17T12:00:00.000Z] 🚀 Server running on http://localhost:3000
[2026-05-17T12:00:00.000Z] 📦 Environment: production
[2026-05-17T12:00:00.000Z] ➡️ GET /api/health
[2026-05-17T12:00:00.000Z] ⬅️ GET /api/health 200 (2ms)
```

### PM2 Monitoring Commands

```bash
# View logs
pm2 logs sportivo

# Monitor CPU/memory
pm2 monit

# Restart
pm2 restart sportivo

# List all processes
pm2 list
```

### Database Backups

Neon PostgreSQL handles automated backups. You can also create manual backups:

```bash
# Using pg_dump (if PostgreSQL client is installed)
pg_dump --no-owner --no-acl "$DATABASE_URL" > sportivo-backup-$(date +%Y%m%d).sql

# Restore
psql "$DATABASE_URL" < sportivo-backup.sql
```

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run new migrations (if any)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart sportivo
```

---

## 11. Troubleshooting

### "Prisma queries may fail" Warning

**Cause:** `DATABASE_URL` is missing or invalid in `.env`

**Fix:**
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Ensure the URL is correct in .env file
# It should start with: postgresql://user:pass@...
```

### "ECONNREFUSED" on Database Connection

**Cause:** Cannot reach Neon database (network issue or wrong URL)

**Fix:**
- Verify the connection string is correct in `.env`
- Check if your IP is allowlisted in Neon (Neon SQL Editor → Settings → IP Allow)
- For pooled connections, ensure you're using the `-pooler` variant
- If you're behind a restrictive firewall, you may need to use `psql` proxy or allowlist the server IP

### "JWT Malformed" or 401 Errors on Login

**Cause:** JWT secret changed or token expired

**Fix:**
1. Clear localStorage in the browser (`localStorage.removeItem('sportivo_auth_token')`)
2. Sign in again
3. If the JWT_SECRET changed, all existing sessions are invalidated — this is expected

### "Vite build" Fails

**Check:**
```bash
# Make sure all dependencies are installed
npm install

# Check TypeScript compilation
npx tsc --noEmit

# Try building just the static frontend first
npm run build:static
```

### Port Already in Use

```bash
# Find the process using port 3000
sudo lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start
```

### "Cannot find module '@prisma/client'"

```bash
# Regenerate Prisma client
npx prisma generate
```

### CORS Errors in Browser

The Express server should set proper CORS headers. If you see CORS errors:

1. Verify `VITE_SITE_URL` is set correctly
2. Check that the frontend is being served from the same origin as the API (they should be — single server architecture)
3. For development with separate ports, the Vite proxy in `vite.config.ts` handles this

### Static Files Not Loading in Production

Ensure the `dist/` directory contains:
```
dist/
├── assets/        # Frontend assets (JS, CSS)
├── index.html     # Main HTML entry
├── server.cjs     # Bundled Express server
└── server.cjs.map # Sourcemap (if enabled)
```

If `index.html` is missing, run `npm run build` again or check for build errors.

---

## 12. Security Checklist

### Pre-Deployment

- [ ] **JWT_SECRET** is set to a strong random value (not the hardcoded fallback)
- [ ] **NODE_ENV=production** is set in production environment
- [ ] **DATABASE_URL** uses the Neon pooled connection string
- [ ] **VITE_SITE_URL** matches the actual domain
- [ ] Application is served over **HTTPS** (via Nginx/Certbot, or platform-managed TLS)

### Critical Security Notes

1. **JWT Secret Hardcoded Fallback** (`server.ts` line ~173):
   ```typescript
   const JWT_SECRET = process.env.JWT_SECRET || "sportivo-neon-postgres-secret-key-987654321";
   ```
   ⚠️ **The hardcoded fallback is INSECURE for production.** Always set `JWT_SECRET` in your environment.

2. **Dev Mode Auth Bypass** (`server.ts` line ~155):
   ```typescript
   if (process.env.NODE_ENV !== 'production' && !token.includes('.')) {
     // Grants admin rights to any direct UID
   }
   ```
   ✅ Automatically disabled in production mode. Safe as long as `NODE_ENV=production` is set.

3. **Password Hashing:** Currently uses SHA-256 with static salt. For higher security, consider replacing with bcrypt (noted in IMPROVEMENTS.md as a P0 item).

4. **Rate Limiting:** Built-in rate limiting is active for all endpoints. Block thresholds are reasonable for production.

5. **CSRF Protection:** Token-based CSRF protection is enabled for all mutating requests.

### Recommended Production Safeguards

- [ ] Set up **fail2ban** to block IPs with repeated failed login attempts
- [ ] Configure **WAF** (Web Application Firewall) if behind Cloudflare
- [ ] Regularly **rotate the JWT_SECRET** (invalidates all sessions)
- [ ] Set up **database backups** (Neon handles this automatically)
- [ ] Monitor **PM2 logs** for unusual error patterns
- [ ] Keep **Node.js and npm packages** updated (`npm audit fix`)

---

## Quick-Start Summary

```bash
# 1. One-Command Deploy (if platform supports build commands)
#    Build command: npm install && npx prisma generate && npm run build
#    Start command: npm run start
#    Env: DATABASE_URL, JWT_SECRET, NODE_ENV=production, VITE_SITE_URL

# 2. Manual Deploy to VPS
git clone <repo> /var/www/sportivo && cd /var/www/sportivo
npm install
cp .env.example .env && nano .env                  # Set DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate deploy                          # Create database tables
npm run build                                       # Build frontend + server
npm run seed                                        # Seed sample articles
npx tsx scripts/ingest-data.ts                      # Ingest sports data
npx tsx scripts/make-admin.ts promote your@email    # Make yourself admin
npm install -g pm2                                  # Process manager
NODE_ENV=production pm2 start dist/server.cjs --name sportivo

# 3. Open in browser: http://your-server-ip:3000
# 4. Sign in with your email/password
# 5. Navigate to /admin to manage content
```

---

## Reference: Key Scripts & Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run build:static` | Build frontend only |
| `npm run start` | Start production server |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | TypeScript type-check |
| `npm run seed` | Seed sample articles |
| `npx prisma migrate deploy` | Apply database migrations |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open database GUI |
| `npx tsx scripts/ingest-data.ts` | Ingest live sports data |
| `npx tsx scripts/make-admin.ts` | Manage admin users |
| `npx tsx scripts/check-db.ts` | Check database status |

---

> **Questions?**  
> - Project documentation: `ARCHITECTURE.md`, `FRONTEND.md`, `ADMIN.md`, `API.md`  
> - Codebuff docs: [codebuff.com/docs](https://codebuff.com/docs)  
> - Check usage: `/usage` command in Codebuff CLI
