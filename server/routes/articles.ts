import type { Express, Response } from "express";
import prisma from "../../src/lib/prisma";
import { createRateLimiter } from "../middleware/rateLimiter";
import { sanitizeString, validateSlug, validateId } from "../middleware/validation";
import { requireAdmin } from "../middleware/auth";
import { getArticles, getArticleBySlug } from "../../src/lib/articles";
import type { AuthenticatedRequest } from "../types";

export function registerArticleRoutes(app: Express) {
  // List Articles
  app.get("/api/articles", async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const articles = await getArticles(status);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Get Article by Slug
  app.get("/api/articles/:slug", async (req, res) => {
    const { slug } = req.params;
    if (!slug || !validateSlug(slug)) {
      return res.status(400).json({ error: "Invalid article slug format" });
    }
    try {
      const article = await getArticleBySlug(slug);
      if (!article) return res.status(404).json({ error: "Article not found" });

      // Asynchronously update views
      prisma.article.update({
        where: { slug },
        data: { views: { increment: 1 } }
      }).catch(e => console.error('[Views] Failed to increment view count:', e));

      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article details" });
    }
  });

  // Get Article by ID
  app.get("/api/articles/id/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || !validateId(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    try {
      const article = await prisma.article.findUnique({ where: { id } });
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article details" });
    }
  });

  // Create Article (Admin only)
  app.post("/api/articles", requireAdmin, createRateLimiter({ windowMs: 60000, max: 5, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res: Response) => {
    const { title, content, excerpt, category, thumbnail, tags, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const cleanTitle = sanitizeString(title);
    const generatedSlug = cleanTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    try {
      const article = await prisma.article.create({
        data: {
          title: cleanTitle,
          slug: generatedSlug,
          content: content,
          excerpt: excerpt ? sanitizeString(excerpt) : null,
          category: category ? sanitizeString(category) : null,
          thumbnail: thumbnail ? String(thumbnail) : null,
          tags: Array.isArray(tags) ? tags.map(sanitizeString) : [],
          status: status === 'published' ? 'published' : 'draft',
          publishedAt: status === 'published' ? new Date() : null,
          authorId: req.user!.uid,
          authorName: req.user!.name || 'Administrator',
        }
      });
      res.json(article);
    } catch (error) {
      console.error(`❌ Article creation failed`, error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  // Update Article (Admin only)
  app.put("/api/articles/:id", requireAdmin, createRateLimiter({ windowMs: 60000, max: 10, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || !validateId(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    const { title, content, excerpt, category, thumbnail, tags, status } = req.body;
    try {
      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Article not found" });

      const article = await prisma.article.update({
        where: { id },
        data: {
          title: title ? sanitizeString(title) : undefined,
          content: content || undefined,
          excerpt: excerpt !== undefined ? sanitizeString(excerpt) : undefined,
          category: category !== undefined ? sanitizeString(category) : undefined,
          thumbnail: thumbnail !== undefined ? String(thumbnail) : undefined,
          tags: Array.isArray(tags) ? tags.map(sanitizeString) : undefined,
          status: status !== undefined ? (status === 'published' ? 'published' : 'draft') : undefined,
          publishedAt: status === 'published' && !existing.publishedAt ? new Date() : undefined,
        }
      });
      res.json(article);
    } catch (error) {
      console.error(`❌ Article update failed`, error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  // Delete Article (Admin only)
  app.delete("/api/articles/:id", requireAdmin, createRateLimiter({ windowMs: 60000, max: 5, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || !validateId(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    try {
      await prisma.article.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });
}
