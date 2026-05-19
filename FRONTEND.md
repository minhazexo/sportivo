# 🎨 Sportivo - Frontend Documentation

> **Framework:** React 19 + TypeScript + Vite 6  
> **Styling:** Tailwind CSS v4 + Custom theme (`@tailwindcss/typography`)  
> **Animation:** Motion (Framer Motion fork)  
> **Icons:** Lucide React  
> **Routing:** React Router DOM v7 (HashRouter)

---

## 1. Theme & Design System

### Custom CSS Theme (`src/index.css`)

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --color-accent: #F27D26;        /* Orange accent */
  --color-editorial-bg: #F4F4F4;  /* Light gray background */
  --color-editorial-text: #1A1A1A; /* Near-black text */
}
```

### Utility Classes

| Class | Usage |
|-------|-------|
| `.editorial-border` | `border border-zinc-300` |
| `.editorial-title` | Uppercase, italic, black, tight tracking |
| `.editorial-label` | 10px, uppercase, wide letter-spacing |

### Design Aesthetic

- **Newspaper-inspired** with a modern editorial feel
- **Accent color:** Orange (#F27D26) for CTAs, badges, hover states
- **Dark header:** Black navbar with white text
- **Cards:** White backgrounds with zinc/gray borders
- **Typography:** Inter (body), Outfit (headings), JetBrains Mono (data)
- **Micro-interactions:** Hover underlines, transitions, spring animations

---

## 2. Component Architecture

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `Navbar` | `Navbar.tsx` | Sticky top nav with links, search, auth, mobile menu |
| `Footer` | `Footer.tsx` | 4-column footer with leagues, company, social links |
| `NotificationBell` | `NotificationBell.tsx` | Bell icon with unread badge + dropdown |

#### Navbar Features
- Responsive: Desktop navigation + mobile hamburger menu
- Animated via Motion (`AnimatePresence`)
- Auth-aware: Shows user avatar/name, bookmarks link
- Admin badge for admin users
- "Sign In" button or user dropdown with "Copy UID" utility
- Search pill with magnifying glass icon

### News Components

| Component | File | Description |
|-----------|------|-------------|
| `ArticleCard` | `ArticleCard.tsx` | Card with image, category badge, title, excerpt, author, time |
| `OptimizedImage` | `OptimizedImage.tsx` | Lazy-loaded image with IntersectionObserver, blur-up, skeleton, error fallback |
| `Skeleton` | `Skeleton.tsx` | Loading skeletons: ArticleCard, ScoreWidget, Table, Page |
| `SportsNewsCard` | `SportsNewsCard.tsx` | External news article card with source badge |

#### ArticleCard Features
- Animated mount via Motion
- Bookmark toggle (auth-required)
- `featured` prop: expands to 2 columns on grid
- Category badge overlay on image
- Hover: border accent color, title color change

#### OptimizedImage Features
- IntersectionObserver lazy loading (50px root margin)
- Shimmer skeleton placeholder
- Blur-up transition on load
- Error fallback with broken image icon

### Score Widget

| Component | File | Description |
|-----------|------|-------------|
| `ScoreWidget` | `ScoreWidget.tsx` | Horizontal scrolling ticker of live scores |

#### Features
- Animated pulsing red dot indicator
- Only shows team abbreviations (3 chars)
- Status badges: live scores in red, others in gray
- No-scrollbar horizontal scroll
- Responsive negative margins for mobile

### Utility Components

| Component | File | Description |
|-----------|------|-------------|
| `SEO` | `SEO.tsx` | Dynamic meta tags, OG/Twitter cards, JSON-LD |
| `Analytics` | `analytics/Analytics.tsx` | Google Analytics script injection |
| `AdSense` | `ads/AdSense.tsx` | Google AdSense component with variants |

#### SEO Component
- Dynamically updates `document.title` and meta tags
- Sets OG:title, OG:description, OG:image, Twitter card
- Manages canonical URL
- Injects/updates JSON-LD script
- Article-specific meta (published_time, author, tags)
- Helper functions: `generateArticleJsonLd`, `generateOrganizationJsonLd`, `generateBreadcrumbJsonLd`

---

## 3. Context Providers

### AuthContext (`AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: UserType | null;     // Logged-in user
  profile: UserType | null;  // Fetched profile with teams/bookmarks
  loading: boolean;
  login: () => void;         // Opens auth modal
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}
```

**Auth Modal Features:**
- Sign In / Sign Up toggle
- Email + password form (no Google OAuth in current build)
- Password visibility toggle
- DiceBear avatar generation on signup
- Spring-animated modal with glass backdrop
- Error display with motion enter/exit
- Loading spinner on submit

### NotificationContext (`NotificationContext.tsx`)

```typescript
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
```

- Polls every 60 seconds for new notifications
- Optimistic UI updates for markAsRead/markAllAsRead
- Falls back to fetch on error

### ToastContext (`ToastContext.tsx`)

```typescript
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

- 4 types: success (green), error (red), warning (yellow), info (blue)
- Auto-dismiss after 4 seconds (configurable)
- Slide-in animation from right
- Manual close button

---

## 4. API Client (`apiClient.ts`)

A robust fetch wrapper with:

| Feature | Description |
|---------|-------------|
| **Auto-routing** | Decides `/api` vs `/api/sports` base path |
| **Auth injection** | Reads `sportivo_auth_token` from localStorage |
| **CSRF** | Fetches token on first mutating request, caches it |
| **Retry on 403** | CSRF may expire; retries once with fresh token |
| **Timeout** | 15-second timeout via AbortController |
| **Retry logic** | GET requests retry up to 1 time with exponential backoff |
| **Error parsing** | Tries JSON error, falls back to HTTP status text |

---

## 5. Page Details

### Home (`/`)
- 5 parallel data fetches: articles, scores, fixtures, standings, sports news
- Responsive 3-column grid (2 main + 1 sidebar)
- "Top Stories" section with ArticleCards + search link
- "Latest Sports News" from external API (SportsNewsCard)
- "Recent Results" and "Upcoming Fixtures" inline
- Sidebar: Latest updates widget, standings table (top 8), ad placeholder, membership CTA
- Skeleton loaders during fetch
- Empty/error states handled

### ArticleDetail (`/article/:slug`)
- Markdown rendering via react-markdown
- Author metadata, date, category badge
- Tags as links to `/tag/:tag`
- Comments section (placeholder - needs implementation)
- Back navigation to home
- View counter (auto-increments on load)
- Share and comment action buttons

### Fixtures (`/leagues`)
- League selector tabs (6 leagues: EPL, La Liga, Bundesliga, Serie A, Ligue 1, NBA)
- Fixtures grouped by date
- Animated list items
- Team initials as avatar placeholders
- "vs" divider pill
- Time and venue display

### Standings (`/standings`)
- League selector tabs
- Full table: Pos, Team, P, W, D, L, GF, GA, GD, Pts
- Position trend indicators (up/down/neutral)
- Color coding: Top 4 (green), Bottom 4 (red)
- Team badge images
- Points displayed in black pill

### Teams (`/teams`)
- League dropdown selector (4 options)
- Grid of team cards with badge, name, stadium, formed year
- Hover: grayscale to color badge, reveal "View Profile"
- Decorative circle background elements

### TeamDetail (`/team/:id`)
- Hero header with team badge, name, location, stadium, formed year
- Follow/unfollow button (auth-required)
- "About" section with description
- Two-column: Upcoming Matches + Recent Results
- Back navigation to teams

### MatchDetail (`/match/:id`)
- Large scoreboard with team initials, score, status
- Live indicator with pulsing dot (if match is live)
- Match Info card: date, venue, round
- Home/Away formation cards (placeholder defaults)

### Search (`/search`)
- Full-width search input with URL query param sync
- Category filter tabs (All, Football, Basketball, Tennis, Cricket, F1)
- Client-side filtering of articles
- Grid results with thumbnails

### Tags (`/tags`)
- Tag cloud grid with article counts
- Dynamic aggregation from article data
- "Trending Topics" section linked to search

### Bookmarks (`/bookmarks`)
- Auth-protected page
- Fetches bookmarked articles by ID list
- Grid display with remove button per article

### NotificationPreferences (`/notifications/preferences`)
- 4 toggle switches: Match Start, Team News, Article Alerts, System
- Success confirmation toast on save
- Toggle state management via NotificationContext

---

## 6. Admin Pages

### AdminDashboard (`/admin`)
- Sidebar navigation (Overview, Articles, Users, Analytics, Settings)
- Stats cards: Total Articles, Total Views, Status Distribution
- Full article table with Edit/Delete actions
- "New Article" CTA

### ArticleEditor (`/admin/articles/new`, `/admin/articles/edit/:id`)
- Two-column layout: Content (80%) + Sidebar (20%)
- Title input with "AI Generate" button
- Large markdown textarea (600px height)
- Sidebar: Slug, Category dropdown, Draft/Publish toggle, Tags (enter to add), Thumbnail URL, Excerpt

### UserManagement (`/admin/users`)
- Search filter
- User table: avatar, name, email, role (select), teams count, delete action
- Role options: User, Editor, Admin

### AdManagement (`/admin/ads`)
- Add ad form (name, location, client, slot)
- Stats cards: Total Impressions, Total Clicks, AVG CTR
- Ad table with toggle active/paused, display stats
- Delete action

### AnalyticsDashboard (`/admin/analytics`)
- Time range selector (24h, 7d, 30d, 90d)
- 4 metric cards: Page Views, Unique Visitors, Avg Session, Bounce Rate
- Trend indicators (up/down with percentage)
- Top Pages with bar visualization
- Traffic Sources with bar visualization
- Top Articles with ranking

---

## 7. Performance Features

- **Lazy loading** for images (IntersectionObserver)
- **Skeleton loaders** on all data-fetching pages
- **Optimistic UI** for notifications (mark read/read all)
- **Code splitting** ready (admin routes separated)
- **Debounced search** via URL search params
- **CSS animations** via Tailwind + Motion
- **Blur-up image loading** effect

---

## 8. Empty & Error States

Every data-fetching page handles:

| State | Implementation |
|-------|----------------|
| **Loading** | Animated spinner or skeleton components |
| **Error** | Red alert box or error message |
| **Empty** | Informational message with icon + navigation link |
| **Edge Cases** | Missing params, invalid IDs, auth checks |
