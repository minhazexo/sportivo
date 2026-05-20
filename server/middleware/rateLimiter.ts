import type { Request, Response, NextFunction } from "express";
import type { RateLimitRecord } from "../types";

// ----------------------------------------------------
// Advanced Rate Limiting Store & Configuration
// ----------------------------------------------------
const generalRateLimitStore = new Map<string, RateLimitRecord>();
const strictRateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  strict?: boolean;
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const authHeader = req.headers.authorization;
    let userId: string | undefined;

    // Try to extract userId from JWT header for user/session rate limiting
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.includes('.')) {
        try {
          const parts = token.split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          userId = payload.sub;
        } catch {
          // Ignore parse errors, fallback to IP
        }
      } else {
        userId = token; // Direct UID in development
      }
    }

    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const now = Date.now();
    const store = options.strict ? strictRateLimitStore : generalRateLimitStore;

    let record = store.get(key);

    // If blocked, check if block period has expired
    if (record?.blockedUntil && now < record.blockedUntil) {
      const remainingBlockTime = Math.ceil((record.blockedUntil - now) / 1000);
      console.warn(`[Security Alert] Rate limit abuse blocked for key: ${key}. IP: ${ip}. Blocked for ${remainingBlockTime}s.`);
      res.setHeader('Retry-After', remainingBlockTime.toString());
      return res.status(429).json({
        error: 'Too many requests.',
        message: `${options.message} You are temporarily blocked. Please try again in ${remainingBlockTime} seconds.`,
      });
    }

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      store.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, options.max - record.count);
    res.setHeader('X-RateLimit-Limit', options.max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    if (record.count > options.max) {
      // Trigger a block period on excessive flooding (e.g. 5 minutes block)
      const isFlooding = record.count > options.max * 2.5;
      if (isFlooding) {
        record.blockedUntil = now + 5 * 60 * 1000; // 5 minutes block
        console.warn(`[Security Alert] Key ${key} (IP: ${ip}) detected flooding. Count: ${record.count}. Blocking for 5 minutes.`);
      } else {
        console.warn(`[Security Warning] Key ${key} (IP: ${ip}) exceeded rate limit. Count: ${record.count}`);
      }

      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString());
      return res.status(429).json({
        error: 'Too many requests.',
        message: options.message,
      });
    }

    next();
  };
}
