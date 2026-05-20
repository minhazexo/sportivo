import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// ----------------------------------------------------
// File Upload Configuration
// ----------------------------------------------------
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// ----------------------------------------------------
// Auth Configuration
// ----------------------------------------------------
export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[Auth] WARNING: No JWT_SECRET in .env — using hardcoded fallback. Set JWT_SECRET for production security.');
  return "sportivo-neon-postgres-secret-key-987654321";
})();

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

// ----------------------------------------------------
// TheSportsDB API
// ----------------------------------------------------
export const THE_SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// ----------------------------------------------------
// League Definitions
// ----------------------------------------------------
export const LEAGUES: Record<string, { id: string; name: string; sport: string }> = {
  '4328': { id: '4328', name: 'English Premier League', sport: 'Soccer' },
  '4329': { id: '4329', name: 'English Championship', sport: 'Soccer' },
  '4335': { id: '4335', name: 'Spanish La Liga', sport: 'Soccer' },
  '4332': { id: '4332', name: 'Italian Serie A', sport: 'Soccer' },
  '4331': { id: '4331', name: 'German Bundesliga', sport: 'Soccer' },
  '4334': { id: '4334', name: 'French Ligue 1', sport: 'Soccer' },
  '4387': { id: '4387', name: 'NBA', sport: 'Basketball' },
  '4391': { id: '4391', name: 'NFL', sport: 'American Football' },
  '4424': { id: '4424', name: 'MLB', sport: 'Baseball' },
  '4380': { id: '4380', name: 'NHL', sport: 'Ice Hockey' },
};

export const LEAGUE_SEASONS: Record<string, { completed: string; upcoming: string; rounds: number }> = {
  '4328': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4329': { completed: '2024-2025', upcoming: '2025-2026', rounds: 46 },
  '4335': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4332': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4331': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
  '4334': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
  '4387': { completed: '2024-2025', upcoming: '', rounds: 0 },
  '4391': { completed: '2024', upcoming: '2025', rounds: 22 },
  '4424': { completed: '2024', upcoming: '', rounds: 0 },
  '4380': { completed: '2024-2025', upcoming: '', rounds: 0 },
};

export const LEAGUE_META: Record<string, { displayName: string; sport: string; country: string }> = {
  '4328': { displayName: 'English Premier League', sport: 'Soccer', country: 'England' },
  '4329': { displayName: 'English Championship', sport: 'Soccer', country: 'England' },
  '4335': { displayName: 'Spanish La Liga', sport: 'Soccer', country: 'Spain' },
  '4332': { displayName: 'Italian Serie A', sport: 'Soccer', country: 'Italy' },
  '4331': { displayName: 'German Bundesliga', sport: 'Soccer', country: 'Germany' },
  '4334': { displayName: 'French Ligue 1', sport: 'Soccer', country: 'France' },
  '4387': { displayName: 'NBA', sport: 'Basketball', country: 'USA' },
  '4391': { displayName: 'NFL', sport: 'American Football', country: 'USA' },
  '4424': { displayName: 'MLB', sport: 'Baseball', country: 'USA' },
  '4380': { displayName: 'NHL', sport: 'Ice Hockey', country: 'USA' },
};

// ----------------------------------------------------
// RSS Feed Sources
// ----------------------------------------------------
export const RSS_FEEDS: { url: string; source: string; category: string }[] = [
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'sports' },
  { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian', category: 'sports' },
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', category: 'sports' },

  // FIFA World Cup specific feeds
  { url: 'https://www.fifa.com/api/rss/latest', source: 'FIFA', category: 'world-cup' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Football', category: 'football' },
];
