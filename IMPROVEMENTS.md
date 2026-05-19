# 🚀 Sportivo - Improvements & Recommendations

> **Status:** Migration from Firebase to Neon PostgreSQL (in progress)  
> **Priority:** P0 = Critical, P1 = High, P2 = Medium, P3 = Low

---

## P0 - Critical Issues

### 1. Password Hashing Security
**Severity:** 🔴 Critical  
**File:** `server.ts`  

```typescript
// CURRENT: SHA-256 with static salt (vulnerable to rainbow tables)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'sportivo_db_salt').digest('hex');
}
```

**Recommendation:** Use `bcrypt` or `argon2` for proper password hashing with per-user salts.

```typescript
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. Missing Token Blacklist / Revocation
**Severity:** 🔴 Critical  
**File:** `server.ts`

JWT tokens are not blacklisted on logout. A stolen JWT remains valid for 7 days.

**Recommendation:** Maintain a token blacklist table or use short-lived JWTs (15min) with refresh token rotation (already implemented).

### 3. Dev Mode Auth Bypass
**Severity:** 🔴 Critical  
**File:** `server.ts` (line ~155)

```typescript
if (process.env.NODE_ENV !== 'production' && !token.includes('.')) {
  // Grants admin rights to any direct UID in development
  req.user = { uid: token, ..., role: 'admin' };
}
```

**Recommendation:** Remove or properly guard this bypass. Use a dedicated test user with proper auth instead.

---

## P1 - High Priority

### 4. Database Connection Pool Not Disconnected on Server Shutdown
**File:** `src/lib/prisma.ts`

The Prisma pool is never disconnected on process exit, potentially causing connection leaks.

**Recommendation:**
```typescript
process.on('SIGINT', async () => {
  await pool.end();
  await prisma.$disconnect();
  process.exit(0);
});
```

### 5. No Google OAuth Login
**File:** `src/context/AuthContext.tsx`

The auth modal only supports email/password. Firebase Google OAuth was removed during migration but not replaced.

**Recommendation:** Implement Google OAuth via Passport.js or a similar strategy. The existing database schema supports OAuth (password field is optional).

### 6. Static Password Reset URL
**File:** `server.ts`

```typescript
const resetUrl = `${process.env.VITE_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
```

The reset password page (`/reset-password`) does not exist in the frontend routes.

**Recommendation:** Create a `ResetPassword.tsx` page component and add it to the router.

### 7. No Comments API Implementation
**File:** `src/pages/ArticleDetail.tsx`

The comments section shows a placeholder with no backend implementation. The database has no comments table.

**Recommendation:** Create a `Comment` model in Prisma and implement CRUD endpoints.

---

## P2 - Medium Priority

### 8. No Proper Server-Side Caching Layer
The current "caching" relies entirely on pre-populated database tables. There's no cache population mechanism or TTL enforcement.

**Recommendation:**
- Implement a cron job or scheduled task to periodically fetch from TheSportsDB/NewsAPI
- Add cache invalidation logic using `CacheMetadata`
- Consider Redis as a hot cache layer in front of PostgreSQL

### 9. No External Sports API Integration
**Files:** `server.ts`, `src/lib/sportsApi.ts`

The sports endpoints return empty or mock data because the external API integration (TheSportsDB) needs API keys and the data fetching pipeline isn't running.

**Recommendation:**
- Create a data ingestion script (`scripts/ingest-sports-data.ts`)
- Schedule it via cron (e.g., every 5 minutes for scores, hourly for news)
- Add error handling for API failures

### 10. Hardcoded JWT Secret Fallback
**File:** `server.ts`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[Auth] WARNING: No JWT_SECRET in .env — using hardcoded fallback...');
  return "sportivo-neon-postgres-secret-key-987654321";
})();
```

**Recommendation:** Make the app fail to start if `JWT_SECRET` is not set in production.

### 11. No Type-Safe API Client
**File:** `src/lib/apiClient.ts`

The `apiClient` methods return `Promise<any>`, losing all type information.

**Recommendation:** Make the API client generic:
```typescript
async function get<T>(path: string, params?: QueryParams): Promise<T> { ... }
```

### 12. Missing 404 Page
The app has no dedicated 404 page. Invalid routes render nothing.

**Recommendation:** Add a `NotFound.tsx` page and a catch-all route.

### 13. No Loading States for Auth Actions
**File:** `src/context/AuthContext.tsx`

The `login()` function just opens the modal. There's no loading state for auth initialization.

**Recommendation:** Add loading indicators for token verification and profile fetch on app startup.

### 14. Inefficient Article Search
**File:** `src/pages/Search.tsx`

```typescript
const data = await apiClient.get('/articles');
let results = (data || []) as Article[];
results = results.filter(article => {
  // Client-side filtering
});
```

Fetches ALL articles then filters client-side. Doesn't scale.

**Recommendation:** Implement server-side search with Prisma `contains` queries and full-text search.

---

## P3 - Low Priority / Nice to Have

### 15. Missing Unit Tests
The project has zero test files. No Jest, Vitest, or Playwright configuration.

**Recommendation:**
- Add Vitest for unit tests
- Add Playwright for E2E tests
- Test critical paths: auth, article CRUD, bookmark flow

### 16. No Input Rate Limiting for Article Content
**File:** `server.ts`

Article content can be up to 50,000 characters (Prisma `String`), but there's no frontend character count or validation.

### 17. No Image Upload Support
**File:** `src/pages/admin/ArticleEditor.tsx`

Thumbnails are URL-based only. No file upload mechanism.

**Recommendation:** Integrate with an image hosting service (Cloudinary, Uploadthing) or implement local file upload.

### 18. Mobile Responsive Gaps
- The homepage sidebar doesn't collapse well on mobile
- Standing tables overflow on small screens
- The admin pages have limited mobile optimization

### 19. No API Pagination
**File:** `server.ts`

`/api/articles` returns max 50 articles with no pagination support.

**Recommendation:** Add `skip` and `take` query parameters.

### 20. Hardcoded League Data
**Files:** `src/lib/sportsApi.ts`, `src/pages/Standings.tsx`, `src/pages/Fixtures.tsx`, `src/pages/Leagues.tsx`

League IDs and names are hardcoded in multiple places. Adding a new league requires editing multiple files.

**Recommendation:** Centralize league data in a single configuration file or database table.

### 21. No Environment Validation on Startup
**File:** `server.ts`

The server starts even if critical env vars are missing. Users find out when features fail.

**Recommendation:**
```typescript
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}
```

### 22. `vite.config.ts` Base Path Issue
**File:** `vite.config.ts`

```typescript
base: '/sportivo/',  // Hardcoded base path
```

This will break when deploying to a custom domain (expects `/sportivo/` prefix).

**Recommendation:** Make the base path configurable via environment variable.

### 23. Static Sitemap Not Dynamic
**File:** `server.ts`

The sitemap only includes hardcoded static routes. Doesn't include individual articles.

**Recommendation:** Fetch articles from the database and include them in the sitemap.

### 24. No Proper Error Boundary
**File:** `src/App.tsx`

No React error boundary wrapping the app. A crash in any component can take down the entire UI.

**Recommendation:** Add an `ErrorBoundary` component.

### 25. Notification System is Passive
**File:** `src/context/NotificationContext.tsx`

Notifications only poll. There's no real-time push mechanism or actual notification creation pipeline.

**Recommendation:** Implement server-sent events (SSE) or WebSocket for real-time notifications.

### 26. No Analytics Data Collection
**File:** `src/pages/admin/AnalyticsDashboard.tsx`

The Analytics Dashboard uses hardcoded mock data (`MOCK_DATA`). There's no actual analytics pipeline.

**Recommendation:** Start collecting data via `page_hits` table and implement aggregation queries.

### 27. CSS Class Naming Inconsistency
The codebase mixes Tailwind utility classes with custom helper classes (`.editorial-title`, `.editorial-label`) and some inline styles. Some pages use `text-slate-*` while others use `text-zinc-*`.

**Recommendation:** Standardize on a single color palette (zinc or slate, not both).

### 28. No Dark Mode Support
The design only has a light theme. Sports readers often prefer dark mode.

**Recommendation:** Implement Tailwind dark mode with a theme toggle.

### 29. Hardcoded AdSense Placeholder Values
**Files:** `src/components/ads/AdSense.tsx`, `src/pages/admin/AdManagement.tsx`

```typescript
adClient="ca-pub-XXXXXXXXXX"  // Placeholder
adSlot="1234567890"            // Placeholder
```

These should be fully configurable via the admin panel with live preview.

### 30. Admin Panel Missing Features
- No "preview article" functionality
- No bulk operations (delete, publish multiple)
- No article scheduling (publish at a future date)
- No media library
- No activity log

---

## Quick Wins (Can be done in < 1 hour)

| # | Task | Impact |
|---|------|--------|
| 1 | Add `process.on('SIGINT')` to disconnect Prisma | Prevents connection leaks |
| 2 | Remove hardcoded JWT secret fallback | Security |
| 3 | Add loading states to auth flow | UX |
| 4 | Create 404 page | UX |
| 5 | Add pagination to article endpoint | Performance |
| 6 | Standardize color palette (zinc vs slate) | Consistency |
| 7 | Make base path configurable in vite.config | Deployability |
| 8 | Add env var validation on startup | Reliability |
| 9 | Add type generics to apiClient | Developer experience |
| 10 | Create ResetPassword page | Feature completeness |

---

## Architecture Recommendations

### Short-term (Next Sprint)
1. ✅ Migrate from Firebase to Neon PostgreSQL (in progress)
2. Add bcrypt password hashing
3. Implement Google OAuth
4. Create data ingestion scripts for sports APIs
5. Add proper comments system

### Medium-term (Next Month)
1. Add real-time notifications (SSE/WebSocket)
2. Implement analytics data pipeline
3. Add image upload support
4. Server-side search with full-text indexing
5. Add unit and E2E tests

### Long-term (Next Quarter)
1. Redis caching layer
2. Dark mode
3. Mobile app (React Native)
4. Multi-language support
5. PWA with offline support
6. Performance monitoring (Sentry, Lighthouse CI)

---

## Performance Audit Summary

| Metric | Current State | Target |
|--------|--------------|--------|
| **First Paint** | ~1.5s (Vite dev) | <1s |
| **Time to Interactive** | ~2s | <1.5s |
| **Lighthouse Score** | Not measured | 90+ |
| **Bundle Size** | Not measured | <200KB gzipped |
| **API Response Time** | Depends on DB | <100ms |
| **Images** | External URLs only | Optimized + responsive |

---

## Security Audit Summary

| Area | Status | Notes |
|------|--------|-------|
| Password hashing | ⚠️ Weak (SHA-256) | Use bcrypt/argon2 |
| JWT security | ✅ Good | Refresh token rotation |
| CSRF protection | ✅ Good | Token-based |
| Rate limiting | ✅ Good | Two-tier, auto-block |
| Input validation | ⚠️ Basic | HTML stripping only |
| SQL injection | ✅ Safe | Prisma parameterized queries |
| XSS protection | ⚠️ Partial | CSP headers + HTML stripping |
| Dev mode bypass | ❌ Risky | Auto-grants admin |
| Missing auth checks | ⚠️ | Some endpoints not rate-limited |
