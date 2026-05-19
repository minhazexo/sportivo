# 🚀 Sportivo - Free Deployment Guide

> **Deploy your full-stack sports news platform for \$0/month**  
> **Stack:** React 19 + TypeScript + Vite (Frontend) · Express.js (Backend) · **Neon PostgreSQL** (Free) · **Render** (Free hosting)

---

## 🎯 The Free Stack — All \$0/month

| Service | Plan | Cost | What It Does |
|---------|------|------|-------------|
| **[Render](https://render.com)** | Free Web Service | **$0** | Hosts your Node.js Express server + frontend |
| **[Neon](https://neon.tech)** | Free Tier | **$0** | Serverless PostgreSQL database |
| **[GitHub](https://github.com)** | Free Account | **$0** | Stores your code, triggers auto-deploy |
| **Data Sources** | TheSportsDB + RSS Feeds | **$0** | Sports scores, standings, teams, news — no API key needed |
| **[Cloudflare](https://cloudflare.com)** | Free Plan | **$0** | Custom domain, DNS, CDN, SSL (optional) |

**Total: \$0/month** — No credit card required for any of these (except optional custom domain).

---

## 📋 Quick-Start (15 minutes to live)

### Step 1: Push Your Code to GitHub

```bash
# Initialize git (if not already done)
cd E:\Project\sportivo

# Create a new repo on GitHub.com (don't initialize with README)
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/sportivo.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Create Your Free Neon Database (3 minutes)

1. Go to **[neon.tech](https://neon.tech)** and sign up with GitHub (free, no credit card)
2. Click **"Create Project"**
   - Name: `sportivo`
   - Region: Pick the one closest to you (e.g., `Singapore (Southeast Asia)`)
3. Copy the **connection string** from "Connection Details"
   - Use the **Pooled** connection (it ends with `-pooler`)
   - It looks like: `postgresql://neondb_owner:xxx@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

### Step 3: Deploy on Render (10 minutes)

1. Go to **[render.com](https://render.com)** and sign up with GitHub (free, no credit card)
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repo** → Select `YOUR_USERNAME/sportivo`
4. Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `sportivo` |
| **Region** | Choose the closest to your Neon DB region |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start` |
| **Plan** | **Free** |

5. Click **"Advanced"** and add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste your Neon pooled connection string |
| `JWT_SECRET` | Generate one (see below) |
| `NODE_ENV` | `production` |
| `VITE_SITE_URL` | `https://sportivo.onrender.com` |
| `APP_URL` | `https://sportivo.onrender.com` |

6. Click **"Deploy Web Service"** ✅

**Generate a JWT Secret (run this anywhere):**
```bash
# In Git Bash / WSL
openssl rand -hex 32

# Or in PowerShell
[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
```

Render will now build and deploy. First deploy takes **3-5 minutes**. After that, you get a URL like `https://sportivo.onrender.com`.

### Step 4: Run Database Migrations

After the first deploy, you need to run migrations. You can do this via **Render Shell**:

1. In your Render dashboard → Go to your `sportivo` service
2. Click **"Shell"** tab (top of the page)
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

Alternatively, run locally pointing to the production database:
```bash
# Temporarily set your production DATABASE_URL locally
set DATABASE_URL=postgresql://YOUR_NEON_CONNECTION_STRING
npx prisma migrate deploy
```

### Step 5: Seed Data & Ingest Sports Content

In the same **Render Shell**, run:
```bash
# Seed sample articles
npx tsx prisma/seed.ts

# Ingest live sports data (free sources, no API key needed)
npx tsx scripts/ingest-data.ts

# Check everything worked
npx tsx scripts/check-db.ts
```

### Step 6: Create Your Admin Account

1. **Open your app** at `https://sportivo.onrender.com`
2. **Sign up** with your email and password
3. **Promote yourself to admin** in Render Shell:
   ```bash
   npx tsx scripts/make-admin.ts promote your-email@example.com
   ```
4. **Refresh the page** — you'll see the Admin link in the navbar

### 🎉 You're live!

Visit `https://sportivo.onrender.com` to see your sports news platform.

---

## ⚠️ Important: Free Tier Limitations

### Render Free Tier
| Limitation | Detail |
|------------|--------|
| **Sleep after inactivity** | Your app spins down after **15 minutes** of no traffic |
| **Wake-up time** | First request after sleep takes **30-60 seconds** to respond |
| **Uptime** | 750 hours/month (that's 24h/day for 31 days — continuous uptime is fine) |
| **Bandwidth** | 100 GB/month |
| **RAM** | 512 MB |
| **CPU** | Shared |

**How to handle the sleep issue:**
- Install **[UptimeRobot](https://uptimerobot.com)** (free) to ping your site every 5 minutes — keeps it awake
- Or just accept the 30-second delay on first visit (fine for personal/hobby use)

### Neon Free Tier
| Limitation | Detail |
|------------|--------|
| **Storage** | 0.5 GB (plenty for this app — the database is mostly text data) |
| **Compute** | Shared, with automatic scale-to-zero |
| **Connections** | Up to 25 concurrent (via pooled connection) |
| **Branching** | 10 branches |

### Data Ingestion Note
The ingestion script (`scripts/ingest-data.ts`) may take **2-5 minutes** to run on Render's free tier. It will work but might be slow. If it times out in the Shell, run it in smaller chunks:
```bash
# Just sports data
npx tsx scripts/ingest-data.ts --sports
# Just news
npx tsx scripts/ingest-data.ts --news
```

---

## 📝 Alternative Free Hosting Options

### Option B: Fly.io (Free Tier — \$5 credit covers 1-2 small VMs)

```bash
# Install flyctl
# Windows: https://fly.io/install/ or use WSL

# Log in
fly auth login

# Launch the app
fly launch

# Deploy
fly deploy

# Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret"
fly secrets set NODE_ENV=production
fly secrets set VITE_SITE_URL="https://your-app.fly.dev"
```

**Free tier:** \$5/month credit — enough for 1-2 shared VMs running 24/7.

### Option C: Koyeb (Free Tier — Similar to Render)

1. Sign up at [koyeb.com](https://koyeb.com) with GitHub
2. Create a **Web Service** → Connect your GitHub repo
3. Settings same as Render:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm run start`
   - Env vars: Same as Render

---

## 🔐 Required Environment Variables (Minimal)

For the **absolute minimum** free deployment, you only need **3 variables**:

| Variable | Required? | Why |
|----------|-----------|-----|
| `DATABASE_URL` | ✅ **Yes** | Neon PostgreSQL connection |
| `JWT_SECRET` | ✅ **Yes** | Sign authentication tokens |
| `NODE_ENV` | ✅ **Yes** | Must be `production` for security |

**Everything else is optional:**
| Variable | Purpose | Skip if... |
|----------|---------|------------|
| `VITE_SITE_URL` | Sets canonical URLs, sitemap, OG tags | Use Render's URL |
| `APP_URL` | Same as above | Same as above |
| `GEMINI_API_KEY` | AI article generation | AI button returns local text (works fine) |
| `NEWSAPI_API_KEY` | Extra news sources | RSS feeds still work without it |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics | Site works without it |
| `VITE_ADSENSE_CLIENT` | Google AdSense | Site works without it |
| `VITE_API_FOOTBALL_KEY` | Enhanced football data | TheSportsDB still works |
| `VITE_SPORTMONKS_TOKEN` | Cricket data | Cricket section works with limited data |

---

## 🗓️ Keeping Data Fresh (Free Scheduling)

### Option 1: UptimeRobot Webhook (Free)
1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
2. Add a **"Keyword Monitoring"** check for your site
3. Set interval to **5 minutes** — this keeps Render awake

### Option 2: Manual Ingestion via Admin API
```bash
# Trigger data ingestion via the API (from anywhere)
curl -X POST https://sportivo.onrender.com/api/admin/ingest \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```
To get your admin token: Sign in on your site → Open browser console → `localStorage.getItem('sportivo_auth_token')`

### Option 3: GitHub Actions Cron (Free)
Create `.github/workflows/ingest.yml`:
```yaml
name: Daily Data Ingestion
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx tsx scripts/ingest-data.ts --quick
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 🛟 Troubleshooting Free Deployment

### "App keeps sleeping / first load is slow"
**Cause:** Render free tier spins down after 15 minutes idle
**Fix:** 
- Use **UptimeRobot** (free) to ping every 5 minutes
- Or accept the 30-second cold start (fine for hobby projects)

### "npm run build fails with memory error"
**Cause:** Render's 512MB RAM may be tight for the esbuild server bundling
**Fix:**
```bash
# In Render dashboard, change Build Command to run in stages:
npm install && npx prisma generate && npm run build:static
# Then change Start Command to:
node dist/server.cjs
# Note: This skips the esbuild server bundle. The server.ts will run with tsx instead.
```
Or upgrade the start command to:
```json
{
  "scripts": {
    "start": "npx tsx server.ts"
  }
}
```
(This uses `tsx` to run the server directly, skipping the esbuild bundle step entirely.)

### "Cannot connect to database"
**Check:**
1. Your `DATABASE_URL` is the **pooled** connection string (ends with `-pooler`)
2. In Neon dashboard → **Settings → IP Allow** — set to "Allow all" (or your Render region)
3. The connection string is pasted correctly with no extra spaces

### "Prisma client is not generated"
**Fix:** Make sure the build command includes `npx prisma generate`:
```
npm install && npx prisma generate && npm run build
```

---

## 📄 Reference: All Commands

| Command | What It Does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npx prisma generate` | Generate Prisma client for your database |
| `npx prisma migrate deploy` | Create database tables |
| `npm run build` | Build frontend + bundle server |
| `npm run start` | Start production server |
| `npm run seed` | Seed 8 sample articles |
| `npx tsx scripts/ingest-data.ts` | Fetch live sports data (free sources) |
| `npx tsx scripts/make-admin.ts` | Manage user roles |
| `npx tsx scripts/check-db.ts` | Check database status |

---

## ➡️ What to Do Next

1. **Push to GitHub** → Render auto-deploys
2. **Sign up** on your live site → **Promote yourself to admin**
3. **Ingest sports data** via Render Shell
4. **Set up UptimeRobot** to keep it awake
5. **Add a custom domain** (optional) via Cloudflare free plan
