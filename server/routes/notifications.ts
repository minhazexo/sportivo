import type { Express, Response } from "express";
import prisma from "../../src/lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sanitizeString, validateId } from "../middleware/validation";
import type { AuthenticatedRequest } from "../types";

export function registerNotificationRoutes(app: Express) {
  // Get Notifications
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.uid },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark Notification as Read
  app.put("/api/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id || !validateId(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }
    try {
      await prisma.notification.updateMany({
        where: { id, userId: req.user!.uid },
        data: { read: true }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark All Notifications as Read
  app.put("/api/notifications/read-all", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.uid, read: false },
        data: { read: true }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Create Notification
  app.post("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { type, title, message, link } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: req.user!.uid,
          type: sanitizeString(type),
          title: sanitizeString(title),
          message: sanitizeString(message),
          link: link ? String(link) : null
        }
      });
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Notification Preferences
  app.get("/api/notifications/preferences", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let prefs = await prisma.notificationPreference.findUnique({
        where: { userId: req.user!.uid }
      });
      if (!prefs) {
        prefs = await prisma.notificationPreference.create({
          data: { userId: req.user!.uid }
        });
      }
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  app.put("/api/notifications/preferences", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { matchStartReminders, teamNewsUpdates, articleAlerts, systemNotifications } = req.body;
    try {
      const prefs = await prisma.notificationPreference.upsert({
        where: { userId: req.user!.uid },
        update: {
          matchStartReminders: matchStartReminders !== undefined ? !!matchStartReminders : undefined,
          teamNewsUpdates: teamNewsUpdates !== undefined ? !!teamNewsUpdates : undefined,
          articleAlerts: articleAlerts !== undefined ? !!articleAlerts : undefined,
          systemNotifications: systemNotifications !== undefined ? !!systemNotifications : undefined,
        },
        create: {
          userId: req.user!.uid,
          matchStartReminders: matchStartReminders !== undefined ? !!matchStartReminders : true,
          teamNewsUpdates: teamNewsUpdates !== undefined ? !!teamNewsUpdates : true,
          articleAlerts: articleAlerts !== undefined ? !!articleAlerts : true,
          systemNotifications: systemNotifications !== undefined ? !!systemNotifications : true,
        }
      });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });
}
