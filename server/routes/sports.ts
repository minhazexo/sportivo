import type { Express } from "express";
import prisma from "../../src/lib/prisma";
import { createRateLimiter } from "../middleware/rateLimiter";
import { LEAGUE_META } from "../config";
import { mapDbMatchToApi, mapDbTeamToApi, mapDbStandingToApi, mapDbNewsToApi } from "../mappers";

const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

export function registerSportsRoutes(app: Express) {
  // scores endpoint (caching TTL: 5 minutes)
  app.get("/api/sports/scores", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many scores requests" }), async (req, res) => {
    const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
    
    if (league && (typeof league !== 'string' || !/^\d+$/.test(league))) {
      return res.status(400).json({ error: "League ID must be a numeric value" });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const isToday = !league || league === 'undefined' || league === '';
    
    try {
      const matches = isToday
        ? await prisma.cachedMatch.findMany({ where: { date: today, type: 'score' } })
        : await prisma.cachedMatch.findMany({ where: { leagueId: league as string, type: 'score' } });
      
      res.json({ events: matches.map(m => mapDbMatchToApi(m)) });
    } catch (error) {
      log(`❌ Scores fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  // teams endpoint (caching TTL: 24 hours)
  app.get("/api/sports/teams/:league", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many team requests" }), async (req, res) => {
    const { league } = req.params;
    if (!league || typeof league !== 'string' || league.length > 100) {
      return res.status(400).json({ error: "Invalid league parameter" });
    }

    try {
      const teams = await prisma.cachedTeam.findMany({
        where: {
          OR: [
            { league: { contains: league, mode: 'insensitive' } },
            { leagueId: league }
          ]
        }
      });

      res.json({ teams: teams.map(t => mapDbTeamToApi(t)) });
    } catch (error) {
      log(`❌ Teams fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // team search endpoint (TTL: 24 hours)
  app.get("/api/sports/search-teams", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 150, message: "Too many search requests" }), async (req, res) => {
    const q = Array.isArray(req.query.t) ? req.query.t[0] : req.query.t;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter `t` is required' });
    }

    try {
      const teams = await prisma.cachedTeam.findMany({
        where: { name: { contains: q, mode: 'insensitive' } }
      });

      res.json({ teams: teams.map(t => mapDbTeamToApi(t)) });
    } catch (error) {
      log(`❌ Team search failed`, error);
      res.status(500).json({ error: "Failed to search teams" });
    }
  });

  // fixtures endpoint (caching TTL: 1 hour)
  app.get("/api/sports/fixtures", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many fixtures requests" }), async (req, res) => {
    const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
    
    if (league && (typeof league !== 'string' || !/^\d+$/.test(league))) {
      return res.status(400).json({ error: "League ID must be a numeric value" });
    }

    const leagueId = league || 'unknown';

    try {
      const matches = await prisma.cachedMatch.findMany({
        where: { leagueId: leagueId, type: 'fixture' }
      });

      res.json({ events: matches.map(m => mapDbMatchToApi(m)) });
    } catch (error) {
      log(`❌ Fixtures fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch fixtures" });
    }
  });

  // standings endpoint (caching TTL: 6 hours)
  app.get("/api/sports/standings", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many standings requests" }), async (req, res) => {
    const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
    if (!league || typeof league !== 'string' || !/^\d+$/.test(league)) {
      return res.status(400).json({ error: "Numeric League ID is required" });
    }

    try {
      const standings = await prisma.cachedStanding.findMany({
        where: { leagueId: league },
        orderBy: { rank: 'asc' }
      });

      res.json(mapDbStandingToApi(standings));
    } catch (error) {
      log(`❌ Standings fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  });

  // leagues endpoint — aggregates league data from all cached tables
  app.get("/api/leagues", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100, message: "Too many league requests" }), async (req, res) => {
    try {
      const [matchLeagues, standingLeagues, teamLeagues] = await Promise.all([
        prisma.cachedMatch.groupBy({
          by: ['leagueId', 'leagueName', 'sport'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        prisma.cachedStanding.groupBy({
          by: ['leagueId'],
          _count: { teamId: true },
        }),
        prisma.cachedTeam.groupBy({
          by: ['leagueId', 'league', 'sport'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      const leagueMap = new Map<string, {
        id: string;
        name: string;
        sport: string;
        matchCount: number;
        teamCount: number;
        hasStandings: boolean;
      }>();

      for (const ml of matchLeagues) {
        leagueMap.set(ml.leagueId, {
          id: ml.leagueId,
          name: ml.leagueName,
          sport: ml.sport || 'Soccer',
          matchCount: ml._count.id,
          teamCount: 0,
          hasStandings: false,
        });
      }

      for (const sl of standingLeagues) {
        const existing = leagueMap.get(sl.leagueId);
        if (existing) {
          existing.hasStandings = true;
        } else {
          leagueMap.set(sl.leagueId, {
            id: sl.leagueId,
            name: '',
            sport: 'Soccer',
            matchCount: 0,
            teamCount: 0,
            hasStandings: true,
          });
        }
      }

      for (const tl of teamLeagues) {
        if (!tl.leagueId) continue;
        const existing = leagueMap.get(tl.leagueId);
        if (existing) {
          existing.teamCount = tl._count.id;
          if (!existing.name) existing.name = tl.league || '';
        } else {
          leagueMap.set(tl.leagueId, {
            id: tl.leagueId,
            name: tl.league || '',
            sport: tl.sport || 'Sport',
            matchCount: 0,
            teamCount: tl._count.id,
            hasStandings: false,
          });
        }
      }

      const knownLeagueIds = new Set(Object.keys(LEAGUE_META));

      for (const [lid, meta] of Object.entries(LEAGUE_META)) {
        if (!leagueMap.has(lid)) {
          leagueMap.set(lid, {
            id: lid,
            name: meta.displayName,
            sport: meta.sport,
            matchCount: 0,
            teamCount: 0,
            hasStandings: false,
          });
        }
      }

      const leagues = Array.from(leagueMap.values())
        .map(l => ({
          ...l,
          displayName: LEAGUE_META[l.id]?.displayName || l.name,
          country: LEAGUE_META[l.id]?.country || '',
        }))
        .sort((a, b) => {
          const aScore = (a.matchCount > 0 ? 1 : 0) + (a.teamCount > 0 ? 1 : 0) + (a.hasStandings ? 1 : 0);
          const bScore = (b.matchCount > 0 ? 1 : 0) + (b.teamCount > 0 ? 1 : 0) + (b.hasStandings ? 1 : 0);
          if (aScore !== bScore) return bScore - aScore;
          return a.displayName.localeCompare(b.displayName);
        });

      res.json({ leagues });
    } catch (error) {
      log('❌ Leagues fetch failed', error);
      res.status(500).json({ error: 'Failed to fetch leagues' });
    }
  });

  // team detail endpoint (caching TTL: 24 hours)
  app.get("/api/sports/team/:id", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many team requests" }), async (req, res) => {
    const { id } = req.params;
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid numeric team ID" });
    }

    try {
      const team = await prisma.cachedTeam.findUnique({ where: { id } });
      res.json({ teams: team ? [mapDbTeamToApi(team)] : [] });
    } catch (error) {
      log(`❌ Team fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // team events endpoint (caching TTL: 1 hour)
  app.get("/api/sports/team/:id/events", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 150, message: "Too many team events requests" }), async (req, res) => {
    const { id } = req.params;
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid numeric team ID" });
    }

    try {
      const matches = await prisma.cachedMatch.findMany({
        where: {
          OR: [
            { homeTeamId: id },
            { awayTeamId: id }
          ],
          type: 'score'
        },
        take: 20
      });

      res.json({ events: matches.map(m => mapDbMatchToApi(m)) });
    } catch (error) {
      log(`❌ Team events fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch team events" });
    }
  });

  // match detail endpoint (caching TTL: 5 minutes)
  app.get("/api/sports/match/:id", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many match requests" }), async (req, res) => {
    const { id } = req.params;
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid numeric match ID" });
    }

    try {
      const match = await prisma.cachedMatch.findUnique({ where: { id } });
      res.json({ events: match ? [mapDbMatchToApi(match)] : [] });
    } catch (error) {
      log(`❌ Match fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch match" });
    }
  });

  // world-cup-news endpoint — fetches FIFA World Cup specific trending news
  app.get("/api/sports/world-cup-news", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many news requests" }), async (req, res) => {
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = typeof limitParam === 'string' ? limitParam : '20';

    if (!/^\d+$/.test(limit) || parseInt(limit) < 1 || parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit must be a number between 1 and 100' });
    }

    try {
      const worldCupKeywords = ['world cup', 'fifa world cup', 'world cup 2026', 'fifa world cup qualifiers', 'world cup qualifying', 'world cup qualification'];

      // Build a flat array of where clauses for Prisma
      const whereClauses: any[] = [
        { query: { in: ['world-cup', 'World Cup', 'WorldCup'] } },
        { source: 'FIFA' },
      ];

      for (const keyword of worldCupKeywords) {
        whereClauses.push({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { description: { contains: keyword, mode: 'insensitive' as const } },
          ]
        });
      }

      const newsArticles = await prisma.cachedNews.findMany({
        where: { OR: whereClauses },
        orderBy: { publishedAt: 'desc' },
        take: parseInt(limit)
      });

      res.json({
        status: 'ok',
        totalArticles: newsArticles.length,
        articles: newsArticles.map(n => mapDbNewsToApi(n))
      });
    } catch (error) {
      log(`❌ World Cup news fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch World Cup news" });
    }
  });

  // news endpoint (caching TTL: 1 hour)
  app.get("/api/sports/news", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many news requests" }), async (req, res) => {
    const qParam = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const q = typeof qParam === 'string' ? qParam : 'sports';
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = typeof limitParam === 'string' ? limitParam : '10';

    if (q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    if (!/^\d+$/.test(limit) || parseInt(limit) < 1 || parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit must be a number between 1 and 100' });
    }

    try {
      const searchTerm = q.toLowerCase().trim();
      const newsArticles = await prisma.cachedNews.findMany({
        where: {
          OR: [
            { query: { contains: searchTerm, mode: 'insensitive' } },
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { source: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        orderBy: { publishedAt: 'desc' },
        take: parseInt(limit)
      });

      res.json({
        status: 'ok',
        totalArticles: newsArticles.length,
        articles: newsArticles.map(n => mapDbNewsToApi(n))
      });
    } catch (error) {
      log(`❌ News fetch failed`, error);
      res.status(500).json({ error: "Failed to fetch sports news" });
    }
  });
}
