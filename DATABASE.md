# 🗄️ Sportivo - Database Schema

> **Provider:** Neon PostgreSQL (Serverless)  
> **ORM:** Prisma 7.x  
> **Connection:** Pooled via `@prisma/adapter-pg` (max 10 connections)

---

## Overview

The database contains **10 models** across 4 domains:

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Auth** | `users`, `refresh_tokens`, `password_reset_tokens` | Authentication & sessions |
| **Content** | `articles` | Sports news articles |
| **User Features** | `notifications`, `notification_preferences` | User notifications |
| **Sports Cache** | `cached_teams`, `cached_matches`, `cached_standings`, `cached_news`, `cache_metadata` | External API data cache |
| **Monetization** | `ad_placements` | Ad placements |
| **Analytics** | `page_hits` | Page view tracking |

---

## Entity Relationship Diagram (Text)

```
users 1───* notifications
users 1───1 notification_preferences
users 1───* refresh_tokens

(PasswordResetToken is standalone: no FK relation)

articles (standalone: authorId stores user UUID as string)

cached_teams       (standalone)
cached_matches     (standalone)
cached_standings   (standalone)
cached_news        (standalone)
cache_metadata     (standalone)

ad_placements      (standalone)
page_hits          (standalone)
```

---

## Model Details

### 1. User (`users`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `email` | String | Unique, required | User email (lowercase) |
| `displayName` | String? | Optional | Display name |
| `photoURL` | String? | Optional | Avatar URL |
| `password` | String? | Optional, SHA-256 hashed | Password for email auth |
| `role` | String | Default `"user"` | `"user"`, `"admin"`, `"editor"` |
| `favoriteTeams` | String[] | Default `[]` | Array of team IDs |
| `bookmarkedArticles` | String[] | Default `[]` | Array of article UUIDs |
| `createdAt` | DateTime | Default `now()` | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relations:** `notifications`, `preferences`, `refreshTokens`

### 2. Article (`articles`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `title` | String | Required | Article headline |
| `slug` | String | Unique, required | URL-safe slug |
| `content` | String | Required | Markdown content |
| `excerpt` | String? | Optional | Short description |
| `category` | String? | Optional | e.g., "Football" |
| `thumbnail` | String? | Optional | Cover image URL |
| `authorId` | String? | Optional | User UUID (string, no FK) |
| `authorName` | String? | Optional | Author display name |
| `tags` | String[] | Default `[]` | Array of tag strings |
| `status` | String | Default `"draft"` | `"draft"` or `"published"` |
| `publishedAt` | DateTime? | Nullable | Publication timestamp |
| `views` | Int | Default `0` | View counter |
| `createdAt` | DateTime | Default `now()` | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Indexes:** Slug (unique)

### 3. Notification (`notifications`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `userId` | String | FK → `users.id` (CASCADE) | Owner |
| `type` | String | Required | `"match_start"`, `"team_news"`, `"article_alert"`, `"system"` |
| `title` | String | Required | Notification title |
| `message` | String | Required | Notification body |
| `read` | Boolean | Default `false` | Read status |
| `link` | String? | Optional | Deep link URL |
| `createdAt` | DateTime | Default `now()` | Creation timestamp |

**Indexes:** `userId`

### 4. NotificationPreference (`notification_preferences`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `userId` | String | Unique, FK → `users.id` (CASCADE) | Owner |
| `matchStartReminders` | Boolean | Default `true` | Match start alerts |
| `teamNewsUpdates` | Boolean | Default `true` | Team news alerts |
| `articleAlerts` | Boolean | Default `true` | Article alerts |
| `systemNotifications` | Boolean | Default `true` | System alerts |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

### 5. CachedTeam (`cached_teams`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | String | PK | TheSportsDB team ID (e.g., "133602") |
| `name` | String | Required | Team name |
| `shortName` | String? | Optional | 3-letter abbreviation |
| `alternateName` | String? | Optional | Alternative name |
| `formedYear` | String? | Optional | Year established |
| `sport` | String? | Optional | Sport type |
| `league` | String? | Optional | League name |
| `leagueId` | String? | Optional | League ID |
| `stadium` | String? | Optional | Stadium name |
| `stadiumThumb` | String? | Optional | Stadium image |
| `stadiumLoc` | String? | Optional | Stadium location |
| `website` | String? | Optional | Official website |
| `facebook` / `twitter` / `instagram` / `youtube` | String? | Optional | Social media URLs |
| `descriptionEN` | String? | Optional | English description |
| `badge` | String? | Optional | Team badge URL |
| `jersey` | String? | Optional | Jersey image URL |
| `logo` | String? | Optional | Logo URL |
| `banner` | String? | Optional | Banner URL |
| `country` | String? | Optional | Country |
| `createdAt` / `updatedAt` | DateTime | Timestamps | |

**Indexes:** `leagueId`

### 6. CachedMatch (`cached_matches`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | String | PK | TheSportsDB event ID |
| `leagueId` | String | Required | League ID |
| `leagueName` | String | Required | League display name |
| `homeTeamId` / `awayTeamId` | String | Required | Team IDs |
| `homeTeamName` / `awayTeamName` | String | Required | Team names |
| `homeScore` / `awayScore` | String? | Optional | Scores |
| `status` | String? | Optional | "NS", "FT", "Live", etc. |
| `date` | String | Required | "YYYY-MM-DD" |
| `time` | String? | Optional | "HH:MM:SS" |
| `round` | String? | Optional | Match round |
| `spectators` | String? | Optional | Attendance |
| `thumb` | String? | Optional | Thumbnail URL |
| `video` | String? | Optional | Video URL |
| `sport` | String | Default `"soccer"` | Sport type |
| `type` | String | Required | `"fixture"` or `"score"` |

**Indexes:** `leagueId`, `type`, `date`

### 7. CachedStanding (`cached_standings`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `leagueId` | String | Required | League ID |
| `teamId` | String | Required | Team ID |
| `teamName` | String | Required | Team display name |
| `teamBadge` | String? | Optional | Badge URL |
| `played` / `won` / `drawn` / `lost` | Int | Required | Match stats |
| `goalsFor` / `goalsAgainst` / `goalsDifference` | Int | Required | Goal stats |
| `points` / `rank` | Int | Required | Table position |

**Unique constraint:** `(leagueId, teamId)`  
**Indexes:** `leagueId`

### 8. CachedNews (`cached_news`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | String | PK | NewsAPI URL |
| `title` | String | Required | News headline |
| `description` / `content` | String? | Optional | Article body |
| `image` | String? | Optional | Image URL |
| `url` | String | Required | Source URL |
| `source` | String | Required | Publisher name |
| `query` | String | Required | Search query category |
| `publishedAt` | DateTime | Required | Publication time |

**Indexes:** `query`

### 9. CacheMetadata (`cache_metadata`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `key` | String | PK | Cache key (e.g., "scores:4328") |
| `expiresAt` | DateTime | Required | Expiration time |
| `createdAt` / `updatedAt` | DateTime | Timestamps | |

### 10. AdPlacement (`ad_placements`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `name` | String | Required | Ad name |
| `location` | String | Required | Page location |
| `adClient` | String | Required | AdSense client ID |
| `adSlot` | String | Required | Ad slot ID |
| `active` | Boolean | Default `true` | Active status |
| `impressions` / `clicks` | Int | Default `0` | Performance stats |

### 11. PageHit (`page_hits`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `path` | String | Required | Page path |
| `visitorId` | String | Required | Visitor identifier |
| `source` | String? | Optional | Traffic source |
| `userAgent` | String? | Optional | Browser user agent |
| `createdAt` | DateTime | Default `now()` | Visit timestamp |

**Indexes:** `path`, `visitorId`, `createdAt`

### 12. RefreshToken (`refresh_tokens`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `token` | String | Unique | 40-byte random hex |
| `userId` | String | FK → `users.id` (CASCADE) | Owner |
| `expiresAt` | DateTime | Required | Expiration (30 days) |

**Indexes:** `userId`, `token`

### 13. PasswordResetToken (`password_reset_tokens`)

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| `id` | UUID | PK, default `uuid()` | Unique identifier |
| `token` | String | Unique | 32-byte random hex |
| `email` | String | Required | User email |
| `expiresAt` | DateTime | Required | Expiration (1 hour) |
| `used` | Boolean | Default `false` | Usage flag |

**Indexes:** `email`, `token`

---

## Migration Files

| File | Purpose |
|------|---------|
| `20260517000000_init/migration.sql` | Initial schema |
| `20260518000001_add_password/migration.sql` | Add password column to users |

---

## Seed Data

The `prisma/seed.ts` file populates **8 sample articles** covering:
- Premier League title race
- NBA playoff preview
- Champions League Real Madrid vs Bayern
- F1 Bahrain GP
- Wimbledon 2026 predictions
- Record transfer news
- NFL Draft 2026
- Cricket World Cup 2026
