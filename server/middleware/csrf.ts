import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// ----------------------------------------------------
// CSRF token generation and validation
// ----------------------------------------------------
const csrfTokens = new Map<string, number>();
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

export function generateCsrfToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now());
  return token;
}

function validateCsrfToken(token: string): boolean {
  if (!token) return false;
  const timestamp = csrfTokens.get(token);
  if (!timestamp) return false;
  if (Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Exempt public authentication endpoints from CSRF check
  if (
    req.path.includes('/auth/login') || 
    req.path.includes('/auth/register') ||
    req.path.includes('/auth/verify-token') ||
    req.path.includes('/auth/refresh') ||
    req.path.includes('/auth/forgot-password') ||
    req.path.includes('/auth/reset-password') ||
    (req.originalUrl && (req.originalUrl.includes('/auth/login') || req.originalUrl.includes('/auth/register') || req.originalUrl.includes('/auth/verify-token') || req.originalUrl.includes('/auth/refresh') || req.originalUrl.includes('/auth/forgot-password') || req.originalUrl.includes('/auth/reset-password')))
  ) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  if (!validateCsrfToken(token)) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  next();
}

// Clean expired CSRF tokens periodically
export function startCsrfCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [token, timestamp] of csrfTokens.entries()) {
      if (now - timestamp > CSRF_TOKEN_EXPIRY) {
        csrfTokens.delete(token);
      }
    }
  }, 60000);
}
