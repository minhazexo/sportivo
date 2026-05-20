import type { Express, Response } from "express";
import prisma from "../../src/lib/prisma";
import { createRateLimiter } from "../middleware/rateLimiter";
import { sanitizeString } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";
import {
  hashPassword,
  createSessionToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markResetTokenUsed,
} from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

export function registerAuthRoutes(app: Express) {
  // Auth: Register (Neon Database-First)
  app.post("/api/auth/register", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, strict: true, message: "Too many registrations" }), async (req, res) => {
    const { email, password, displayName, photoURL } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashPassword(password),
          displayName: displayName ? sanitizeString(displayName) : null,
          photoURL: photoURL ? String(photoURL) : null,
          role: 'user',
          preferences: {
            create: {}
          }
        }
      });

      const token = createSessionToken(newUser.id);
      const refreshToken = await createRefreshToken(newUser.id);
      res.json({
        token,
        refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          photoURL: newUser.photoURL,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("❌ Registration failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50, strict: true, message: "Too many login attempts" }), async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (!user || !user.password || user.password !== hashPassword(password)) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const token = createSessionToken(user.id);
      const refreshToken = await createRefreshToken(user.id);
      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: user.role
        }
      });
    } catch (error) {
      console.error("❌ Login failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // Auth: Verify Token
  app.get("/api/auth/verify-token", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      valid: true,
      user: {
        id: req.user!.uid,
        email: req.user!.email,
        displayName: req.user!.name,
        photoURL: req.user!.picture,
        role: req.user!.role
      }
    });
  });

  // Auth: Refresh Token
  app.post("/api/auth/refresh", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, strict: true, message: "Too many refresh requests" }), async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    try {
      const userId = await verifyRefreshToken(refreshToken);
      if (!userId) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      await revokeRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const token = createSessionToken(user.id);
      const newRefreshToken = await createRefreshToken(user.id);

      res.json({
        token,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: user.role
        }
      });
    } catch (error) {
      console.error("❌ Token refresh failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  // Auth: Forgot Password
  app.post("/api/auth/forgot-password", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, strict: true, message: "Too many password reset requests" }), async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user) {
        const resetToken = await generatePasswordResetToken(cleanEmail);
        const resetUrl = `${process.env.VITE_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        console.log(`\n🔐 Password Reset Link (dev mode):\n   ${resetUrl}\n`);
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("❌ Forgot password failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Auth: Reset Password
  app.post("/api/auth/reset-password", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, strict: true, message: "Too many password reset attempts" }), async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
      const email = await verifyPasswordResetToken(token);
      if (!email) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      await prisma.user.update({
        where: { email },
        data: { password: hashPassword(password) }
      });

      await markResetTokenUsed(token);

      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await revokeAllUserRefreshTokens(user.id);
      }

      res.json({ message: "Password has been reset successfully. Please log in with your new password." });
    } catch (error) {
      console.error("❌ Reset password failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}
