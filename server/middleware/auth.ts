import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import prisma from "../../src/lib/prisma";
import { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_MS, PASSWORD_RESET_EXPIRES_MS } from "../config";
import type { AuthenticatedRequest, AuthenticatedUser } from "../types";

// ----------------------------------------------------
// Password Helpers
// ----------------------------------------------------
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'sportivo_db_salt').digest('hex');
}

export function createSessionToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded.sub || null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Refresh Token Helpers
// ----------------------------------------------------
export async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    }
  });
  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return null;
    }
    return record.userId;
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ----------------------------------------------------
// Password Reset Token Helpers
// ----------------------------------------------------
export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      token,
      email,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS),
    }
  });
  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return null;
    }
    return record.email;
  } catch {
    return null;
  }
}

export async function markResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true }
  });
}

// ----------------------------------------------------
// Auth Middleware
// ----------------------------------------------------
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Dev mode direct UID fallback if not a signed session token
  if (process.env.NODE_ENV !== 'production' && !token.includes('.')) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: token }
      });
      if (dbUser) {
        req.user = {
          uid: dbUser.id,
          email: dbUser.email,
          name: dbUser.displayName || 'Test User',
          picture: dbUser.photoURL || undefined,
          role: dbUser.role,
        };
        return next();
      }
    } catch {
      // Fallback below
    }

    req.user = {
      uid: token,
      email: `${token}@example.com`,
      name: 'Test User',
      role: 'admin', // Allow dev requests admin rights
    };
    return next();
  }

  const userId = verifySessionToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired authorization token' });
  }

  // Get user profile from Neon PostgreSQL
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!dbUser) {
      return res.status(401).json({ error: 'User account not found' });
    }
    
    req.user = {
      uid: dbUser.id,
      email: dbUser.email,
      name: dbUser.displayName || undefined,
      picture: dbUser.photoURL || undefined,
      role: dbUser.role,
    };
    next();
  } catch (error) {
    console.error('[Auth] Failed to fetch user in DB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}
