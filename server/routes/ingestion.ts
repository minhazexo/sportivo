import prisma from "../../src/lib/prisma";
import { THE_SPORTSDB_BASE, LEAGUES, LEAGUE_SEASONS, RSS_FEEDS } from "../config";
import { stripCdata } from "../mappers";

const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

let totalSaved = 0;

async function fetchApi(url: string): Promise<any> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'Sportivo/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Scores & Fixtures ─────────────────────────────────────────────────────

async function ingestScores() {
  log('📊 Ingesting scores and fixtures from TheSportsDB (eventsround.php)...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    const sConfig = LEAGUE_SEASONS[leagueId];
    if (!sConfig || sConfig.rounds === 0) {
      log(`⏭️  Skipping ${league.name} — events not available via TheSportsDB`);
      continue;
    }

    if (sConfig.completed) {
      for (let round = 1; round <= sConfig.rounds; round++) {
        try {
          const data = await fetchApi(`${THE_SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${sConfig.completed}`);
          const events: any[] = data?.events || [];
          if (events.length === 0) continue;

          for (const event of events) {
            if (!event.idEvent) continue;
            const hasScore = event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '';
            const isFinished = event.strStatus === 'Match Finished' || event.strStatus === 'FT';

            await prisma.cachedMatch.upsert({
              where: { id: event.idEvent },
              update: {
                homeScore: event.intHomeScore ?? null,
                awayScore: event.intAwayScore ?? null,
                status: event.strStatus ?? (hasScore ? 'FT' : 'NS'),
                time: event.strTime ?? null,
                round: event.intRound ?? null,
                thumb: event.strThumb ?? null,
                updatedAt: new Date(),
              },
              create: {
                id: event.idEvent, leagueId, leagueName: league.name,
                homeTeamId: event.idHomeTeam || '', awayTeamId: event.idAwayTeam || '',
                homeTeamName: event.strHomeTeam || 'Unknown', awayTeamName: event.strAwayTeam || 'Unknown',
                homeScore: event.intHomeScore ?? null,
                awayScore: event.intAwayScore ?? null,
                status: event.strStatus ?? (hasScore ? 'FT' : 'NS'),
                date: event.dateEvent || new Date().toISOString().split('T')[0],
                time: event.strTime ?? null,
                round: event.intRound ?? null,
                sport: league.sport,
                type: isFinished || hasScore ? 'score' : 'fixture',
              },
            });
            saved++;
          }
        } catch { /* skip failed rounds */ }
        await delay(350);
      }
    }

    if (sConfig.upcoming) {
      for (let round = 1; round <= Math.min(5, sConfig.rounds); round++) {
        try {
          const data = await fetchApi(`${THE_SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${sConfig.upcoming}`);
          const events: any[] = data?.events || [];
          if (events.length === 0) continue;

          for (const event of events) {
            if (!event.idEvent) continue;
            const existing = await prisma.cachedMatch.findUnique({ where: { id: event.idEvent } });
            if (existing) continue;

            await prisma.cachedMatch.upsert({
              where: { id: event.idEvent },
              update: {
                status: event.strStatus ?? 'NS',
                time: event.strTime ?? null,
                round: event.intRound ?? null,
                thumb: event.strThumb ?? null,
                updatedAt: new Date(),
              },
              create: {
                id: event.idEvent, leagueId, leagueName: league.name,
                homeTeamId: event.idHomeTeam || '', awayTeamId: event.idAwayTeam || '',
                homeTeamName: event.strHomeTeam || 'Unknown', awayTeamName: event.strAwayTeam || 'Unknown',
                status: event.strStatus || 'NS',
                date: event.dateEvent || new Date().toISOString().split('T')[0],
                time: event.strTime ?? null,
                round: event.intRound ?? null,
                sport: league.sport,
                type: 'fixture',
              },
            });
            saved++;
          }
        } catch { /* skip failed rounds */ }
        await delay(350);
      }
    }
  }

  log(`✓ Scores & Fixtures: ${saved} saved, ${failed} failed`);
  totalSaved += saved;
  return { saved, failed };
}

// ─── Standings ─────────────────────────────────────────────────────────────

async function ingestStandings() {
  log('🏆 Ingesting standings...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    if (league.sport !== 'Soccer') continue;
    try {
      const data = await fetchApi(`${THE_SPORTSDB_BASE}/lookuptable.php?l=${leagueId}`);
      for (const row of (data?.table || [])) {
        if (!row.idTeam) continue;
        await prisma.cachedStanding.upsert({
          where: { leagueId_teamId: { leagueId, teamId: row.idTeam } },
          update: {
            teamName: row.strTeam, teamBadge: row.strBadge,
            played: parseInt(row.intPlayed) || 0, won: parseInt(row.intWin) || 0,
            drawn: parseInt(row.intDraw) || 0, lost: parseInt(row.intLoss) || 0,
            goalsFor: parseInt(row.intGoalsFor) || 0, goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
            goalsDifference: parseInt(row.intGoalDifference) || 0,
            points: parseInt(row.intPoints) || 0, rank: parseInt(row.intRank) || 0,
            updatedAt: new Date(),
          },
          create: {
            leagueId, teamId: row.idTeam, teamName: row.strTeam || 'Unknown', teamBadge: row.strBadge,
            played: parseInt(row.intPlayed) || 0, won: parseInt(row.intWin) || 0,
            drawn: parseInt(row.intDraw) || 0, lost: parseInt(row.intLoss) || 0,
            goalsFor: parseInt(row.intGoalsFor) || 0, goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
            goalsDifference: parseInt(row.intGoalDifference) || 0,
            points: parseInt(row.intPoints) || 0, rank: parseInt(row.intRank) || 0,
          },
        });
        saved++;
      }
    } catch (err) {
      log(`⚠️  ${league.name} standings failed: ${err}`);
    }
    await delay(500);
  }

  log(`✓ Standings: ${saved} saved, ${failed} failed`);
  totalSaved += saved;
  return { saved, failed };
}

// ─── Teams ─────────────────────────────────────────────────────────────────

async function ingestTeams() {
  log('👥 Ingesting teams...');
  let saved = 0, failed = 0;

  for (const [leagueId, league] of Object.entries(LEAGUES)) {
    try {
      const data = await fetchApi(`${THE_SPORTSDB_BASE}/lookup_all_teams.php?id=${leagueId}`);
      for (const team of (data?.teams || [])) {
        if (!team.idTeam) continue;
        await prisma.cachedTeam.upsert({
          where: { id: team.idTeam },
          update: {
            name: team.strTeam, shortName: team.strTeamShort, sport: league.sport,
            league: league.name, leagueId, badge: team.strBadge || team.strTeamBadge,
            stadium: team.strStadium, stadiumLoc: team.strStadiumLocation,
            website: team.strWebsite, descriptionEN: team.strDescriptionEN,
            country: team.strCountry, logo: team.strLogo, banner: team.strBanner,
            jersey: team.strJersey, updatedAt: new Date(),
          },
          create: {
            id: team.idTeam, name: team.strTeam || 'Unknown', shortName: team.strTeamShort,
            sport: league.sport, league: league.name, leagueId, badge: team.strBadge || team.strTeamBadge,
            stadium: team.strStadium, stadiumLoc: team.strStadiumLocation,
            website: team.strWebsite, descriptionEN: team.strDescriptionEN,
            country: team.strCountry, logo: team.strLogo, banner: team.strBanner, jersey: team.strJersey,
          },
        });
        saved++;
      }
    } catch (err) {
      log(`⚠️  ${league.name} teams failed: ${err}`);
    }
    await delay(500);
  }

  log(`✓ Teams: ${saved} saved, ${failed} failed`);
  totalSaved += saved;
  return { saved, failed };
}

// ─── RSS News ──────────────────────────────────────────────────────────────

async function ingestRssNews() {
  log('📰 Ingesting sports news from RSS feeds...');
  let saved = 0, failed = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Sportivo/1.0' },
      });
      if (!response.ok) {
        log(`⚠️  RSS ${feed.source}: HTTP ${response.status}`);
        continue;
      }
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const itemXml of items) {
        const title = stripCdata(itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || '');
        const link = stripCdata(itemXml.match(/<link>(.*?)<\/link>/i)?.[1] 
          || itemXml.match(/<guid[^>]*>(.*?)<\/guid>/i)?.[1] 
          || '');
        const desc = stripCdata(itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || '');
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] 
          || new Date().toISOString();
        const imgMatch = desc.match(/src="([^"]+)"/i);
        const image = imgMatch?.[1] || null;
        const cleanDesc = desc.replace(/<[^>]*>/g, '').substring(0, 500);

        if (!title || !link) continue;

        await prisma.cachedNews.upsert({
          where: { id: link },
          update: { title, description: cleanDesc, image, publishedAt: new Date(pubDate), updatedAt: new Date() },
          create: { id: link, title, description: cleanDesc, image, url: link, source: feed.source, query: feed.category, publishedAt: new Date(pubDate) },
        });
        saved++;
      }
    } catch (err) {
      log(`⚠️  RSS ${feed.source} failed: ${err}`);
    }
  }

  log(`✓ News: ${saved} saved, ${failed} failed`);
  totalSaved += saved;
  return { saved, failed };
}

// ─── Match Reports ─────────────────────────────────────────────────────────

async function generateMatchReports() {
  log('📝 Generating match reports from recent scores...');
  let saved = 0, failed = 0;

  try {
    const recentMatches = await prisma.cachedMatch.findMany({
      where: { 
        type: 'score', 
        homeScore: { not: null },
        awayScore: { not: null },
        status: { in: ['FT', 'Match Finished'] }
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    for (const match of recentMatches) {
      const homeScore = match.homeScore || '0';
      const awayScore = match.awayScore || '0';
      const slug = `match-report-${match.id}`;
      let result = 'draw';
      if (parseInt(homeScore) > parseInt(awayScore)) result = 'home-win';
      else if (parseInt(awayScore) > parseInt(homeScore)) result = 'away-win';

      const headlines: Record<string, string> = {
        'home-win': `${match.homeTeamName} Secure Victory Over ${match.awayTeamName}`,
        'away-win': `${match.awayTeamName} Triumph Away at ${match.homeTeamName}`,
        'draw': `${match.homeTeamName} and ${match.awayTeamName} Battle to a Draw`,
      };

      const existingArticle = await prisma.article.findUnique({ where: { slug } });
      if (!existingArticle) {
        await prisma.article.create({
          data: {
            title: headlines[result],
            slug,
            content: `# ${headlines[result]}\n\n## Match Summary\n\n${match.homeTeamName} faced ${match.awayTeamName} in an exciting ${match.leagueName} encounter that ended ${homeScore}-${awayScore}.\n\n## Key Moments\n\n- **Full Time Score:** ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName}\n- **Competition:** ${match.leagueName}\n- **Date:** ${match.date}\n\n## Match Report\n\nThe match between ${match.homeTeamName} and ${match.awayTeamName} provided plenty of action for the fans. Stay tuned for more detailed analysis and post-match coverage.\n\n*This is an automatically generated match report based on live match data.*`,
            excerpt: `Match Report: ${match.homeTeamName} ${homeScore}-${awayScore} ${match.awayTeamName}`,
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
    }
  } catch (err) {
    log(`⚠️  Match report generation failed: ${err}`);
  }

  log(`✓ Match Reports: ${saved} saved, ${failed} failed`);
  totalSaved += saved;
  return { saved, failed };
}

// ─── Cache Metadata ────────────────────────────────────────────────────────

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

// ─── Main Orchestrator ─────────────────────────────────────────────────────

export async function runBackgroundIngestion() {
  totalSaved = 0;

  log('┌─────────────────────────────────────────────┐');
  log('│   SPORTIVO DATA INGESTION (Server-Triggered)  │');
  log('└─────────────────────────────────────────────┘');

  try {
    const standings = await ingestStandings();
    const teams = await ingestTeams();
    const sports = await ingestScores();
    const news = await ingestRssNews();
    const matchReports = await generateMatchReports();
    
    await updateCacheMetadata();

    log('\n═══════════════════════════════════════════════════════════════');
    log('📊 INGESTION SUMMARY');
    log('═══════════════════════════════════════════════════════════════');
    log(`  Sports Scores/Fixtures:  ${sports.saved} saved, ${sports.failed} failed`);
    log(`  Standings:               ${standings.saved} saved, ${standings.failed} failed`);
    log(`  Teams:                   ${teams.saved} saved, ${teams.failed} failed`);
    log(`  RSS News:                ${news.saved} saved, ${news.failed} failed`);
    log(`  Match Reports:           ${matchReports.saved} saved, ${matchReports.failed} failed`);
    log(`  TOTAL:                   ${totalSaved} records saved`);
    log('═══════════════════════════════════════════════════════════════');
  } catch (err) {
    log(`❌ Ingestion error: ${err}`);
  }
}
