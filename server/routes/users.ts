import type { Express, Response } from "express";
import prisma from "../../src/lib/prisma";
import { createRateLimiter } from "../middleware/rateLimiter";
import { sanitizeString, validateId } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

export function registerUserRoutes(app: Express) {
  // User Profile Fetch/Sync
  app.get("/api/users/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      let user = await prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: req.user!.email,
            displayName: req.user!.name || null,
            photoURL: req.user!.picture || null,
            preferences: {
              create: {}
            }
          },
          include: { preferences: true }
        });
      }
      res.json(user);
    } catch (error) {
      console.error(`❌ Profile sync failed`, error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // User Profile Update
  app.post("/api/users/profile", requireAuth, createRateLimiter({ windowMs: 1 * 60 * 1000, max: 10, strict: true, message: "Too many profile updates" }), async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, photoURL } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.uid },
        data: {
          displayName: displayName ? sanitizeString(displayName) : undefined,
          photoURL: photoURL ? String(photoURL) : undefined
        }
      });
      res.json(user);
    } catch (error) {
      console.error(`❌ Profile update failed`, error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Bookmarks Endpoints
  app.get("/api/users/bookmarks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.uid }
      });
      res.json({ bookmarks: user?.bookmarkedArticles || [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/users/bookmarks", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many bookmark adjustments" }), async (req: AuthenticatedRequest, res: Response) => {
    const { articleId } = req.body;
    if (!articleId || !validateId(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const bookmarks = user.bookmarkedArticles || [];
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId);
        await prisma.user.update({
          where: { id: req.user!.uid },
          data: { bookmarkedArticles: bookmarks }
        });
      }
      res.json({ bookmarks });
    } catch (error) {
      res.status(500).json({ error: "Failed to add bookmark" });
    }
  });

  app.delete("/api/users/bookmarks/:id", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many bookmark adjustments" }), async (req: AuthenticatedRequest, res: Response) => {
    const articleId = req.params.id;
    if (!articleId || !validateId(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const bookmarks = (user.bookmarkedArticles || []).filter(id => id !== articleId);
      await prisma.user.update({
        where: { id: req.user!.uid },
        data: { bookmarkedArticles: bookmarks }
      });
      res.json({ bookmarks });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Favorite Teams Endpoints
  app.get("/api/users/favorite-teams", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.uid }
      });
      res.json({ favoriteTeams: user?.favoriteTeams || [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorite teams" });
    }
  });

  app.post("/api/users/favorite-teams", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many team adjustments" }), async (req: AuthenticatedRequest, res: Response) => {
    const { teamId } = req.body;
    if (!teamId || !validateId(teamId)) {
      return res.status(400).json({ error: "Invalid team ID" });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const teams = user.favoriteTeams || [];
      if (!teams.includes(teamId)) {
        teams.push(teamId);
        await prisma.user.update({
          where: { id: req.user!.uid },
          data: { favoriteTeams: teams }
        });
      }
      res.json({ favoriteTeams: teams });
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite team" });
    }
  });

  app.delete("/api/users/favorite-teams/:id", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many team adjustments" }), async (req: AuthenticatedRequest, res: Response) => {
    const teamId = req.params.id;
    if (!teamId || !validateId(teamId)) {
      return res.status(400).json({ error: "Invalid team ID" });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const teams = (user.favoriteTeams || []).filter(id => id !== teamId);
      await prisma.user.update({
        where: { id: req.user!.uid },
        data: { favoriteTeams: teams }
      });
      res.json({ favoriteTeams: teams });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete favorite team" });
    }
  });
}
