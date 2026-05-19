# 🏟️ Sportivo News: Collection, Transformation, Storage & Fetching Guide

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Collecting News (Ingestion)](#2-collecting-news-ingestion)
3. [Transforming & Stylizing News Content](#3-transforming--stylizing-news-content)
4. [Storing News in the Database](#4-storing-news-in-the-database)
5. [Fetching & Serving News](#5-fetching--serving-news)
6. [Displaying News in the Frontend](#6-displaying-news-in-the-frontend)
7. [Complete Data Flow Diagram](#7-complete-data-flow-diagram)

---

## 1. Architecture Overview

```
External Sources                    Database                         API Layer                      Frontend
─────────────────                   ────────                         ────────                       ────────
                                                                  
 ┌──────────────┐                   ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
 │  RSS Feeds   │──────┐            │  CachedNews  │◄────reads────│  GET /api/   │◄──fetch()───│  Home.tsx    │
 │ (BBC,Guardian)│     │            │  (ingested   │               │  sports/news │               │  (SportsNews │
 └──────────────┘     │            │   external   │               └──────┬───────┘               │   Card)      │
                      │            │   articles)  │                      │                        └──────────────┘
 ┌──────────────┐     ├───────────►│              │                      │                        ┌──────────────┐
 │  NewsAPI.org │     │            ├──────────────┤                      │                        │  Home.tsx    │
 │  (optional)  │─────┘            │   Article    │◄────reads────┐       │                        │  (ArticleCard)│
 └──────────────┘                  │  (published  │              │       │                        └──────────────┘
                                   │   articles)  │              │       │                        ┌──────────────┐
 ┌──────────────┐                  └──────────────┘              │       │                        │  ArticleDe-  │
 │ TheSportsDB  │──────┐                                        │       │                        │  tail.tsx    │
 │ (match data)  │     │            ┌──────────────┐              │       │                        └──────────────┘
 └──────────────┘     ├───────────►│ CacheMetadata│              │       │
                      │            │ (TTL track)  │              │       │                        ┌──────────────┐
 ┌──────────────┐     │            └──────────────┘              │       │                        │  ArticleEd-  │
 │ Admin Panel  │─────┘                                          │       │                        │  itor.tsx    │
 │ (manual crud)│                                               │       │                        │  (create/edit)│
 └──────────────┘                                               │       │                        └──────────────┘
                                                                ▼       ▼
                                                         ┌──────────────────┐
                                                         │   server.ts      │
                                                         │  (Express API)   │
                                                         └──────────────────┘
```

There are **two separate news pipelines** in Sportivo:

| Pipeline | Source | DB Table | Purpose | Display Component |
|----------|--------|----------|---------|-------------------|
| **External News** | RSS feeds, NewsAPI.org, TheSportsDB | `CachedNews` | Curated sports news from around the web | `SportsNewsCard` (in Home → "Around the Sports World") |
| **Internal Articles** | Admin-published, Match Report Generator | `Article` | Original editorial content | `ArticleCard`, `ArticleDetail` |

---

## 2. Collecting News (Ingestion)

### 2.1 External News Sources

#### A. RSS Feeds (Primary — No API Key Required)

**File:** `scripts/ingest-data.ts`

Three RSS feeds are configured:

```typescript
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'Sports' },
  { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian', category: 'Sports' },
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', category: 'Sports' },
];
```

**To add more RSS feeds**, edit the `RSS_FEEDS` array in both `scripts/ingest-data.ts` AND the inline ingestion in `server.ts` (the admin panel ingestion endpoint at `/api/admin/ingest`).

The RSS parser extracts:
- `title` — article headline
- `link` — original URL (used as unique ID)
- `description` — article summary (HTML stripped)
- `pubDate` — publication date
- `image` — first image from `<enclosure>` or `src=""` in description

#### B. NewsAPI.org (Optional — Requires Free API Key)

**File:** `scripts/ingest-data.ts` (function `ingestNewsApi`)

Set `NEWSAPI_API_KEY` in your `.env` file. The script queries these topics:

```typescript
const NEWS_QUERIES = ['sports', 'football', 'basketball', 'tennis', 'cricket', 'f1', 'nfl', 'nba', 'premier league', 'champions league'];
```

**Note:** Free tier allows 100 requests/day. The script limits to 5 queries per run.

#### C. TheSportsDB Match Reports (Auto-Generated)

**File:** `scripts/ingest-data.ts` (function `generateMatchReports`)

When recent match scores are ingested, the script automatically generates articles like:
> "Manchester United Secure Victory Over Liverpool"

**Key:** Each match report has a slug of `match-report-{matchId}`, so duplicates are prevented.

### 2.2 Running Ingestion

#### CLI Commands

```bash
# Full ingestion (sports + news)
npx tsx scripts/ingest-data.ts

# Sports data only
npx tsx scripts/ingest-data.ts --sports

# News only
npx tsx scripts/ingest-data.ts --news

# Quick refresh (scores + news)
npx tsx scripts/ingest-data.ts --quick
```

#### From Admin Panel

Navigate to Admin Dashboard → click "Ingest Data" button. This hits:
```
POST /api/admin/ingest
```
(Rate-limited: max 3 times per 5 minutes, admin only)

The server triggers a **background ingestion** that runs the same logic as `scripts/ingest-data.ts`.

### 2.3 Manual Article Creation (Admin)

**File:** `src/pages/admin/ArticleEditor.tsx`

Admins can create articles manually via the web UI at `/admin/articles/new`. The form supports:

- **Title** — Headline
- **Content** — Markdown body
- **Slug** — URL-friendly identifier (auto-generated)
- **Category** — Football, Basketball, Tennis, Cricket, Formula 1
- **Status** — Draft or Published
- **Tags** — Comma-separated keywords
- **Thumbnail** — Image URL or file upload (max 5 MB, JPEG/PNG/GIF/WebP/SVG)
- **Excerpt** — Short summary for card previews
- **AI Generate** — Uses Gemini API (or local simulation) to generate content from the title

**API Endpoints used by the editor:**
```
POST   /api/articles          — Create new article
PUT    /api/articles/:id      — Update article
POST   /api/upload            — Upload image file
POST   /api/ai/generate       — AI content generation
```

### 2.4 Cache Metadata (TTL Tracking)

After each ingestion, cache timestamps are updated in `CacheMetadata`:

| Key | TTL | Reason |
|-----|-----|--------|
| `scores:last_ingested` | 5 min | Scores change frequently |
| `fixtures:last_ingested` | 1 hour | Fixtures change less often |
| `standings:last_ingested` | 6 hours | Standings update weekly |
| `teams:last_ingested` | 24 hours | Teams data is static |
| `news:last_ingested` | 1 hour | News updates frequently |

These are stored in the database so multiple server instances can share the same cache state.

---

## 3. Transforming & Stylizing News Content

> ⚠️ **Important:** Never copy-paste external news content verbatim. Always transform it to create unique, original content. Below are the techniques used in Sportivo.

### 3.1 AI-Powered Rewriting

#### Via Gemini API (Production)

**File:** `server.ts` — `POST /api/ai/generate`

```typescript
POST /api/ai/generate
Body: {
  "prompt": "Write an engaging sports article about the Champions League final...",
  "type": "article"
}
```

This connects to Google Gemini to generate original content. The prompt structure ensures unique output every time.

#### Local Simulation (Dev Mode)

When no Gemini API key is configured, the server returns a template response instead. This is fine for development.

### 3.2 Match Report Generator (Template-Based Transformation)

**File:** `scripts/ingest-data.ts` — `generateMatchReports()`

Raw match data → styled article:

```typescript
// Raw data from TheSportsDB:
// { homeTeamName: "Arsenal", awayTeamName: "Chelsea", homeScore: 2, awayScore: 1 }

// Transformed into:
const headlines = {
  'home-win': `Arsenal Secure Victory Over Chelsea`,
  'away-win': `Chelsea Triumph Away at Arsenal`,
  'draw': `Arsenal and Chelsea Battle to a Draw`,
};
```

The content is structured with:
- **Match Summary** section
- **Key Moments** bullet points
- **Full Match Report** narrative
- **Markdown formatting** for rich display

### 3.3 Custom Styling Strategies (Avoiding Copy-Paste)

Sportivo uses several techniques to ensure content looks unique and styled, not like the original source:

#### A. Content Restructuring

When ingesting from external APIs, the content is deliberately **restructured**:

```typescript
// Before (raw RSS): Raw paragraph of text
// After (stored): Structured markdown with headers, lists, emphasis
const articleContent = `
# ${transformedTitle}

## Match Summary

${match.homeTeamName} faced ${match.awayTeamName} in an exciting encounter...

## Key Moments
- **Full Time Score:** ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName}
- **Competition:** ${match.leagueName}
- **Date:** ${match.date}

## Analysis

The match showcased tactical brilliance from both sides...

*This is an automatically generated report based on live match data.*
`;
```

#### B. Template Variables

Use dynamic template variables to create unique content each time:

```typescript
const templates = {
  'home-win': [
    `${homeTeam} Dominate ${awayTeam} in Thrilling Encounter`,
    `${homeTeam} Cruise Past ${awayTeam} to Secure Crucial Win`,
    `${homeTeam} Edge Past ${awayTeam} in Nail-Biting Finish`,
  ],
  // Pick one randomly or cycle through them
};
const randomIndex = Math.floor(Math.random() * templates['home-win'].length);
```

#### C. Markdown Enrichment

Add structure that doesn't exist in the source:
- **Bold** key statistics
- Bullet lists for quick highlights
- Blockquotes for memorable quotes
- Subheadings to break up content
- Horizontal rules between sections

#### D. Excerpt Summarization

Generate a unique excerpt that differs from the source description:

```typescript
// Rather than copying the RSS <description>:
// Use a formula instead:
const excerpt = `Match Report: ${homeTeam} ${score}-${score} ${awayTeam} in the ${league}.`;
```

### 3.4 CSS Styling for Display

The frontend applies unique styling through:

| Component | File | Style Features |
|-----------|------|----------------|
| `SportsNewsCard` | `src/components/news/SportsNewsCard.tsx` | Hover scale effect, source badge, animated entry, gradient fallback |
| `ArticleCard` | `src/components/news/ArticleCard.tsx` | Bookmark button, featured layout, ESPN-style card, category tag |
| `ArticleDetail` | `src/pages/ArticleDetail.tsx` | Markdown rendering, professional typography, share buttons |
| CSS Variables | `src/index.css` | Full theme system (light/dark), CSS custom properties |

---

## 4. Storing News in the Database

### 4.1 Database Schema (Prisma)

**File:** `prisma/schema.prisma`

#### `CachedNews` Table (External News)

```prisma
model CachedNews {
  id          String   @id           // URL is used as the unique ID (deduplication)
  title       String                 // Article headline
  description String?                // Short summary (HTML stripped)
  content     String?                // Full content (if available)
  image       String?                // Thumbnail URL
  url         String                 // Original article URL (used as id)
  source      String                 // Source name (BBC Sport, ESPN, etc.)
  query       String                 // Search query used to find this article
  publishedAt DateTime               // Original publication date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now()) @updatedAt

  @@index([query])                   // Fast lookup by category/query
  @@map("cached_news")
}
```

**Key design decisions:**
- `id` = URL (prevents duplicate articles from the same source)
- `query` field enables per-topic filtering (e.g., "football", "sports")
- `description` is HTML-stripped to store clean text
- `content` is optional (RSS feeds often don't include full content)

#### `Article` Table (Internal Published Articles)

```prisma
model Article {
  id          String    @id @default(uuid())
  title       String
  slug        String    @unique          // URL-friendly identifier
  content     String                     // Markdown content
  excerpt     String?                    // Card preview text
  category    String?                    // Football, Basketball, etc.
  thumbnail   String?                    // Cover image URL
  authorId    String?                    // Reference to User
  authorName  String?
  tags        String[]  @default([])     // PostgreSQL text array
  status      String    @default("draft") // draft | published | archived
  publishedAt DateTime?
  views       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt

  @@map("articles")
}
```

**Key differences from CachedNews:**
- Has rich metadata (`slug`, `status`, `tags`, `views`)
- Uses UUID primary key (not URL)
- Supports publishing workflow (draft → published)
- `content` is always markdown

### 4.2 How Data Gets Stored

#### Ingestion Script (CLI)

```
RSS Feed ──► Parse XML ──► Extract: title, description, image, date ──► prisma.cachedNews.upsert() ──► [CachedNews DB]
NewsAPI  ──► Fetch JSON ──► Extract: title, content, urlToImage    ──► prisma.cachedNews.upsert() ──► [CachedNews DB]
TheSportsDB ─► Fetch Match Data ─► generateMatchReports() ──► prisma.article.create() ──► [Article DB]
Admin Editor ────────────────────────────────────────────────────► prisma.article.create() ──► [Article DB]
```

**Upsert logic** (from `scripts/ingest-data.ts`):

```typescript
// If article with same URL (id) exists → update it
// If it doesn't exist → create it
await prisma.cachedNews.upsert({
  where: { id: link },              // URL as unique key
  update: {                         // Update if exists
    title, description, image, 
    publishedAt, updatedAt: new Date(),
  },
  create: {                         // Create if not exists
    id: link, title, description, image,
    url: link, source, query, 
    publishedAt,
  },
});
```

#### Server Ingestion Endpoint (Admin Panel)

Same logic runs inline in `server.ts` at `/api/admin/ingest`. When the admin clicks "Ingest Data" in the dashboard:

1. Server receives `POST /api/admin/ingest`
2. Returns `{ status: 'started' }` immediately
3. Runs the full ingestion in the background
4. Progress is logged to server console

### 4.3 Database Indexes

For optimal query performance:

```prisma
model CachedNews {
  @@index([query])          // Fast filtering by news topic
  // Pub/sub-style queries: "give me all football news"
}

model CachedMatch {
  @@index([leagueId])       // Filter matches by league
  @@index([type])           // Filter by score vs fixture
  @@index([date])           // Date-range queries
}

model Article {
  slug        String   @unique  // Direct lookup by URL slug
  // Status + date queries are handled by findMany with orderBy
}
```

---

## 5. Fetching & Serving News

### 5.1 Server-Side API Endpoints

#### External News Endpoint

**Route:** `GET /api/sports/news`

**File:** `server.ts`

```typescript
app.get("/api/sports/news", async (req, res) => {
  const q = req.query.q || 'sports';         // Search query
  const limit = req.query.limit || '10';      // Number of articles
  
  const newsArticles = await prisma.cachedNews.findMany({
    where: { query: q.toLowerCase() },
    orderBy: { publishedAt: 'desc' },
    take: parseInt(limit),
  });

  res.json({
    status: 'ok',
    totalArticles: newsArticles.length,
    articles: newsArticles.map(n => ({
      id: n.id, title: n.title, description: n.description,
      image: n.image, url: n.url, source: n.source,
      publishedAt: n.publishedAt,
    })),
  });
});
```

**Query examples:**
```
GET /api/sports/news?q=football&limit=12
GET /api/sports/news?q=basketball&limit=5
GET /api/sports/news?q=sports&limit=20
```

#### Internal Articles Endpoints

| Route | Method | Description | Auth |
|-------|--------|-------------|------|
| `/api/articles` | GET | List all articles (optional `?status=published`) | Public |
| `/api/articles/:slug` | GET | Get article by slug (increments view count) | Public |
| `/api/articles/id/:id` | GET | Get article by UUID | Public |
| `/api/articles` | POST | Create new article | Admin |
| `/api/articles/:id` | PUT | Update article | Admin |
| `/api/articles/:id` | DELETE | Delete article | Admin |

**File:** `src/lib/articles.ts` (server-side data access)

```typescript
// Server-side helper to fetch articles
export async function getArticles(status?: string): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  // Maps Prisma model to API-friendly shape
}
```

### 5.2 Rate Limiting

All news/sports endpoints are rate-limited in `server.ts`:

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| `/api/sports/news` | 15 min | 200 |
| `/api/sports/scores` | 15 min | 200 |
| `/api/sports/standings` | 15 min | 200 |
| `/api/articles` (read) | 15 min | No limit (applied to mutating ops) |

### 5.3 Client-Side API Client

**File:** `src/lib/apiClient.ts`

The frontend uses a centralized API client that:

1. **Auto-routes** requests to the correct path:
   ```typescript
   // Sports endpoints get /api/sports prefix
   get('/news', { q: 'football' })  →  GET /api/sports/news?q=football
   
   // Article endpoints get /api prefix
   get('/articles')                  →  GET /api/articles
   get('/articles/some-slug')        →  GET /api/articles/some-slug
   ```

2. **Injects auth tokens** from localStorage
3. **Handles CSRF tokens** for mutating requests
4. **Retries on failure** (configurable)
5. **Aborts on timeout** (default 15 seconds)

**File:** `src/lib/sportsApi.ts` (typed wrapper)

```typescript
// Typed client-side API wrappers
export async function getSportsNews(query = 'sports', limit = 10): Promise<NewsResponse> {
  return apiClient.get('/news', { q: query, limit });
}
```

### 5.4 Caching Strategy

```
Request Flow:
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐
│ Client │────►│  server  │────►│   Prisma      │────►│PostgreSQL │
│        │     │  .ts     │     │  (adapter)    │     │  (Neon)   │
└────────┘     └──────────┘     └──────────────┘     └───────────┘
```

The database itself acts as the cache. Data is pre-populated by the ingestion script and served directly from PostgreSQL. There is **no Redis or in-memory cache** — all reads go to Neon Postgres.

**To add a Redis cache layer in the future:**
```typescript
// server.ts — mockup
import { createClient } from 'redis';
const redis = createClient();

app.get("/api/sports/news", async (req, res) => {
  const cacheKey = `news:${query}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  const news = await prisma.cachedNews.findMany({...});
  await redis.setEx(cacheKey, 3600, JSON.stringify(news));
  res.json(news);
});
```

---

## 6. Displaying News in the Frontend

### 6.1 Component Hierarchy

```
App.tsx
 └── Home.tsx
      ├── ScoreTicker (live matches)
      ├── HeroSection (featured articles)
      ├── FeaturedContent
      │    ├── ArticleCard[] (internal articles)
      │    └── SportsNewsCard[] (external news)
      ├── ResultsFixtures
      └── SidebarStandings
```

### 6.2 External News Display (SportsNewsCard)

**File:** `src/components/news/SportsNewsCard.tsx`

```tsx
interface SportsNewsCardProps {
  article: {
    title: string;        // Transformed title
    description: string;  // Transformed/summarized description
    image: string;        // Image URL
    url: string;          // Link to original article
    source: string;       // Source badge
    publishedAt: string;  // Publication date
  };
}
```

**Styling applied:**
- `hover:border-accent` — red border on hover
- `hover:shadow-lg` — elevated shadow on hover
- `group-hover:scale-105` — image zoom on hover
- `motion` — staggered fade-in animation
- Source badge in accent color
- Fallback SVG when image is missing

### 6.3 Internal Articles Display (ArticleCard)

**File:** `src/components/news/ArticleCard.tsx`

Two layouts:
- **`featured={true}`** — Side-by-side image + text for hero articles
- **`featured={false}`** — Standard card with image on top

Both include:
- Bookmark toggle (authenticated users)
- Category tag badge
- Author name, view count, relative time
- Hover effects (color change, shadow)

### 6.4 Article Detail Page

**File:** `src/pages/ArticleDetail.tsx`

Renders the full article with:
- `ReactMarkdown` for content rendering
- Share buttons (placeholder)
- Comments section (placeholder — needs implementation)
- Ad placements before comments
- Tag-based navigation (links to `/tag/:tag`)

### 6.5 How Home.tsx Fetches External News

```typescript
// In Home.tsx:
useEffect(() => {
  async function fetchSportsNews() {
    const data = await getSportsNews('football soccer sports', 12);
    if (data.articles && data.articles.length > 0) {
      setSportsNews(data.articles);
    }
  }
  fetchSportsNews();
}, []);
```

This fetches 12 news articles from the database and displays them in the "Around the Sports World" section — sorted by `publishedAt` descending (most recent first).

---

## 7. Complete Data Flow Diagram

```
                      ┌─────────────────────────────────────────────────────────┐
                      │                  DATA FLOW OVERVIEW                      │
                      └─────────────────────────────────────────────────────────┘

COLLECT ──────────────────────────────────────────────────────────────────────────
                                                                                  
  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────────┐   
  │  RSS Feeds   │───►│ fetchText + XML  │───►│  Extract: title, link, desc, │   
  │ (BBC/Guardian)│    │    parser        │    │  image, pubDate              │   
  └──────────────┘    └──────────────────┘    └───────────┬──────────────────┘   
                                                          │                      
  ┌──────────────┐    ┌──────────────────┐    ┌───────────┴──────────────────┐   
  │  NewsAPI.org │───►│ fetchJson +      │───►│  Extract: title, desc,      │   
  │ (optional)   │    │ rate limit       │    │  content, urlToImage, source │   
  └──────────────┘    └──────────────────┘    └───────────┬──────────────────┘   
                                                          │                      
  ┌──────────────┐    ┌──────────────────┐    ┌───────────┴──────────────────┐   
  │ TheSportsDB  │───►│ fetchJson +      │───►│  Match data → Generate      │   
  │ (match data) │    │ round-by-round   │    │  headlines + content         │   
  └──────────────┘    └──────────────────┘    └───────────┬──────────────────┘   
                                                          │                      
  ┌──────────────┐                                        │                      
  │ Admin Editor │────────────────────────────────────────┤                      
  │ (manual)     │                                        │                      
  └──────────────┘                                        │                      
                                                          ▼                      
                                                          │                      
TRANSFORM ────────────────────────────────────────────────│──────────────────────
                                                          │                      
                                                          ▼                      
  ┌──────────────────────────────────────────────────────────────────────────┐   
  │                        TRANSFORMATION LAYER                               │   
  │                                                                           │   
  │  1. HTML strip <description> → clean text                                 │   
  │  2. Generate headlines from match data (template-based)                   │   
  │  3. Build markdown content with sections, bullet points, bold text        │   
  │  4. Generate excerpt summarization                                        │   
  │  5. Optionally rewrite using Gemini AI (POST /api/ai/generate)            │   
  └────────────────────────────────────────────────┬─────────────────────────┘   
                                                   │                            
                                                   ▼                            
STORE ─────────────────────────────────────────────│────────────────────────────
                                                   │                            
                                                   ▼                            
  ┌──────────────────────────────────────────────────────────────────────────┐   
  │                    STORAGE LAYER (Prisma + Neon Postgres)                 │   
  │                                                                           │   
  │  ┌─────────────────────────────┐    ┌────────────────────────────────┐   │   
  │  │        CachedNews           │    │           Article              │   │   
  │  │─────────────────────────────│    │────────────────────────────────│   │   
  │  │ id: string (URL as PK)     │    │ id: uuid()                     │   │   
  │  │ title: string              │    │ title: string                  │   │   
  │  │ description: string?       │    │ slug: string (unique)          │   │   
  │  │ content: string?           │    │ content: string (markdown)     │   │   
  │  │ image: string?             │    │ excerpt: string?               │   │   
  │  │ url: string                │    │ category: string?              │   │   
  │  │ source: string             │    │ tags: string[]                 │   │   
  │  │ query: string              │    │ status: "draft"|"published"    │   │   
  │  │ publishedAt: DateTime      │    │ authorName: string?            │   │   
  │  │                            │    │ views: int                     │   │   
  │  └─────────────────────────────┘    └────────────────────────────────┘   │   
  │                                                                           │   
  │  ┌─────────────────────────────┐    ┌────────────────────────────────┐   │   
  │  │      CacheMetadata          │    │        CachedStanding          │   │   
  │  │─────────────────────────────│    │────────────────────────────────│   │   
  │  │ key: string (PK)           │    │ leagueId + teamId (unique)     │   │   
  │  │ expiresAt: DateTime        │    │ rank, points, GD, etc.         │   │   
  │  └─────────────────────────────┘    └────────────────────────────────┘   │   
  └──────────────────────────────────────────────────────────────────────────┘   
                                                   ▲                            
                                                   │                            
FETCH ─────────────────────────────────────────────│────────────────────────────
                                                   │                            
                                                   ▼                            
  ┌──────────────────────────────────────────────────────────────────────────┐   
  │                      API LAYER (server.ts)                                │   
  │                                                                           │   
  │  GET /api/sports/news?q={query}&limit={n}   →  CachedNews table          │   
  │  GET /api/articles?status=published          →  Article table             │   
  │  GET /api/articles/:slug                     →  Article (by slug)         │   
  │  POST /api/admin/ingest                      →  Trigger background ingest │   
  │  GET /api/sports/standings?league={id}       →  CachedStanding table      │   
  │  POST /api/ai/generate                       →  Gemini/local simulation   │   
  │                                                                           │   
  │  Rate limiting ● Auth checks ● CSRF protection ● Input sanitization      │   
  └────────────────────────────────────────────────┬─────────────────────────┘   
                                                   │                            
                                                   ▼                            
DISPLAY ───────────────────────────────────────────│────────────────────────────
                                                   │                            
                                                   ▼                            
  ┌──────────────────────────────────────────────────────────────────────────┐   
  │                   FRONTEND LAYER (React + TypeScript)                     │   
  │                                                                           │   
  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐  │   
  │  │  SportsNews- │   │  ArticleCard  │   │ ArticleDe-   │   │ Search.tsx│  │   
  │  │  Card.tsx    │   │  (Home,       │   │ tail.tsx     │   │ (search  │  │   
  │  │  (Home —     │   │  Search,      │   │ (full article│   │  results)│  │   
  │  │  external    │   │  Tags)        │   │  page)       │   │          │  │   
  │  │  news)       │   │               │   │              │   │          │  │   
  │  └──────────────┘   └──────────────┘   └──────────────┘   └──────────┘  │   
  │                                                                           │   
  │  All components use: apiClient.ts → sportsApi.ts for data fetching       │   
  │  All components use: CSS variables from index.css for theming             │   
  │  All components use: motion (framer-motion) for animations                │   
  └──────────────────────────────────────────────────────────────────────────┘   
```

---

## Quick Reference Card

| Action | File(s) | Key Function/Endpoint |
|--------|---------|----------------------|
| **Run ingestion** | `scripts/ingest-data.ts` | `npx tsx scripts/ingest-data.ts` |
| **Trigger from admin** | `server.ts` | `POST /api/admin/ingest` |
| **Add RSS feed** | `scripts/ingest-data.ts` + `server.ts` | Edit `RSS_FEEDS` array |
| **Add NewsAPI query** | `scripts/ingest-data.ts` | Edit `NEWS_QUERIES` array |
| **Add league** | `scripts/ingest-data.ts` + `server.ts` | Edit `LEAGUES` object |
| **Fetch external news** | `src/lib/sportsApi.ts` | `getSportsNews(query, limit)` |
| **Fetch internal articles** | `src/lib/articles.ts` | `getArticles(status)` |
| **Create article manually** | `src/pages/admin/ArticleEditor.tsx` | Admin UI at `/admin/articles/new` |
| **Change news styling** | `src/components/news/SportsNewsCard.tsx` | Edit the card component |
| **Change article styling** | `src/components/news/ArticleCard.tsx` | Edit the card component |
| **Add theme CSS variables** | `src/index.css` | Add to `:root` and `.dark` |
| **Modify news schema** | `prisma/schema.prisma` | Edit `CachedNews` or `Article` model |
| **Change API response shape** | `server.ts` | Edit `mapDbNewsToApi()` or `mapDbMatchToApi()` |

---

## Best Practices

1. **Always transform, never copy-paste** — Use templates, AI rewriting, or structural changes to make every article unique
2. **Use upsert for idempotency** — Always use `prisma.xxx.upsert()` with a stable unique key (URL for external news)
3. **Respect rate limits** — External APIs (NewsAPI, TheSportsDB) have free tier limits. Space out ingestion runs
4. **Cache metadata is your friend** — Check `CacheMetadata` before re-ingesting to avoid redundant API calls
5. **Sanitize all inputs** — Use `sanitizeString()` to strip HTML from external content before storing
6. **Run ingestion on schedule** — Set up a cron job to run `scripts/ingest-data.ts` every hour:
   ```bash
   # crontab example (runs every hour)
   0 * * * * cd /path/to/sportivo && npx tsx scripts/ingest-data.ts --quick >> /var/log/sportivo-ingest.log
   ```
