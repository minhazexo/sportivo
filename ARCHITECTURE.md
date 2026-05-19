# 🏗️ Sportivo - Architecture Overview

> **Last Updated:** 2025  
> **Stack:** Full-stack sports news platform (Express + React + Neon PostgreSQL)

---

## 1. System Architecture

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

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | Neon PostgreSQL via Prisma | Serverless Postgres with scale-to-zero, branching, connection pooling |
| **Backend** | Express.js | Minimal, well-known framework; runs directly with `tsx` in dev |
| **Frontend** | React 19 + Vite | Modern tooling with HMR, Tailwind CSS v4 |
| **Auth** | JWT + Refresh Tokens | Stateless session management with token rotation |
| **Caching** | Database-first caching | All external sports APIs cached in `cached_*` tables |
| **Build** | Vite (frontend) + esbuild (server) | Fast bundling for both client and server |

---

## 2. Project Structure

```
sportivo/
├── prisma/                      # Database layer
│   ├── schema.prisma            # Data models (10 models)
│   ├── seed.ts                  # Sample articles seeder
│   ├── add-password.ts          # Migration helper: add password column
│   ├── test-user.ts             # Database connection test
│   ├── config/prisma.config.ts  # Prisma config
│   └── migrations/              # SQL migration files
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component (Router + Providers)
│   ├── index.css                # Tailwind CSS v4 + custom theme
│   ├── lib/                     # Shared libraries
│   │   ├── prisma.ts            # Prisma client (pooled connection)
│   │   ├── api.ts               # Re-exports sportsApi
│   │   ├── apiClient.ts         # Fetch wrapper w/ CSRF, auth, retry
│   │   ├── articles.ts          # Server-side article queries
│   │   ├── sportsApi.ts         # Client-side sports API wrapper
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── utils.ts             # cn() utility (clsx + twMerge)
│   ├── context/                 # React contexts
│   │   ├── AuthContext.tsx       # Auth state + modal (email/password)
│   │   ├── NotificationContext.tsx # Notifications + polling
│   │   └── ToastContext.tsx      # Toast notifications
│   ├── components/
│   │   ├── layout/              # Navbar, Footer, NotificationBell
│   │   ├── news/                # ArticleCard, OptimizedImage, Skeleton, SportsNewsCard
│   │   ├── scores/              # ScoreWidget
│   │   ├── ads/                 # AdSense (placeholder)
│   │   ├── analytics/           # Google Analytics (placeholder)
│   │   └── SEO.tsx              # Meta tags + JSON-LD
│   └── pages/                   # Route pages
│       ├── Home.tsx             # Main dashboard
│       ├── ArticleDetail.tsx    # Article reader
│       ├── Fixtures.tsx         # Match schedules
│       ├── Standings.tsx        # League tables
│       ├── Leagues.tsx          # League directory
│       ├── Teams.tsx            # Team directory
│       ├── TeamDetail.tsx       # Single team profile
│       ├── MatchDetail.tsx      # Single match details
│       ├── Search.tsx           # Article search
│       ├── Tags.tsx             # Tag cloud
│       ├── TagArticles.tsx      # Articles by tag
│       ├── Bookmarks.tsx        # User bookmarks
│       ├── NotificationPreferences.tsx # Notification settings
│       └── admin/               # Admin pages
│           ├── AdminDashboard.tsx      # Article CRUD + stats
│           ├── ArticleEditor.tsx       # Markdown editor w/ AI
│           ├── UserManagement.tsx       # User roles
│           ├── AdManagement.tsx        # Ad placements
│           └── AnalyticsDashboard.tsx  # Mock analytics
├── scripts/
│   ├── make-admin.ts            # CLI: promote/demote users
│   └── package.json             # Script-specific deps
├── server.ts                    # Express server (API + Vite middleware)
├── vite.config.ts               # Vite configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript config
```

---

## 3. Data Flow

```
┌──────────────────────┐
│   User Action        │
│   (click, nav, etc)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  React Component     │
│  (state/effect)      │
└──────┬───────────────┘
       │ apiClient.get/post/put/delete
       ▼
┌──────────────────────┐
│  apiClient.ts        │
│  - CSRF token fetch  │
│  - Auth header       │
│  - Retry on 403      │
└──────┬───────────────┘
       │ HTTP Request
       ▼
┌──────────────────────┐
│  Express Server      │
│  - Rate limiting     │
│  - CSRF protection   │
│  - Auth middleware   │
│  - Input validation  │
└──────┬───────────────┘
       │ Prisma Queries
       ▼
┌──────────────────────┐
│  Neon PostgreSQL     │
│  10 tables/models    │
└──────────────────────┘
```

---

## 4. Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | Two-tier: general + strict stores; IP + user-based keys |
| **Request Flooding** | 5-minute block if requests > 2.5x limit |
| **CSRF Protection** | Token-based (32-byte hex, 1-hour expiry, cleaned every minute) |
| **Auth** | JWT (7d expiry) + Refresh Tokens (30d, rotation on use) |
| **Password Hashing** | SHA-256 with static salt (basic - should use bcrypt) |
| **Input Sanitization** | HTML tag removal; slug/ID regex validation |
| **Security Headers** | CSP, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy |
| **Request Size** | Limited to 1MB body |

---

## 5. Caching Strategy

| Data | TTL | Table |
|------|-----|-------|
| Live scores | 5 min | `cached_matches` (type: 'score') |
| Fixtures | 1 hour | `cached_matches` (type: 'fixture') |
| Standings | 6 hours | `cached_standings` |
| Teams/Team detail | 24 hours | `cached_teams` |
| News articles | 1 hour | `cached_news` |

Cache is populated externally (manually or via a data pipeline). The system reads from `cached_*` tables with `CacheMetadata` tracking expiration.

---

## 6. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Registers/Logins                                        │
│    → /api/auth/register or /api/auth/login                      │
│    → Returns { token, refreshToken, user }                      │
├─────────────────────────────────────────────────────────────────┤
│ 2. Frontend stores token in localStorage ('sportivo_auth_token') │
├─────────────────────────────────────────────────────────────────┤
│ 3. Token sent as Bearer header on all API requests              │
├─────────────────────────────────────────────────────────────────┤
│ 4. When token expires, /api/auth/refresh rotates it             │
├─────────────────────────────────────────────────────────────────┤
│ 5. Forgot Password → /api/auth/forgot-password                  │
│    → Generates token → /api/auth/reset-password                 │
└─────────────────────────────────────────────────────────────────┘
```

### Auth Roles

| Role | Permissions |
|------|-------------|
| `user` | Read articles, bookmark, follow teams, manage notifications |
| `editor` | (Defined in DB but not enforced in API yet) |
| `admin` | All above + create/edit/delete articles, manage users, manage ads |

---

## 7. Frontend Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Dashboard: top stories, scores, fixtures, standings, sidebar |
| `/article/:slug` | ArticleDetail | Full article with markdown rendering |
| `/leagues` | Leagues | Browse leagues |
| `/leagues/:id/fixtures` | Fixtures | League-specific fixtures |
| `/leagues/:id/standings` | Standings | League-specific standings |
| `/standings` | Standings | All standings |
| `/teams` | Teams | Team directory by league |
| `/team/:id` | TeamDetail | Team profile, upcoming, results, follow |
| `/match/:id` | MatchDetail | Match info, score, formations |
| `/bookmarks` | Bookmarks | Saved articles (auth required) |
| `/search` | Search | Full-text article search |
| `/tags` | Tags | Tag cloud |
| `/tag/:tag` | TagArticles | Articles filtered by tag |
| `/notifications/preferences` | NotificationPreferences | Toggle notification settings |
| `/admin` | AdminDashboard | Article CRUD, stats |
| `/admin/articles/new` | ArticleEditor | Create article |
| `/admin/articles/edit/:id` | ArticleEditor | Edit article |
| `/admin/users` | UserManagement | Manage users |
| `/admin/ads` | AdManagement | Ad placement management |
| `/admin/analytics` | AnalyticsDashboard | Traffic analytics |

---

## 8. Dependencies

### Production
- **React 19** + React Router DOM v7 + React Markdown
- **Express.js** + JSON Web Token
- **Prisma** + pg + @prisma/adapter-pg
- **Tailwind CSS v4** + @tailwindcss/typography
- **Motion** (Framer Motion fork)
- **Lucide React** icons
- **date-fns**, **clsx**, **tailwind-merge**
- **dotenv**, **@google/genai**, **vite**

### Dev
- **TypeScript**, **esbuild**, **tsx**, **prisma**
- **gh-pages**, **autoprefixer**
