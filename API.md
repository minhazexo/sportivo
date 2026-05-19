# 🌐 Sportivo - API Endpoints Documentation

> **Base URL:** `http://localhost:3000/api`  
> **Auth:** Bearer token in `Authorization` header  
> **CSRF:** Required for POST/PUT/DELETE (GET `/api/csrf-token` first)

---

## 1. Authentication

### `POST /api/auth/register`
Create a new user account.

**Rate Limit:** 20 req/15min (strict)

```json
// Request
{ "email": "user@example.com", "password": "secure123", "displayName": "John" }

// Response (201)
{ "token": "jwt...", "refreshToken": "hex...", "user": { "id": "uuid", "email": "...", "displayName": "...", "photoURL": "...", "role": "user" } }
```

### `POST /api/auth/login`
Authenticate with email + password.

**Rate Limit:** 50 req/15min (strict)

```json
// Request
{ "email": "user@example.com", "password": "secure123" }

// Response
{ "token": "jwt...", "refreshToken": "hex...", "user": { ... } }
```

### `GET /api/auth/verify-token`
Verify current JWT token validity.

**Auth:** Required

```json
// Response
{ "valid": true, "user": { "id": "...", "email": "...", "displayName": "...", "photoURL": "...", "role": "admin" } }
```

### `POST /api/auth/refresh`
Refresh an expired JWT using a refresh token.

**Rate Limit:** 20 req/15min (strict)

```json
// Request
{ "refreshToken": "hex..." }

// Response
{ "token": "new-jwt...", "refreshToken": "new-hex...", "user": { ... } }
```

### `POST /api/auth/forgot-password`
Request a password reset link.

**Rate Limit:** 5 req/15min (strict)

```json
// Request
{ "email": "user@example.com" }

// Response
{ "message": "If an account with that email exists, a password reset link has been sent." }
```

### `POST /api/auth/reset-password`
Reset password using a reset token.

**Rate Limit:** 5 req/hour (strict)

```json
// Request
{ "token": "hex...", "password": "newpass123" }

// Response
{ "message": "Password has been reset successfully." }
```

---

## 2. CSRF Protection

### `GET /api/csrf-token`
Get a CSRF token for mutating requests.

**Rate Limit:** 50 req/15min

```json
// Response
{ "csrfToken": "hex..." }
```

---

## 3. User Profile

### `GET /api/users/profile`
Fetch the current user's profile with preferences.

**Auth:** Required

### `POST /api/users/profile`
Update display name and photo URL.

**Auth:** Required  
**Rate Limit:** 10 req/min (strict)

---

## 4. Bookmarks

### `GET /api/users/bookmarks`
Get user's bookmarked article IDs.

**Auth:** Required

### `POST /api/users/bookmarks`
Add an article to bookmarks.

**Auth:** Required  
**Rate Limit:** 20 req/min

```json
// Request
{ "articleId": "uuid" }
```

### `DELETE /api/users/bookmarks/:id`
Remove a bookmark.

**Auth:** Required  
**Rate Limit:** 20 req/min

---

## 5. Favorite Teams

### `GET /api/users/favorite-teams`
Get user's followed team IDs.

**Auth:** Required

### `POST /api/users/favorite-teams`
Follow a team.

**Auth:** Required  
**Rate Limit:** 20 req/min

```json
// Request
{ "teamId": "133602" }
```

### `DELETE /api/users/favorite-teams/:id`
Unfollow a team.

**Auth:** Required  
**Rate Limit:** 20 req/min

---

## 6. Notifications

### `GET /api/notifications`
Fetch user's notifications (latest 50).

**Auth:** Required

### `PUT /api/notifications/:id/read`
Mark a single notification as read.

**Auth:** Required

### `PUT /api/notifications/read-all`
Mark all notifications as read.

**Auth:** Required

### `POST /api/notifications`
Create a new notification.

**Auth:** Required

```json
// Request
{ "type": "match_start", "title": "Match starting", "message": "Arsenal vs Chelsea starts in 15 min", "link": "/match/123" }
```

### `GET /api/notifications/preferences`
Get notification preferences.

**Auth:** Required

### `PUT /api/notifications/preferences`
Update notification preferences.

**Auth:** Required

```json
// Request
{ "matchStartReminders": true, "teamNewsUpdates": false, "articleAlerts": true, "systemNotifications": true }
```

---

## 7. Sports Data (Cached)

All sports endpoints read from cached tables in PostgreSQL. Data must be populated externally.

### `GET /api/sports/scores`
Get live/recent scores.

**Rate Limit:** 200 req/15min

| Param | Type | Description |
|-------|------|-------------|
| `league` | string | Numeric league ID (optional, defaults to today's scores) |

### `GET /api/sports/fixtures`
Get upcoming fixtures.

**Rate Limit:** 200 req/15min

| Param | Type | Description |
|-------|------|-------------|
| `league` | string | Numeric league ID |

### `GET /api/sports/standings`
Get league standings.

**Rate Limit:** 200 req/15min

| Param | Type | Description |
|-------|------|-------------|
| `league` | string | **Required.** Numeric league ID |

### `GET /api/sports/teams/:league`
Get all teams in a league.

**Rate Limit:** 200 req/15min

### `GET /api/sports/search-teams`
Search teams by name.

**Rate Limit:** 150 req/15min

| Param | Type | Description |
|-------|------|-------------|
| `t` | string | **Required.** Team name query |

### `GET /api/sports/team/:id`
Get a single team by ID.

**Rate Limit:** 200 req/15min

### `GET /api/sports/team/:id/events`
Get recent events for a team.

**Rate Limit:** 150 req/15min

### `GET /api/sports/match/:id`
Get match details.

**Rate Limit:** 200 req/15min

### `GET /api/sports/news`
Get cached sports news articles.

**Rate Limit:** 200 req/15min

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (default: 'sports') |
| `limit` | number | Results limit (1-100, default: 10) |

---

## 8. Articles (CRUD)

### `GET /api/articles`
List all articles.

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status ('draft', 'published') |

### `GET /api/articles/:slug`
Get article by slug. Increments view count.

### `GET /api/articles/id/:id`
Get article by UUID.

### `POST /api/articles`
Create a new article.

**Auth:** Admin  
**Rate Limit:** 5 req/min (strict)

```json
// Request
{ "title": "Match Report", "content": "# Markdown content...", "excerpt": "Brief...", "category": "Football", "thumbnail": "URL", "tags": ["Premier League"], "status": "draft" }
```

### `PUT /api/articles/:id`
Update an existing article.

**Auth:** Admin  
**Rate Limit:** 10 req/min (strict)

### `DELETE /api/articles/:id`
Delete an article.

**Auth:** Admin  
**Rate Limit:** 5 req/min (strict)

---

## 9. Admin: User Management

### `GET /api/admin/users`
List all users. Admin only.

### `PUT /api/admin/users/:id/role`
Change user role.

**Auth:** Admin  
**Rate Limit:** 20 req/min (strict)

```json
// Request
{ "role": "admin" }  // "user" | "admin" | "editor"
```

### `DELETE /api/admin/users/:id`
Delete a user (cascade deletes notifications).

**Auth:** Admin  
**Rate Limit:** 10 req/min (strict)

---

## 10. AI Content Generation

### `POST /api/ai/generate`
Generate content via Gemini (or local mock in demo mode).

**Rate Limit:** 5 req/min (strict)

```json
// Request
{ "prompt": "Write a headline about Champions League final", "type": "headline" }

// Response
{ "text": "### Draft Article (Local Database Mode)\\n\\nThis is a premium template..." }
```

---

## 11. System

### `GET /api/health`
Health check.

```json
// Response
{ "status": "ok", "database": "neon", "timestamp": "2025-01-01T00:00:00Z" }
```

### `GET /sitemap.xml`
Dynamic sitemap.

---

## 12. Data Mappers

The server maps database models to API-friendly formats:

| DB Model → | API Format |
|------------|-----------|
| `CachedMatch` | `{ idEvent, idLeague, strLeague, strHomeTeam, intHomeScore, strStatus, ... }` |
| `CachedTeam` | `{ idTeam, strTeam, strTeamBadge, strStadium, strDescriptionEN, ... }` |
| `CachedStanding` | `{ table: [{ intRank, strTeam, intPlayed, intWin, ... }] }` |
| `CachedNews` | `{ id, title, description, image, url, source, publishedAt }` |
