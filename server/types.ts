import type { Request } from "express";

// ----------------------------------------------------
// Rate Limiting Types
// ----------------------------------------------------
export interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// ----------------------------------------------------
// Auth Types
// ----------------------------------------------------
export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
