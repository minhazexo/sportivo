/**
 * Sportivo Teams Ingestion Script
 * 
 * Fetches ALL teams from TheSportsDB for every configured league
 * and stores them in the CachedTeam table.
 * 
 * Usage:
 *   npx tsx scripts/ingest-teams.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── Database Setup ──────────────────────────────────────────────────────────

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Sportivo/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: Fetch Teams for All Leagues
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestAllTeams() {
  log('═══════════════════════════════════════════════════════════════');
  log('🚀 Sportivo Teams Ingestion Started');
  log('═══════════════════════════════════════════════════════════════\n');

  let totalSaved = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const startTime = Date.now();

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    log(`📡 Fetching teams for ${league.name} (${league.sport})...`);

    try {
      const data = await fetchJson(`${SPORTSDB_BASE}/lookup_all_teams.php?id=${leagueId}`);
      const teams: any[] = data?.teams || [];

      if (teams.length === 0) {
        log(`  ⚠️  No teams returned for ${league.name}`);
        totalSkipped++;
        continue;
      }

      log(`  Found ${teams.length} teams`);

      let saved = 0;
      let failed = 0;

      for (const team of teams) {
        try {
          const teamId = team.idTeam;
          if (!teamId) {
            failed++;
            continue;
          }

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
          totalSaved++;
        } catch (err) {
          failed++;
          totalFailed++;
        }
      }

      log(`  ✓ ${league.name}: ${saved} saved, ${failed} failed`);
    } catch (err) {
      log(`  ❌ Failed to fetch teams for ${league.name}: ${err}`);
      totalFailed++;
    }

    // Rate limiting: wait 500ms between each league's API call
    await delay(500);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  log('\n═══════════════════════════════════════════════════════════════');
  log('📊 INGESTION SUMMARY');
  log('═══════════════════════════════════════════════════════════════');
  log(`  Total Teams Saved:   ${totalSaved}`);
  log(`  Total Failed:        ${totalFailed}`);
  log(`  Leagues with 0 teams: ${totalSkipped}`);
  log(`  Duration:            ${duration}s`);
  log('═══════════════════════════════════════════════════════════════\n');

  return { totalSaved, totalFailed, duration };
}

// ─── Run ─────────────────────────────────────────────────────────────────────

ingestAllTeams()
  .then((result) => {
    console.log(`✅ Teams ingestion complete: ${result.totalSaved} teams saved in ${result.duration}s`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(() => {});
  });
