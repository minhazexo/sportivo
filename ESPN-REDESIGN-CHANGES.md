# ESPN-Inspired Homepage Redesign - Complete Change Log

## Overview
Complete redesign of the Sportivo homepage to match ESPN's (espn.com / espn.in) visual style, layout, and user experience. All changes maintain backward compatibility with existing pages.

## Files Modified

### 1. `src/index.css` — Theme & Utility Classes
**What changed:**
- **Accent color changed** from orange `#F27D26` to ESPN red `#DC2626` (with dark variant `#B91C1C` and light variant `#FCA5A5`)
- **Background & text colors updated** to lighter gray-scale: `editorial-bg: #F9FAFB`, `editorial-text: #111827`
- **Added ESPN color tokens**: `espn-dark: #0F172A`, `espn-card: #FFFFFF`, `espn-border: #E5E7EB`, `espn-hover: #F3F4F6`
- **NEW ESPN utility classes**:
  - `.espn-border` — Gray border
  - `.espn-title` — Bold tracking-tight headline style
  - `.espn-headline` — Bold leading-tight headline
  - `.espn-label` — 11px bold uppercase label
  - `.espn-card` — White card with border + hover shadow
  - `.espn-tag` — Inline category tag
  - `.section-header` — Red accent bar before section titles
  - `.hero-gradient` / `.secondary-gradient` — Dark overlays for hero images
  - `.card-img-zoom` — Image zoom on hover
  - `.ticker-animate` — Continuous scrolling score ticker
  - `.nav-underline` — Red underline on nav link hover
- **Preserved old classes** (`editorial-title`, `editorial-label`, `editorial-border`) for backward compatibility with other pages

### 2. `src/pages/Home.tsx` — Complete Rewrite
**What changed:**
Entirely redesigned with ESPN-inspired layout:

#### Score Ticker (`.ScoreTicker`)
- Dark background (`espn-dark`) with continuous auto-scroll animation
- Red "LIVE" badge on the left
- Each match shows: home team name, score, "vs", score, away team name
- Status badges (LIVE / FT) with color coding
- Links to match detail pages
- Pauses on hover

#### Quick Links (`.QuickLinks`)
- Horizontal bar of quick-access buttons: Premier League, Champions League, NBA, La Liga, Standings, Fixtures
- Each with icon + label in pill-shaped buttons
- ESPN-style quick navigation

#### Hero Section (`.HeroSection`)
- **2/3 + 1/3 grid layout** (ESPN's signature hero layout)
- **Main hero** (left, 2/3 width):
  - Large background image with dark gradient overlay
  - Red accent category badge top-left
  - Title (extra-bold, white, large), excerpt (hidden on mobile), author, views
  - "Read Story" call-to-action
  - Image zoom effect on hover
- **Side stories** (right, 1/3 width):
  - 3 smaller stories stacked vertically
  - Each has image, gradient overlay, category badge, title, author
  - Image zoom on hover
- **Loading state**: Animated pulse placeholders
- **Empty state**: Message with icon

#### Featured Content Grid (`.FeaturedContent`)
- "Top Stories" section header with red accent bar
- **3-column card grid** (responsive: 1 column mobile, 2 tablet, 3 desktop)
- Each card features:
  - Aspect-ratio image container with zoom on hover
  - Red category badge overlay
  - Title (bold, 15px, line-clamp-2)
  - Excerpt (12px gray, line-clamp-2)
  - Author + date footer
  - Hover: accent color title + subtle shadow
- **Loading state**: 6 animated skeleton cards
- **Empty state**: Nothing rendered if no articles

#### External Sports News Grid
- "Around the Sports World" section
- **4-column grid** of external news cards
- Each card: image, source badge, external link icon, title
- Opens in new tab

#### Results & Fixtures (`.ResultsFixtures`)
- **2-column grid** (Recent Results left, Upcoming Fixtures right)
- Section headers with red accent bar + trophy/calendar icons
- Each match:
  - Status label (Full Time / league name)
  - Home team — score (or TBD) — Away team
  - Hover effects on rows
- Loading: animated pulse skeletons
- Empty: hidden if no data

#### Sidebar (right, 1/4 width)
- **Latest Updates** section:
  - List of recent article links with category, title, author + date
  - Hover effects
- **Standings Table**:
  - Full standings table with team badges, rank, played, GD, points
  - Color-coded rank positions (top 4 = red, relegation = red)
  - GD colored green/red
  - "Full Table" link
- **Premium promo box**: Dark gradient background with call-to-action

### 3. `src/components/layout/Navbar.tsx` — ESPN-Style Navigation
**What changed:**
- **Background**: Changed from `bg-black` to `bg-espn-dark` (`#0F172A`) with `border-b border-gray-800`
- **Logo**: Trophy icon + "Sportivo" text with hover accent color
- **Navigation links**: Home, Scores, Leagues, Standings, Teams, Tags — styled ESPN-style (`text-[11px] font-semibold uppercase tracking-wide text-gray-300`)
- **Sports dropdown**: Hover-triggered dropdown with Premier League, La Liga, NBA, F1 links + "View All Leagues"
- **Search bar**: Inline search input with `Ctrl+K` badge, linking to `/search`
- **User section**:
  - Avatar with fallback initial
  - Display name + role
  - Logout button
  - Bookmark link
  - Admin badge (conditional)
- **Sign In button**: Red accent background, prominent
- **Mobile menu**: Full redesign with sport quick links, search, user section, admin panel access

### 4. `src/components/news/ArticleCard.tsx` — ESPN-Style Cards
**What changed:**
- **Featured card**: Horizontal layout (image right, content left) with category badge, large title, excerpt, author, views, time ago
- **Standard card**: Image top, content bottom with:
  - Aspect-ratio image container with zoom on hover
  - Red category badge
  - Bold title with hover accent color
  - Excerpt (2 lines)
  - Author + time ago footer
- Bookmark button repositioned to top-right with white background
- Uses new `espn-card` utility class from CSS

### 5. `src/components/scores/ScoreWidget.tsx` — ESPN Score Display
**What changed:**
- **Compact mode** (new): Dark background score ticker with red "LIVE" badge, horizontal scroll
- **Full mode**: White card with gray header, match list with horizontal scroll
- Each match shows: team names, scores, status badge (LIVE/FT color-coded)
- Links to match detail pages
- Hover states on match rows
- Loading: animated pulse placeholders
- Empty: "No matches available" message

## Design Elements Inspired by ESPN

| ESPN Element | Sportivo Implementation |
|---|---|
| Dark header with navigation | `bg-espn-dark` with category links + sports dropdown |
| Horizontal score ticker | `ScoreTicker` with auto-scroll animation |
| Hero section (2/3 + 1/3) | Large featured story + 3 side stories |
| Card grid layout | 3-column responsive grid with zoom effects |
| Red accent color | `#DC2626` for badges, links, buttons |
| Standings sidebar | Full standings table with color-coded ranks |
| Quick sport links | Horizontal bar of sport buttons |
| Dark gradient overlays | `hero-gradient` / `secondary-gradient` |
| Category badges | Red pill badges on images |
| Score display format | "Team Score vs Score Team" with status |

## Backward Compatibility
- All old CSS utility classes (`editorial-title`, `editorial-label`, `editorial-border`) preserved
- Existing ScoreWidget component maintained (now supports `compact` prop)
- Other pages (Search, ArticleDetail, Tags, Leagues, etc.) unaffected
- TypeScript compilation passes with zero errors

## File Structure Changes
```
src/
├── index.css                          ← ES: Theme + utility classes updated
├── pages/
│   └── Home.tsx                       ← ES: Complete rewrite
├── components/
│   ├── layout/
│   │   └── Navbar.tsx                 ← ES: ESPN-style navigation
│   ├── news/
│   │   └── ArticleCard.tsx            ← ES: ESPN-style card design
│   └── scores/
│       └── ScoreWidget.tsx            ← ES: ESPN-style score display
```

## Dark/Light Mode Implementation

### Files Added
- **`src/context/ThemeContext.tsx`** — Theme context provider with:
  - `localStorage` persistence (`sportivo_theme` key)
  - System preference detection via `window.matchMedia('(prefers-color-scheme: dark)')`
  - Smooth 300ms CSS transitions on theme switch
  - Flash prevention: `theme-transitioning` class disables transitions during page load using `requestAnimationFrame` double-RAF pattern
  - `toggleTheme()` and `isDark` boolean exposed via context

### Files Modified
- **`src/index.css`** — Added:
  - `@custom-variant dark (&:where(.dark, .dark *));` for Tailwind v4 dark mode
  - CSS custom properties at `:root` for light mode and `.dark` for dark mode (15+ variables covering backgrounds, text, borders, cards, navbar, standings, skeleton, footer, overlays)
  - Smooth transitions on all elements: `transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease`
  - `.theme-transitioning` class disables all transitions (prevents flash)
  - Dark mode scrollbar styling
  - `.espn-card` dark mode hover with border-color change

- **`src/main.tsx`** — Wrapped `<App />` with `<ThemeProvider>`

- **`src/components/layout/Navbar.tsx`** — Added:
  - Theme toggle button with Sun/Moon icons
  - `useTheme()` hook integration
  - All dark mode Tailwind classes on mobile menu, user section, dropdowns

- **`src/components/layout/Footer.tsx`** — All colors replaced with CSS variables or `dark:` variants:
  - Footer background, borders, link colors, social icons

- **`src/components/news/ArticleCard.tsx`** — All hardcoded colors replaced:
  - Card backgrounds, text colors, borders, loading skeleton colors

- **`src/components/scores/ScoreWidget.tsx`** — All colors replaced with CSS variables:
  - Card backgrounds, headers, match rows, status badges

- **`src/pages/Home.tsx`** — All remaining hardcoded colors replaced:
  - Standings table: background, headers, borders, text colors (rank, team, GD, points)
  - Latest Updates: text colors, border separators
  - Error banner: dark mode variant for red background/text
  - Loading skeletons use CSS variables
  - Hover effects for standings rows and sidebar updates (`.hover:bg-gray-50 dark:hover:bg-gray-800/50`)

### Design Decisions
| Aspect | Light Mode | Dark Mode |
|---|---|---|
| Background | `#F9FAFB` (off-white) | `#0F172A` (dark navy) |
| Cards | `#FFFFFF` | `#1E293B` (slate-800) |
| Text primary | `#111827` (gray-900) | `#F1F5F9` (slate-100) |
| Text secondary | `#4B5563` (gray-600) | `#94A3B8` (slate-400) |
| Borders | `#E5E7EB` (gray-200) | `#334155` (slate-700) |
| Navbar | `#0F172A` (stays dark) | `#020617` (darker) |
| Token accent | `#DC2626` (red) | `#DC2626` (red, unchanged) |

## Next Steps / Recommendations
1. Extend ESPN-style to other pages (Fixtures, Standings, Teams)
2. Implement live score WebSocket updates for real-time ticker
3. Add video content sections (ESPN features video prominently)
4. Consider adding a theme-system option that follows OS preference dynamically
