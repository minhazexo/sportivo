/**
 * Sportivo Data Ingestion Script
 * 
 * Fetches free sports data from the internet and caches it in the local database.
 * 
 * Sources used (all FREE, no API key required):
 *   1. TheSportsDB - Live scores, fixtures, standings, teams
 *   2. RSS Feeds - Sports news from BBC Sport, The Guardian
 *   3. Match Report Generator - Creates news articles from match data
 *   4. NewsAPI.org - Optional (requires free API key in .env)
 * 
 * Usage:
 *   npx tsx scripts/ingest-data.ts               # Full ingestion
 *   npx tsx scripts/ingest-data.ts --sports       # Sports data only
 *   npx tsx scripts/ingest-data.ts --news         # News only
 *   npx tsx scripts/ingest-data.ts --quick        # Quick refresh (scores + news)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';

dotenv.config();

// ─── Database Setup ──────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Constants ───────────────────────────────────────────────────────────────

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

const LEAGUES: Record<string, { id: string; name: string; sport: string }> = {
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

// Season configuration for each league
// Format: { completed: season with finished matches (scores), upcoming: season with future fixtures, rounds: number of rounds }
const LEAGUE_SEASONS: Record<string, { completed: string; upcoming: string; rounds: number }> = {
  '4328': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4329': { completed: '2024-2025', upcoming: '2025-2026', rounds: 46 },
  '4335': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4332': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
  '4331': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
  '4334': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
  '4387': { completed: '2024-2025', upcoming: '', rounds: 0 },  // NBA - limited data
  '4391': { completed: '2024', upcoming: '2025', rounds: 22 },    // NFL (regular + playoffs)
  '4424': { completed: '2024', upcoming: '', rounds: 0 },         // MLB - limited data
  '4380': { completed: '2024-2025', upcoming: '', rounds: 0 },    // NHL - limited data
};

const RSS_FEEDS: { url: string; source: string; category: string }[] = [
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'Sports' },
  { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian', category: 'Sports' },
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', category: 'Sports' },

  // FIFA World Cup specific feeds
  { url: 'https://www.fifa.com/api/rss/latest', source: 'FIFA', category: 'World Cup' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Football', category: 'Football' },
];

const NEWS_QUERIES = ['sports', 'football', 'basketball', 'tennis', 'cricket', 'f1', 'nfl', 'nba', 'premier league', 'champions league', 'fifa world cup', 'world cup 2026', 'fifa world cup qualifiers'];

// ─── Logging ─────────────────────────────────────────────────────────────────

let totalSaved = 0;

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function progress(label: string, saved: number, failed: number) {
  totalSaved += saved;
  log(`✓ ${label}: ${saved} saved, ${failed} failed`);
}

// ─── Fetch Helper ────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Sportivo/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Sportivo/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TheSportsDB — Scores & Fixtures
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestScores() {
  log('📊 Fetching scores & fixtures from TheSportsDB (eventsround.php)...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    const config = LEAGUE_SEASONS[leagueId];
    if (!config || config.rounds === 0) {
      log(`⏭️  Skipping ${league.name} — events data not available via TheSportsDB`);
      continue;
    }

    // Try completed season first (scores)
    if (config.completed) {
      log(`  ${league.name}: fetching ${config.rounds} rounds of ${config.completed}...`);
      for (let round = 1; round <= config.rounds; round++) {
        try {
          const data = await fetchJson(`${SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${config.completed}`);
          const events: any[] = data?.events || [];
          if (events.length === 0) continue;

          for (const event of events) {
            try {
              const eventId = event.idEvent;
              if (!eventId) continue;

              const hasScore = event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '';
              const isFinished = event.strStatus === 'Match Finished' || event.strStatus === 'FT';

              await prisma.cachedMatch.upsert({
                where: { id: eventId },
                update: {
                  homeScore: event.intHomeScore ?? null,
                  awayScore: event.intAwayScore ?? null,
                  status: event.strStatus ?? 'FT',
                  time: event.strTime ?? null,
                  round: event.intRound ?? null,
                  spectators: event.intSpectators ?? null,
                  thumb: event.strThumb ?? null,
                  video: event.strVideo ?? null,
                  updatedAt: new Date(),
                },
                create: {
                  id: eventId,
                  leagueId,
                  leagueName: league.name,
                  homeTeamId: event.idHomeTeam ?? '',
                  awayTeamId: event.idAwayTeam ?? '',
                  homeTeamName: event.strHomeTeam ?? 'Unknown',
                  awayTeamName: event.strAwayTeam ?? 'Unknown',
                  homeScore: event.intHomeScore ?? null,
                  awayScore: event.intAwayScore ?? null,
                  status: event.strStatus ?? (hasScore ? 'FT' : 'NS'),
                  date: event.dateEvent ?? new Date().toISOString().split('T')[0],
                  time: event.strTime ?? null,
                  round: event.intRound ?? null,
                  spectators: event.intSpectators ?? null,
                  thumb: event.strThumb ?? null,
                  video: event.strVideo ?? null,
                  sport: league.sport,
                  type: isFinished || hasScore ? 'score' : 'fixture',
                },
              });
              saved++;
            } catch (err) {
              failed++;
            }
          }
        } catch (err) {
          // Skip rounds that fail quietly
        }

        // Rate limiting: wait 350ms between each round's API call
        await delay(350);
      }
    }

    // Try upcoming season (fixtures - just first few rounds)
    if (config.upcoming) {
      log(`  ${league.name}: fetching upcoming fixtures from ${config.upcoming}...`);
      for (let round = 1; round <= Math.min(5, config.rounds); round++) {
        try {
          const data = await fetchJson(`${SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${config.upcoming}`);
          const events: any[] = data?.events || [];
          if (events.length === 0) continue;

          for (const event of events) {
            try {
              const eventId = event.idEvent;
              if (!eventId) continue;

              // Skip if already saved from completed season
              const existing = await prisma.cachedMatch.findUnique({ where: { id: eventId } });
              if (existing) continue;

              await prisma.cachedMatch.upsert({
                where: { id: eventId },
                update: {
                  status: event.strStatus ?? 'NS',
                  time: event.strTime ?? null,
                  round: event.intRound ?? null,
                  thumb: event.strThumb ?? null,
                  updatedAt: new Date(),
                },
                create: {
                  id: eventId,
                  leagueId,
                  leagueName: league.name,
                  homeTeamId: event.idHomeTeam ?? '',
                  awayTeamId: event.idAwayTeam ?? '',
                  homeTeamName: event.strHomeTeam ?? 'Unknown',
                  awayTeamName: event.strAwayTeam ?? 'Unknown',
                  status: event.strStatus ?? 'NS',
                  date: event.dateEvent ?? new Date().toISOString().split('T')[0],
                  time: event.strTime ?? null,
                  round: event.intRound ?? null,
                  thumb: event.strThumb ?? null,
                  sport: league.sport,
                  type: 'fixture',
                },
              });
              saved++;
            } catch (err) {
              failed++;
            }
          }
        } catch (err) {
          // Skip rounds that fail
        }

        // Rate limiting: wait 350ms between each round's API call
        await delay(350);
      }
    }
  }

  progress('Scores & Fixtures', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: TheSportsDB — Standings
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestStandings() {
  log('🏆 Fetching standings from TheSportsDB...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    try {
      // Only soccer leagues have standings in TheSportsDB
      if (league.sport !== 'Soccer') continue;

      const data = await fetchJson(`${SPORTSDB_BASE}/lookuptable.php?l=${leagueId}`);
      const table: any[] = data?.table || [];

      for (const row of table) {
        try {
          const teamId = row.idTeam;
          if (!teamId) continue;

          await prisma.cachedStanding.upsert({
            where: { leagueId_teamId: { leagueId, teamId } },
            update: {
              teamName: row.strTeam ?? 'Unknown',
              teamBadge: row.strBadge ?? null,
              played: parseInt(row.intPlayed) || 0,
              won: parseInt(row.intWin) || 0,
              drawn: parseInt(row.intDraw) || 0,
              lost: parseInt(row.intLoss) || 0,
              goalsFor: parseInt(row.intGoalsFor) || 0,
              goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
              goalsDifference: parseInt(row.intGoalDifference) || 0,
              points: parseInt(row.intPoints) || 0,
              rank: parseInt(row.intRank) || 0,
              updatedAt: new Date(),
            },
            create: {
              leagueId,
              teamId,
              teamName: row.strTeam ?? 'Unknown',
              teamBadge: row.strBadge ?? null,
              played: parseInt(row.intPlayed) || 0,
              won: parseInt(row.intWin) || 0,
              drawn: parseInt(row.intDraw) || 0,
              lost: parseInt(row.intLoss) || 0,
              goalsFor: parseInt(row.intGoalsFor) || 0,
              goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
              goalsDifference: parseInt(row.intGoalDifference) || 0,
              points: parseInt(row.intPoints) || 0,
              rank: parseInt(row.intRank) || 0,
            },
          });
          saved++;
        } catch (err) {
          failed++;
        }
      }
    } catch (err) {
      log(`⚠️  Failed to fetch standings for ${league.name}: ${err}`);
      failed++;
    }

    // Rate limiting: wait 500ms between each league's API call
    await delay(500);
  }

  progress('Standings', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: TheSportsDB — Teams
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestTeams() {
  log('👥 Fetching teams from TheSportsDB...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    try {
      const data = await fetchJson(`${SPORTSDB_BASE}/lookup_all_teams.php?id=${leagueId}`);
      const teams: any[] = data?.teams || [];

      for (const team of teams) {
        try {
          const teamId = team.idTeam;
          if (!teamId) continue;

          await prisma.cachedTeam.upsert({
            where: { id: teamId },
            update: {
              name: team.strTeam ?? 'Unknown',
              shortName: team.strTeamShort ?? null,
              alternateName: team.strAlternate ?? null,
              formedYear: team.intFormedYear ?? null,
              sport: league.sport,
              league: league.name,
              leagueId,
              stadium: team.strStadium ?? null,
              stadiumThumb: team.strStadiumThumb ?? null,
              stadiumLoc: team.strStadiumLocation ?? null,
              website: team.strWebsite ?? null,
              facebook: team.strFacebook ?? null,
              twitter: team.strTwitter ?? null,
              instagram: team.strInstagram ?? null,
              youtube: team.strYoutube ?? null,
              descriptionEN: team.strDescriptionEN ?? null,
              badge: team.strBadge ?? team.strTeamBadge ?? null,
              jersey: team.strJersey ?? null,
              logo: team.strLogo ?? team.strTeamLogo ?? null,
              banner: team.strBanner ?? team.strTeamBanner ?? null,
              country: team.strCountry ?? null,
              updatedAt: new Date(),
            },
            create: {
              id: teamId,
              name: team.strTeam ?? 'Unknown',
              shortName: team.strTeamShort ?? null,
              alternateName: team.strAlternate ?? null,
              formedYear: team.intFormedYear ?? null,
              sport: league.sport,
              league: league.name,
              leagueId,
              stadium: team.strStadium ?? null,
              stadiumThumb: team.strStadiumThumb ?? null,
              stadiumLoc: team.strStadiumLocation ?? null,
              website: team.strWebsite ?? null,
              facebook: team.strFacebook ?? null,
              twitter: team.strTwitter ?? null,
              instagram: team.strInstagram ?? null,
              youtube: team.strYoutube ?? null,
              descriptionEN: team.strDescriptionEN ?? null,
              badge: team.strBadge ?? team.strTeamBadge ?? null,
              jersey: team.strJersey ?? null,
              logo: team.strLogo ?? team.strTeamLogo ?? null,
              banner: team.strBanner ?? team.strTeamBanner ?? null,
              country: team.strCountry ?? null,
            },
          });
          saved++;
        } catch (err) {
          failed++;
        }
      }
    } catch (err) {
      log(`⚠️  Failed to fetch teams for ${league.name}: ${err}`);
      failed++;
    }

    // Rate limiting: wait 500ms between each league's API call
    await delay(500);
  }

  progress('Teams', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: RSS Feed News Ingestion
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestRssNews() {
  log('📰 Fetching sports news from RSS feeds...');
  let saved = 0, failed = 0;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchText(feed.url);
      const parsed = parser.parse(xml);
      
      // Standard RSS structure: rss.channel.item[]
      let items: any[] = [];
      try {
        items = parsed?.rss?.channel?.item || [];
      } catch {
        // Some feeds use different structure
        items = [];
      }

      if (!Array.isArray(items)) items = items ? [items] : [];

      for (const item of items) {
        try {
          const title = item.title?.trim();
          const link = item.link?.trim() || item['@_rdf:about']?.trim();
          const description = item.description?.trim() || '';
          const pubDate = item.pubDate || item['dc:date'] || new Date().toISOString();
          const mediaContent = item['media:content']?.['@_url'] || 
                               item['media:thumbnail']?.['@_url'] || null;
          // Try to extract image from description (first img src)
          const imgMatch = description.match(/src=["']([^"']+)["']/);
          const image = mediaContent || (imgMatch ? imgMatch[1] : null);

          // Clean description (remove HTML tags)
          const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 500);

          if (!title || !link) continue;

          // Use the URL as the unique ID (hash it to fit in string)
          const id = link;

          await prisma.cachedNews.upsert({
            where: { id },
            update: {
              title,
              description: cleanDescription,
              image,
              publishedAt: new Date(pubDate),
              updatedAt: new Date(),
            },
            create: {
              id,
              title,
              description: cleanDescription,
              image,
              url: link,
              source: feed.source,
              query: feed.category.toLowerCase(),
              publishedAt: new Date(pubDate),
            },
          });
          saved++;
        } catch (err) {
          failed++;
        }
      }
    } catch (err) {
      log(`⚠️  Failed to fetch RSS feed ${feed.source}: ${err}`);
      failed++;
    }
  }

  progress('RSS News', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: NewsAPI.org (Optional - requires API key)
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestNewsApi() {
  const apiKey = process.env.NEWSAPI_API_KEY;
  if (!apiKey || apiKey === 'your-newsapi-key') {
    log('ℹ️  NewsAPI.org: No API key configured. Skipping (optional).');
    return { saved: 0, failed: 0, skipped: true };
  }

  log('📰 Fetching sports news from NewsAPI.org...');
  let saved = 0, failed = 0;

  for (const query of NEWS_QUERIES) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
      const data = await fetchJson(url);
      const articles: any[] = data?.articles || [];

      for (const article of articles) {
        try {
          const url = article.url || article.title;
          if (!url) continue;

          const id = url;
          const publishedAt = article.publishedAt ? new Date(article.publishedAt) : new Date();

          await prisma.cachedNews.upsert({
            where: { id },
            update: {
              title: article.title || 'Untitled',
              description: article.description || '',
              content: article.content || '',
              image: article.urlToImage || null,
              source: article.source?.name || 'NewsAPI',
              publishedAt,
              updatedAt: new Date(),
            },
            create: {
              id,
              title: article.title || 'Untitled',
              description: article.description || '',
              content: article.content || '',
              image: article.urlToImage || null,
              url,
              source: article.source?.name || 'NewsAPI',
              query: query.toLowerCase(),
              publishedAt,
            },
          });
          saved++;
        } catch (err) {
          failed++;
        }
      }

      // Rate limiting: NewsAPI free tier allows 100 requests/day
      // Each query costs 1 request, so let's limit to 5 queries
      if (NEWS_QUERIES.indexOf(query) >= 4) break;
    } catch (err) {
      log(`⚠️  NewsAPI query "${query}" failed: ${err}`);
      failed++;
    }
  }

  progress('NewsAPI News', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Generate Match Reports as News Articles
// ═══════════════════════════════════════════════════════════════════════════════

async function generateMatchReports() {
  log('📝 Generating match reports from recent scores...');
  let saved = 0, failed = 0;

  try {
    // Get recent finished matches
    const recentMatches = await prisma.cachedMatch.findMany({
      where: { 
        type: 'score', 
        homeScore: { not: null },
        awayScore: { not: null },
        status: { in: ['FT', 'Match Finished'] }
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    for (const match of recentMatches) {
      try {
        const homeScore = match.homeScore || '0';
        const awayScore = match.awayScore || '0';
        const title = `${match.homeTeamName} ${homeScore}-${awayScore} ${match.awayTeamName}`;
        const slug = `match-report-${match.id}`;
        
        // Determine if it was a home win, away win, or draw
        let result = 'draw';
        if (parseInt(homeScore) > parseInt(awayScore)) result = 'home-win';
        else if (parseInt(awayScore) > parseInt(homeScore)) result = 'away-win';

        const headlines: Record<string, string> = {
          'home-win': `${match.homeTeamName} Secure Victory Over ${match.awayTeamName}`,
          'away-win': `${match.awayTeamName} Triumph Away at ${match.homeTeamName}`,
          'draw': `${match.homeTeamName} and ${match.awayTeamName} Battle to a Draw`,
        };

        const articleTitle = headlines[result] || title;
        const articleExcerpt = `Match Report: ${match.homeTeamName} ${homeScore}-${awayScore} ${match.awayTeamName} in the ${match.leagueName}.`;
        const articleContent = `# ${articleTitle}\n\n## Match Summary\n\n${match.homeTeamName} faced ${match.awayTeamName} in an exciting ${match.leagueName} encounter that ended ${homeScore}-${awayScore}.\n\n## Key Moments\n\n- **Full Time Score:** ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName}\n- **Competition:** ${match.leagueName}\n- **Date:** ${match.date}\n\n## Match Report\n\nThe match between ${match.homeTeamName} and ${match.awayTeamName} provided plenty of action for the fans. ${match.homeTeamName} showed great determination throughout the match. ${match.awayTeamName} responded well and created several opportunities of their own.\n\nStay tuned for more detailed analysis and post-match coverage.\n\n*This is an automatically generated match report based on live match data.*`;

        // Check if this already exists as an article by slug
        const existingArticle = await prisma.article.findUnique({ where: { slug } });
        if (!existingArticle) {
          await prisma.article.create({
            data: {
              title: articleTitle,
              slug,
              content: articleContent,
              excerpt: articleExcerpt,
              category: match.leagueName || match.sport,
              authorName: 'Sportivo Match Reports',
              tags: [match.leagueName || match.sport, match.homeTeamName, match.awayTeamName, 'Match Report'],
              status: 'published',
              publishedAt: new Date(),
              thumbnail: match.thumb || null,
            },
          });
          saved++;
        }
      } catch (err) {
        failed++;
      }
    }
  } catch (err) {
    log(`⚠️  Match report generation failed: ${err}`);
    failed++;
  }

  progress('Match Reports', saved, failed);
  return { saved, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Update Cache Metadata
// ═══════════════════════════════════════════════════════════════════════════════

async function updateCacheMetadata() {
  log('🔄 Updating cache metadata...');
  const now = new Date();
  
  const metadataEntries = [
    { key: 'scores:last_ingested', ttlMinutes: 5 },
    { key: 'fixtures:last_ingested', ttlMinutes: 60 },
    { key: 'standings:last_ingested', ttlMinutes: 360 },
    { key: 'teams:last_ingested', ttlMinutes: 1440 },
    { key: 'news:last_ingested', ttlMinutes: 60 },
  ];

  for (const entry of metadataEntries) {
    const expiresAt = new Date(now.getTime() + entry.ttlMinutes * 60 * 1000);
    await prisma.cacheMetadata.upsert({
      where: { key: entry.key },
      update: { expiresAt, updatedAt: now },
      create: { key: entry.key, expiresAt },
    });
  }

  log('✅ Cache metadata updated');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

interface IngestResult {
  sports: { saved: number; failed: number };
  standings: { saved: number; failed: number };
  teams: { saved: number; failed: number };
  news: { saved: number; failed: number };
  newsApi: { saved: number; failed: number; skipped?: boolean };
  matchReports: { saved: number; failed: number };
  totalSaved: number;
  totalFailed: number;
  duration: string;
}

export async function runFullIngestion(): Promise<IngestResult> {
  const startTime = Date.now();
  totalSaved = 0;

  log('═══════════════════════════════════════════════════════════════');
  log('🚀 Sportivo Data Ingestion Started');
  log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Run ingestions in order: standings + teams first (fewer calls, before rate limit hits)
    const standings = await ingestStandings();
    const teams = await ingestTeams();
    const sports = await ingestScores();
    const news = await ingestRssNews();
    const newsApi = await ingestNewsApi();
    const matchReports = await generateMatchReports();
    
    await updateCacheMetadata();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n═══════════════════════════════════════════════════════════════');
    log('📊 INGESTION SUMMARY');
    log('═══════════════════════════════════════════════════════════════');
    log(`  Sports Scores/Fixtures:  ${sports.saved} saved, ${sports.failed} failed`);
    log(`  Standings:               ${standings.saved} saved, ${standings.failed} failed`);
    log(`  Teams:                   ${teams.saved} saved, ${teams.failed} failed`);
    log(`  RSS News:                ${news.saved} saved, ${news.failed} failed`);
    log(`  NewsAPI:                 ${newsApi.saved} saved, ${newsApi.failed} failed${newsApi.skipped ? ' (skipped)' : ''}`);
    log(`  Match Reports:           ${matchReports.saved} saved, ${matchReports.failed} failed`);
    log('─────────────────────────────────────────────────────────────');
    log(`  TOTAL:                   ${totalSaved} records saved`);
    log(`  Duration:                ${duration}s`);
    log('═══════════════════════════════════════════════════════════════\n');

    return {
      sports,
      standings,
      teams,
      news,
      newsApi,
      matchReports,
      totalSaved,
      totalFailed: sports.failed + standings.failed + teams.failed + news.failed + newsApi.failed + matchReports.failed,
      duration: `${duration}s`,
    };
  } catch (err) {
    log(`❌ Ingestion failed: ${err}`);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Sportivo Data Ingestion Script

Usage:
  npx tsx scripts/ingest-data.ts           Full ingestion (sports + news)
  npx tsx scripts/ingest-data.ts --sports  Sports data only
  npx tsx scripts/ingest-data.ts --news    News only
  npx tsx scripts/ingest-data.ts --quick   Quick refresh (scores + news only)

Sources (all FREE):
  • TheSportsDB - Live scores, fixtures, standings, teams
  • RSS Feeds - BBC Sport, The Guardian, ESPN
  • Match Report Generator - Auto-generated from match data
  • NewsAPI.org - Optional (requires free API key)
`);
  process.exit(0);
}

// Run directly from CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ingest-data.ts')) {
  runFullIngestion()
    .then((result) => {
      process.exit(result.totalFailed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
