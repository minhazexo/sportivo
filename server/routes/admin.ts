import type { Express, Response } from "express";
import prisma from "../../src/lib/prisma";
import { createRateLimiter } from "../middleware/rateLimiter";
import { sanitizeString } from "../middleware/validation";
import { requireAdmin } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";
import { runBackgroundIngestion } from "./ingestion";

// Cast for models not yet in Prisma schema
const db = prisma as any;

const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

export function registerAdminRoutes(app: Express) {
  // Admin User Management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (error) {
      log("❌ Failed to fetch users for admin", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id/role", requireAdmin, createRateLimiter({ windowMs: 60000, max: 20, strict: true, message: "Too many role actions" }), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (role !== 'user' && role !== 'admin' && role !== 'editor') {
      return res.status(400).json({ error: "Invalid role value" });
    }
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { role }
      });
      res.json(user);
    } catch (error) {
      log("❌ Failed to update user role", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, createRateLimiter({ windowMs: 60000, max: 10, strict: true, message: "Too many user actions" }), async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      await prisma.user.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      log("❌ Failed to delete user", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let config = await db.siteConfig.findUnique({
        where: { id: 'default' }
      });
      if (!config) {
        config = await db.siteConfig.create({
          data: { id: 'default' }
        });
      }

      const adminProfile = await prisma.user.findUnique({
        where: { id: req.user!.uid },
        select: {
          id: true,
          email: true,
          displayName: true,
          photoURL: true,
        }
      });

      res.json({
        siteConfig: config,
        adminProfile
      });
    } catch (error) {
      log("❌ Failed to fetch settings", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", requireAdmin, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many settings updates" }), async (req: AuthenticatedRequest, res: Response) => {
    const { siteName, siteDescription, socialTwitter, socialFacebook, socialInstagram, contactEmail } = req.body;
    try {
      const config = await db.siteConfig.upsert({
        where: { id: 'default' },
        update: {
          siteName: siteName !== undefined ? sanitizeString(siteName) : undefined,
          siteDescription: siteDescription !== undefined ? sanitizeString(siteDescription) : undefined,
          socialTwitter: socialTwitter !== undefined ? String(socialTwitter) : undefined,
          socialFacebook: socialFacebook !== undefined ? String(socialFacebook) : undefined,
          socialInstagram: socialInstagram !== undefined ? String(socialInstagram) : undefined,
          contactEmail: contactEmail !== undefined ? String(contactEmail) : undefined,
        },
        create: {
          id: 'default',
          siteName: siteName ? sanitizeString(siteName) : 'Sportivo',
          siteDescription: siteDescription ? sanitizeString(siteDescription) : undefined,
          socialTwitter: socialTwitter ? String(socialTwitter) : undefined,
          socialFacebook: socialFacebook ? String(socialFacebook) : undefined,
          socialInstagram: socialInstagram ? String(socialInstagram) : undefined,
          contactEmail: contactEmail ? String(contactEmail) : undefined,
        }
      });
      res.json(config);
    } catch (error) {
      log("❌ Failed to update settings", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Admin API Status
  app.get("/api/admin/settings/api-status", requireAdmin, async (req, res) => {
    try {
      res.json({
        gemini: !!process.env.GEMINI_API_KEY,
        newsapi: !!process.env.NEWSAPI_API_KEY,
        apiFootball: !!process.env.VITE_API_FOOTBALL_KEY,
        sportmonks: !!process.env.VITE_SPORTMONKS_TOKEN,
        googleAnalytics: !!process.env.VITE_GA_MEASUREMENT_ID,
        googleAdsense: !!process.env.VITE_ADSENSE_CLIENT,
        siteUrl: process.env.VITE_SITE_URL || 'http://localhost:3000',
        appUrl: process.env.APP_URL || 'http://localhost:3000',
      });
    } catch (error) {
      log("❌ Failed to fetch API status", error);
      res.status(500).json({ error: "Failed to fetch API status" });
    }
  });

  // Data Ingestion Endpoint (Admin only)
  app.post("/api/admin/ingest", requireAdmin, createRateLimiter({ windowMs: 5 * 60 * 1000, max: 3, strict: true, message: "Too many ingestion requests. Please wait 5 minutes between runs." }), async (req: AuthenticatedRequest, res: Response) => {
    log('🚀 Manual data ingestion triggered by admin:', req.user?.email);
    
    res.json({ status: 'started', message: 'Data ingestion started. Check server logs for progress.' });

    runBackgroundIngestion();
  });

  // Database Statistics Endpoint (Admin only)
  app.get("/api/admin/db-stats", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        articles,
        users,
        cachedMatches,
        cachedTeams,
        cachedStandings,
        cachedNews,
        scoresLastIngested,
        fixturesLastIngested,
        standingsLastIngested,
        teamsLastIngested,
        newsLastIngested,
      ] = await Promise.all([
        prisma.article.count(),
        prisma.user.count(),
        prisma.cachedMatch.count(),
        prisma.cachedTeam.count(),
        prisma.cachedStanding.count(),
        prisma.cachedNews.count(),
        prisma.cacheMetadata.findUnique({ where: { key: 'scores:last_ingested' } }),
        prisma.cacheMetadata.findUnique({ where: { key: 'fixtures:last_ingested' } }),
        prisma.cacheMetadata.findUnique({ where: { key: 'standings:last_ingested' } }),
        prisma.cacheMetadata.findUnique({ where: { key: 'teams:last_ingested' } }),
        prisma.cacheMetadata.findUnique({ where: { key: 'news:last_ingested' } }),
      ]);

      res.json({
        counts: {
          articles,
          users,
          scoresFixtures: cachedMatches,
          teams: cachedTeams,
          standings: cachedStandings,
          news: cachedNews,
        },
        lastIngested: {
          scores: scoresLastIngested?.updatedAt || null,
          fixtures: fixturesLastIngested?.updatedAt || null,
          standings: standingsLastIngested?.updatedAt || null,
          teams: teamsLastIngested?.updatedAt || null,
          news: newsLastIngested?.updatedAt || null,
        },
      });
    } catch (error) {
      log("❌ Failed to fetch DB stats", error);
      res.status(500).json({ error: "Failed to fetch database statistics" });
    }
  });
}
