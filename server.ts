import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import prisma from "./src/lib/prisma";
import { getArticles, getArticleBySlug } from "./src/lib/articles";

// ----------------------------------------------------
// File Upload Configuration
// ----------------------------------------------------
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists at startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  log(`📁 Created uploads directory at ${UPLOADS_DIR}`);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMIT },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, SVG`));
    }
  },
});

dotenv.config();

const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

// ----------------------------------------------------
// Input Validation & Sanitization Helpers
// ----------------------------------------------------
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim(); // Remove basic HTML tags
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

function validateId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// ----------------------------------------------------
// Advanced Rate Limiting Store & Configuration
// ----------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const generalRateLimitStore = new Map<string, RateLimitRecord>();
const strictRateLimitStore = new Map<string, RateLimitRecord>();

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  strict?: boolean;
  message: string;
}) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// ----------------------------------------------------
// Database-First Authentication & JWT Helpers
// ----------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[Auth] WARNING: No JWT_SECRET in .env — using hardcoded fallback. Set JWT_SECRET for production security.');
  return "sportivo-neon-postgres-secret-key-987654321";
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

// ----------------------------------------------------
// Refresh Token Helpers
// ----------------------------------------------------
async function createRefreshToken(userId: string): Promise<string> {
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

async function verifyRefreshToken(token: string): Promise<string | null> {
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

async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ----------------------------------------------------
// Password Reset Token Helpers
// ----------------------------------------------------
async function generatePasswordResetToken(email: string): Promise<string> {
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

async function verifyPasswordResetToken(token: string): Promise<string | null> {
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

async function markResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true }
  });
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'sportivo_db_salt').digest('hex');
}

function createSessionToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifySessionToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded.sub || null;
  } catch {
    return null;
  }
}

interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  role: string;
}

interface AuthenticatedRequest extends express.Request {
  user?: AuthenticatedUser;
}

async function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Dev mode direct UID fallback if not a signed session token (keeps existing local tests happy)
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

function requireAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}

// ----------------------------------------------------
// CSRF token generation and validation
// ----------------------------------------------------
const csrfTokens = new Map<string, number>();
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

function generateCsrfToken(): string {
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

function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Exempt public authentication endpoints from CSRF check (unauthenticated entry points)
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
}  // Clean expired CSRF tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(token);
    }
  }
}, 60000); // Clean every minute

// ----------------------------------------------------
// RSS CDATA Cleanup Helper
// ----------------------------------------------------
function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
}

// ----------------------------------------------------
// File Upload Error Handler
// ----------------------------------------------------
function handleMulterError(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 5 MB." });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || "Upload failed" });
  }
  next();
}

// ----------------------------------------------------
// Mappers for Database to API Models
// ----------------------------------------------------

function mapDbMatchToApi(match: any) {
  return {
    idEvent: match.id,
    idLeague: match.leagueId,
    strLeague: match.leagueName,
    idHomeTeam: match.homeTeamId,
    idAwayTeam: match.awayTeamId,
    strHomeTeam: match.homeTeamName,
    strAwayTeam: match.awayTeamName,
    intHomeScore: match.homeScore,
    intAwayScore: match.awayScore,
    strStatus: match.status,
    dateEvent: match.date,
    strTime: match.time,
    strThumb: match.thumb,
    strVideo: match.video,
    strSport: match.sport,
  };
}

function mapDbTeamToApi(team: any) {
  return {
    idTeam: team.id,
    strTeam: team.name,
    strTeamShort: team.shortName,
    strTeamBadge: team.badge,
    strStadium: team.stadium,
    strLocation: team.stadiumLoc,
    strWebsite: team.website,
    strDescriptionEN: team.descriptionEN,
    intFormedYear: team.formedYear,
    strSport: team.sport,
    strLeague: team.league,
    idLeague: team.leagueId,
    strLogo: team.logo,
    strBanner: team.banner,
    strCountry: team.country,
  };
}

function mapDbStandingToApi(standings: any[]) {
  return {
    table: standings.map(row => ({
      idStanding: `${row.leagueId || 'league'}_${row.teamId}_${row.rank}`,
      idTeam: row.teamId,
      strTeam: row.teamName,
      strTeamName: row.teamName,
      strTeamBadge: row.teamBadge,
      team: {
        idTeam: row.teamId,
        strTeamName: row.teamName,
        strTeam: row.teamName,
        strTeamBadge: row.teamBadge,
      },
      intRank: String(row.rank),
      intPlayed: String(row.played),
      intWin: String(row.won),
      intDraw: String(row.drawn),
      intLoss: String(row.lost),
      intGoalsFor: String(row.goalsFor),
      intGoalsAgainst: String(row.goalsAgainst),
      intGoalDifference: String(row.goalsDifference),
      intPoints: String(row.points),
    })),
  };
}

function mapDbNewsToApi(news: any) {
  return {
    id: news.id,
    title: news.title,
    description: news.description,
    content: news.content,
    image: news.image,
    url: news.url,
    source: news.source,
    publishedAt: news.publishedAt instanceof Date ? news.publishedAt.toISOString() : news.publishedAt,
  };
}

// ----------------------------------------------------
// Express Server Instantiation
// ----------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json({ limit: '1mb' }));

  // Security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    const directives = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.gstatic.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: https: blob:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://www.googleapis.com https://firestore.googleapis.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.thesportsdb.com ws: wss:`,
      `frame-src https://www.google.com`,
      `media-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ];

    res.setHeader('Content-Security-Policy', directives.join('; '));
    next();
  });

  // Apply CSRF protection for mutating requests
  app.use(csrfProtection);

  // Expose CSRF token endpoint (rate limited strictly to prevent abuse)
  app.get('/api/csrf-token', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50, message: "Too many token requests" }), (req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token });
  });

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
      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user in Neon Postgres
      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashPassword(password),
          displayName: displayName ? sanitizeString(displayName) : null,
          photoURL: photoURL ? String(photoURL) : null,
          role: 'user', // Default role
          preferences: {
            create: {} // Default notification preferences
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

  // Auth: Login (Neon Database-First)
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
  app.get("/api/auth/verify-token", requireAuth, async (req: AuthenticatedRequest, res) => {
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

      // Revoke old refresh token (rotation)
      await revokeRefreshToken(refreshToken);

      // Fetch user for fresh data
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
      // Always return success to prevent email enumeration
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

      // Update the password
      await prisma.user.update({
        where: { email },
        data: { password: hashPassword(password) }
      });

      // Mark token as used
      await markResetTokenUsed(token);

      // Revoke all existing refresh tokens for security
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

  // API logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    log(`➡️ ${req.method} ${req.path}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      log(`⬅️ ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });

    next();
  });



  // ----------------------------------------------------
  // Audited API Endpoints (Neon Relational DB-First)
  // ----------------------------------------------------

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "neon", timestamp: new Date().toISOString() });
  });

  // 2. User Profile Fetch/Sync
  app.get("/api/users/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
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
      log(`❌ Profile sync failed`, error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // 3. User Profile Update
  app.post("/api/users/profile", requireAuth, createRateLimiter({ windowMs: 1 * 60 * 1000, max: 10, strict: true, message: "Too many profile updates" }), async (req: AuthenticatedRequest, res) => {
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
      log(`❌ Profile update failed`, error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // 4. Bookmarks Endpoints
  app.get("/api/users/bookmarks", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.uid }
      });
      res.json({ bookmarks: user?.bookmarkedArticles || [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/users/bookmarks", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many bookmark adjustments" }), async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/users/bookmarks/:id", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many bookmark adjustments" }), async (req: AuthenticatedRequest, res) => {
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

  // 5. Favorite Teams Endpoints
  app.get("/api/users/favorite-teams", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.uid }
      });
      res.json({ favoriteTeams: user?.favoriteTeams || [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorite teams" });
    }
  });

  app.post("/api/users/favorite-teams", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many team adjustments" }), async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/users/favorite-teams/:id", requireAuth, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many team adjustments" }), async (req: AuthenticatedRequest, res) => {
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

  // 6. Notifications Endpoints
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  app.put("/api/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  app.put("/api/notifications/read-all", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  app.post("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  // 7. Notification Preferences
  app.get("/api/notifications/preferences", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  app.put("/api/notifications/preferences", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  // 8. Sports API Database-First Caching Layer

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
  // ----------------------------------------------------
  // File Upload Endpoint
  // ----------------------------------------------------
  app.post(
    "/api/upload",
    requireAuth,
    createRateLimiter({ windowMs: 60 * 1000, max: 10, strict: true, message: "Too many upload requests" }),
    upload.single("file"),
    handleMulterError,
    (req: express.Request, res: express.Response) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      log(`📁 File uploaded: ${fileUrl} (${(req.file.size / 1024).toFixed(1)} KB)`);

      res.json({
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }
  );

  // Serve uploaded files as static assets
  app.use("/uploads", express.static(UPLOADS_DIR));

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
      // Get league data from matches, standings, and teams
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

      // Build a combined leagues map
      const leagueMap = new Map<string, {
        id: string;
        name: string;
        sport: string;
        matchCount: number;
        teamCount: number;
        hasStandings: boolean;
      }>();

      // Add leagues from matches
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

      // Add/update from standings
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

      // Add/update from teams
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

      // Known leagues metadata for display
      const LEAGUE_META: Record<string, { displayName: string; sport: string; country: string }> = {
        '4328': { displayName: 'English Premier League', sport: 'Soccer', country: 'England' },
        '4329': { displayName: 'English Championship', sport: 'Soccer', country: 'England' },
        '4335': { displayName: 'Spanish La Liga', sport: 'Soccer', country: 'Spain' },
        '4332': { displayName: 'Italian Serie A', sport: 'Soccer', country: 'Italy' },
        '4331': { displayName: 'German Bundesliga', sport: 'Soccer', country: 'Germany' },
        '4334': { displayName: 'French Ligue 1', sport: 'Soccer', country: 'France' },
        '4387': { displayName: 'NBA', sport: 'Basketball', country: 'USA' },
        '4391': { displayName: 'NFL', sport: 'American Football', country: 'USA' },
        '4424': { displayName: 'MLB', sport: 'Baseball', country: 'USA' },
        '4380': { displayName: 'NHL', sport: 'Ice Hockey', country: 'USA' },
      };

      const knownLeagueIds = new Set(Object.keys(LEAGUE_META));

      // Ensure all known leagues appear even if no data
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

      // Sort leagues: ones with data first, then by name
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

  // news endpoint (caching TTL: 1 hour)
  app.get("/api/sports/news", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many news requests" }), async (req, res) => {
    const q = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q || 'sports';
    const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit || '10';

    if (typeof q !== 'string' || q.trim().length === 0) {
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

  // 9. Articles (Admin/Dashboard & Public Blog) Endpoints

  app.get("/api/articles", async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const articles = await getArticles(status);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

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

  app.post("/api/articles", requireAdmin, createRateLimiter({ windowMs: 60000, max: 5, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res) => {
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
          content: content, // Rich text content allowed
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
      log(`❌ Article creation failed`, error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", requireAdmin, createRateLimiter({ windowMs: 60000, max: 10, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res) => {
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
      log(`❌ Article update failed`, error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", requireAdmin, createRateLimiter({ windowMs: 60000, max: 5, strict: true, message: "Too many article actions" }), async (req: AuthenticatedRequest, res) => {
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
  });  // 9.5. Admin User Management Endpoints (Admin only)
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
    if (!id || !validateId(id)) {
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
    if (!id || !validateId(id)) {
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

  // 9.6. Admin Settings Endpoints
  app.get("/api/admin/settings", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      let config = await prisma.siteConfig.findUnique({
        where: { id: 'default' }
      });
      if (!config) {
        config = await prisma.siteConfig.create({
          data: { id: 'default' }
        });
      }

      // Also fetch admin's own profile for the profile section
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

  app.put("/api/admin/settings", requireAdmin, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many settings updates" }), async (req: AuthenticatedRequest, res) => {
    const { siteName, siteDescription, socialTwitter, socialFacebook, socialInstagram, contactEmail } = req.body;
    try {
      const config = await prisma.siteConfig.upsert({
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

  // 9.7. Data Ingestion Endpoint (Admin only)
  app.post("/api/admin/ingest", requireAdmin, createRateLimiter({ windowMs: 5 * 60 * 1000, max: 3, strict: true, message: "Too many ingestion requests. Please wait 5 minutes between runs." }), async (req: AuthenticatedRequest, res) => {
    log('🚀 Manual data ingestion triggered by admin:', req.user?.email);
    
    // Run ingestion in background, return immediately
    res.json({ status: 'started', message: 'Data ingestion started. Check server logs for progress.' });

    // Background ingestion
    (async () => {
      try {
        log('┌─────────────────────────────────────────────┐');
        log('│   SPORTIVO DATA INGESTION (Server-Triggered)  │');
        log('└─────────────────────────────────────────────┘');

        const THE_SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
        
        const LEAGUES: Record<string, { id: string; name: string; sport: string }> = {
          '4328': { id: '4328', name: 'English Premier League', sport: 'Soccer' },
          '4329': { id: '4329', name: 'English Championship', sport: 'Soccer' },
          '4335': { id: '4335', name: 'Spanish La Liga', sport: 'Soccer' },
          '4332': { id: '4332', name: 'Italian Serie A', sport: 'Soccer' },
          '4331': { id: '4331', name: 'German Bundesliga', sport: 'Soccer' },
          '4334': { id: '4334', name: 'French Ligue 1', sport: 'Soccer' },
          '4387': { id: '4387', name: 'NBA', sport: 'Basketball' },
          '4391': { id: '4391', name: 'NFL', sport: 'American Football' },
          '4424': { id: '4424', name: 'MLB', sport: 'Baseball' },
          '4380': { id: '4380', name: 'NHL', sport: 'Ice Hockey' },
        };

        const RSS_FEEDS = [
          { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'sports' },
          { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian', category: 'sports' },
          { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', category: 'sports' },
        ];

        let totalSaved = 0;

        async function fetchApi(url: string): Promise<any> {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(20000),
            headers: { 'User-Agent': 'Sportivo/1.0' },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }

        // Season config for events
        const S_LEAGUE_SEASONS: Record<string, { completed: string; upcoming: string; rounds: number }> = {
          '4328': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
          '4329': { completed: '2024-2025', upcoming: '2025-2026', rounds: 46 },
          '4335': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
          '4332': { completed: '2024-2025', upcoming: '2025-2026', rounds: 38 },
          '4331': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
          '4334': { completed: '2024-2025', upcoming: '2025-2026', rounds: 34 },
          '4391': { completed: '2024', upcoming: '2025', rounds: 22 },
        };

        // 1. Ingestion: Scores & Fixtures (using eventsround.php - the only working endpoint)
        log('📊 Ingesting scores and fixtures from TheSportsDB (eventsround.php)...');
        for (const [leagueId, league] of Object.entries(LEAGUES)) {
          const sConfig = S_LEAGUE_SEASONS[leagueId];
          if (!sConfig || sConfig.rounds === 0) {
            log(`⏭️  Skipping ${league.name} — events not available via TheSportsDB`);
            continue;
          }

          // Completed season (scores)
          if (sConfig.completed) {
            for (let round = 1; round <= sConfig.rounds; round++) {
              try {
                const data = await fetchApi(`${THE_SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${sConfig.completed}`);
                const events: any[] = data?.events || [];
                if (events.length === 0) continue;

                for (const event of events) {
                  if (!event.idEvent) continue;
                  const hasScore = event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '';
                  const isFinished = event.strStatus === 'Match Finished' || event.strStatus === 'FT';

                  await prisma.cachedMatch.upsert({
                    where: { id: event.idEvent },
                    update: {
                      homeScore: event.intHomeScore ?? null,
                      awayScore: event.intAwayScore ?? null,
                      status: event.strStatus ?? (hasScore ? 'FT' : 'NS'),
                      time: event.strTime ?? null,
                      round: event.intRound ?? null,
                      thumb: event.strThumb ?? null,
                      updatedAt: new Date(),
                    },
                    create: {
                      id: event.idEvent, leagueId, leagueName: league.name,
                      homeTeamId: event.idHomeTeam || '', awayTeamId: event.idAwayTeam || '',
                      homeTeamName: event.strHomeTeam || 'Unknown', awayTeamName: event.strAwayTeam || 'Unknown',
                      homeScore: event.intHomeScore ?? null,
                      awayScore: event.intAwayScore ?? null,
                      status: event.strStatus ?? (hasScore ? 'FT' : 'NS'),
                      date: event.dateEvent || new Date().toISOString().split('T')[0],
                      time: event.strTime ?? null,
                      round: event.intRound ?? null,
                      sport: league.sport,
                      type: isFinished || hasScore ? 'score' : 'fixture',
                    },
                  });
                  totalSaved++;
                }
              } catch { /* skip failed rounds */ }
            }
          }

          // Upcoming season (fixtures - first 5 rounds)
          if (sConfig.upcoming) {
            for (let round = 1; round <= Math.min(5, sConfig.rounds); round++) {
              try {
                const data = await fetchApi(`${THE_SPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${sConfig.upcoming}`);
                const events: any[] = data?.events || [];
                if (events.length === 0) continue;

                for (const event of events) {
                  if (!event.idEvent) continue;
                  // Skip if already saved
                  const existing = await prisma.cachedMatch.findUnique({ where: { id: event.idEvent } });
                  if (existing) continue;

                  await prisma.cachedMatch.upsert({
                    where: { id: event.idEvent },
                    update: {
                      status: event.strStatus ?? 'NS',
                      time: event.strTime ?? null,
                      round: event.intRound ?? null,
                      thumb: event.strThumb ?? null,
                      updatedAt: new Date(),
                    },
                    create: {
                      id: event.idEvent, leagueId, leagueName: league.name,
                      homeTeamId: event.idHomeTeam || '', awayTeamId: event.idAwayTeam || '',
                      homeTeamName: event.strHomeTeam || 'Unknown', awayTeamName: event.strAwayTeam || 'Unknown',
                      status: event.strStatus || 'NS',
                      date: event.dateEvent || new Date().toISOString().split('T')[0],
                      time: event.strTime ?? null,
                      round: event.intRound ?? null,
                      sport: league.sport,
                      type: 'fixture',
                    },
                  });
                  totalSaved++;
                }
              } catch { /* skip failed rounds */ }
            }
          }
        }
        log(`✓ Scores & Fixtures done`);

        // 2. Ingestion: Standings
        log('🏆 Ingesting standings...');
        for (const [leagueId, league] of Object.entries(LEAGUES)) {
          if (league.sport !== 'Soccer') continue;
          try {
            const data = await fetchApi(`${THE_SPORTSDB_BASE}/lookuptable.php?l=${leagueId}`);
            for (const row of (data?.table || [])) {
              if (!row.idTeam) continue;
              await prisma.cachedStanding.upsert({
                where: { leagueId_teamId: { leagueId, teamId: row.idTeam } },
                update: {
                  teamName: row.strTeam, teamBadge: row.strBadge,
                  played: parseInt(row.intPlayed) || 0, won: parseInt(row.intWin) || 0,
                  drawn: parseInt(row.intDraw) || 0, lost: parseInt(row.intLoss) || 0,
                  goalsFor: parseInt(row.intGoalsFor) || 0, goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
                  goalsDifference: parseInt(row.intGoalDifference) || 0,
                  points: parseInt(row.intPoints) || 0, rank: parseInt(row.intRank) || 0,
                  updatedAt: new Date(),
                },
                create: {
                  leagueId, teamId: row.idTeam, teamName: row.strTeam || 'Unknown', teamBadge: row.strBadge,
                  played: parseInt(row.intPlayed) || 0, won: parseInt(row.intWin) || 0,
                  drawn: parseInt(row.intDraw) || 0, lost: parseInt(row.intLoss) || 0,
                  goalsFor: parseInt(row.intGoalsFor) || 0, goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
                  goalsDifference: parseInt(row.intGoalDifference) || 0,
                  points: parseInt(row.intPoints) || 0, rank: parseInt(row.intRank) || 0,
                },
              });
              totalSaved++;
            }
          } catch (err) {
            log(`⚠️  ${league.name} standings failed: ${err}`);
          }
        }
        log(`✓ Standings done`);

        // 3. Ingestion: Teams
        log('👥 Ingesting teams...');
        for (const [leagueId, league] of Object.entries(LEAGUES)) {
          try {
            const data = await fetchApi(`${THE_SPORTSDB_BASE}/lookup_all_teams.php?id=${leagueId}`);
            for (const team of (data?.teams || [])) {
              if (!team.idTeam) continue;
              await prisma.cachedTeam.upsert({
                where: { id: team.idTeam },
                update: {
                  name: team.strTeam, shortName: team.strTeamShort, sport: league.sport,
                  league: league.name, leagueId, badge: team.strBadge || team.strTeamBadge,
                  stadium: team.strStadium, stadiumLoc: team.strStadiumLocation,
                  website: team.strWebsite, descriptionEN: team.strDescriptionEN,
                  country: team.strCountry, logo: team.strLogo, banner: team.strBanner,
                  jersey: team.strJersey, updatedAt: new Date(),
                },
                create: {
                  id: team.idTeam, name: team.strTeam || 'Unknown', shortName: team.strTeamShort,
                  sport: league.sport, league: league.name, leagueId, badge: team.strBadge || team.strTeamBadge,
                  stadium: team.strStadium, stadiumLoc: team.strStadiumLocation,
                  website: team.strWebsite, descriptionEN: team.strDescriptionEN,
                  country: team.strCountry, logo: team.strLogo, banner: team.strBanner, jersey: team.strJersey,
                },
              });
              totalSaved++;
            }
          } catch (err) {
            log(`⚠️  ${league.name} teams failed: ${err}`);
          }
        }
        log(`✓ Teams done`);

        // 4. Ingestion: RSS News (simple XML parsing)
        log('📰 Ingesting sports news from RSS feeds...');
        for (const feed of RSS_FEEDS) {
          try {
            const response = await fetch(feed.url, {
              signal: AbortSignal.timeout(15000),
              headers: { 'User-Agent': 'Sportivo/1.0' },
            });
            if (!response.ok) {
              log(`⚠️  RSS ${feed.source}: HTTP ${response.status}`);
              continue;
            }
            const xml = await response.text();
            // Simple regex-based RSS parsing to avoid extra dependencies
            const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
            for (const itemXml of items) {
              const title = stripCdata(itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || '');
              const link = stripCdata(itemXml.match(/<link>(.*?)<\/link>/i)?.[1] 
                || itemXml.match(/<guid[^>]*>(.*?)<\/guid>/i)?.[1] 
                || '');
              const desc = stripCdata(itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || '');
              const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] 
                || new Date().toISOString();
              const imgMatch = desc.match(/src="([^"]+)"/i);
              const image = imgMatch?.[1] || null;
              const cleanDesc = desc.replace(/<[^>]*>/g, '').substring(0, 500);

              if (!title || !link) continue;

              await prisma.cachedNews.upsert({
                where: { id: link },
                update: { title, description: cleanDesc, image, publishedAt: new Date(pubDate), updatedAt: new Date() },
                create: { id: link, title, description: cleanDesc, image, url: link, source: feed.source, query: feed.category, publishedAt: new Date(pubDate) },
              });
              totalSaved++;
            }
          } catch (err) {
            log(`⚠️  RSS ${feed.source} failed: ${err}`);
          }
        }
        log(`✓ News done`);

        // 5. Generate match reports from recent scores
        log('📝 Generating match reports from recent scores...');
        try {
          const recentMatches = await prisma.cachedMatch.findMany({
            where: { 
              type: 'score', 
              homeScore: { not: null },
              awayScore: { not: null },
              status: { in: ['FT', 'Match Finished'] }
            },
            orderBy: { date: 'desc' },
            take: 20,
          });
          for (const match of recentMatches) {
            const homeScore = match.homeScore || '0';
            const awayScore = match.awayScore || '0';
            const slug = `match-report-${match.id}`;
            let result = 'draw';
            if (parseInt(homeScore) > parseInt(awayScore)) result = 'home-win';
            else if (parseInt(awayScore) > parseInt(homeScore)) result = 'away-win';
            const headlines: Record<string, string> = {
              'home-win': `${match.homeTeamName} Secure Victory Over ${match.awayTeamName}`,
              'away-win': `${match.awayTeamName} Triumph Away at ${match.homeTeamName}`,
              'draw': `${match.homeTeamName} and ${match.awayTeamName} Battle to a Draw`,
            };
            const existingArticle = await prisma.article.findUnique({ where: { slug } });
            if (!existingArticle) {
              await prisma.article.create({
                data: {
                  title: headlines[result],
                  slug,
                  content: `# ${headlines[result]}\n\n## Match Summary\n\n${match.homeTeamName} faced ${match.awayTeamName} in an exciting ${match.leagueName} encounter that ended ${homeScore}-${awayScore}.\n\n## Key Moments\n\n- **Full Time Score:** ${match.homeTeamName} ${homeScore} - ${awayScore} ${match.awayTeamName}\n- **Competition:** ${match.leagueName}\n- **Date:** ${match.date}\n\n## Match Report\n\nThe match between ${match.homeTeamName} and ${match.awayTeamName} provided plenty of action for the fans. Stay tuned for more detailed analysis and post-match coverage.\n\n*This is an automatically generated match report based on live match data.*`,
                  excerpt: `Match Report: ${match.homeTeamName} ${homeScore}-${awayScore} ${match.awayTeamName}`,
                  category: match.leagueName || match.sport,
                  authorName: 'Sportivo Match Reports',
                  tags: [match.leagueName || match.sport, match.homeTeamName, match.awayTeamName, 'Match Report'],
                  status: 'published',
                  publishedAt: new Date(),
                  thumbnail: match.thumb || null,
                },
              });
              totalSaved++;
            }
          }
        } catch (err) {
          log(`⚠️  Match report generation failed: ${err}`);
        }

        // 6. Update cache metadata
        const now = new Date();
        await Promise.all([
          prisma.cacheMetadata.upsert({ where: { key: 'scores:last_ingested' }, update: { expiresAt: new Date(now.getTime() + 5 * 60 * 1000), updatedAt: now }, create: { key: 'scores:last_ingested', expiresAt: new Date(now.getTime() + 5 * 60 * 1000) } }),
          prisma.cacheMetadata.upsert({ where: { key: 'fixtures:last_ingested' }, update: { expiresAt: new Date(now.getTime() + 60 * 60 * 1000), updatedAt: now }, create: { key: 'fixtures:last_ingested', expiresAt: new Date(now.getTime() + 60 * 60 * 1000) } }),
          prisma.cacheMetadata.upsert({ where: { key: 'standings:last_ingested' }, update: { expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), updatedAt: now }, create: { key: 'standings:last_ingested', expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000) } }),
          prisma.cacheMetadata.upsert({ where: { key: 'teams:last_ingested' }, update: { expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), updatedAt: now }, create: { key: 'teams:last_ingested', expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }),
          prisma.cacheMetadata.upsert({ where: { key: 'news:last_ingested' }, update: { expiresAt: new Date(now.getTime() + 60 * 60 * 1000), updatedAt: now }, create: { key: 'news:last_ingested', expiresAt: new Date(now.getTime() + 60 * 60 * 1000) } }),
        ]);

        log(`✅ Ingestion complete! Total records: ${totalSaved}`);
      } catch (err) {
        log(`❌ Ingestion error: ${err}`);
      }
    })();
  });

  // 9.8. Database Statistics Endpoint (Admin only)
  app.get("/api/admin/db-stats", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {        const [
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

  // 10. Hardened Gemini AI content generation endpoint
  app.post("/api/ai/generate", createRateLimiter({ windowMs: 60 * 1000, max: 5, strict: true, message: "Too many AI generation requests" }), async (req, res) => {
    log("🤖 AI Generate request received", { body: req.body });
    try {
      const { prompt, type } = req.body;
      
      // Strict input validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: "Prompt is required and must be a non-empty string" });
      }
      if (prompt.length > 5000) {
        return res.status(400).json({ error: "Prompt exceeds maximum length of 5000 characters" });
      }
      
      log(`📝 Local simulation of AI generating ${type || 'content'}`);
      
      let mockText = "";
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("summary") || lowerPrompt.includes("summarize")) {
        mockText = `### AI Summary (Local Database Mode)\n\nThis article provides an in-depth analysis of the latest updates in sports, sourced directly from the Sportivo database. Read the full content below to check user insights, matches stats, and current standings.`;
      } else {
        mockText = `### Draft Article (Local Database Mode)\n\nThis is a premium template generated by Sportivo's database-first environment. You can customize, update, and manage this article directly via your database tables or admin dashboard.`;
      }

      log("✅ Local AI Generate successful", { textLength: mockText.length });
      res.json({ text: mockText });
    } catch (error) {
      log("❌ AI Generate failed", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });

  // 11. Static Sitemap
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = process.env.VITE_SITE_URL || 'http://localhost:3000';
    const routes = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/leagues', changefreq: 'weekly', priority: '0.8' },
      { path: '/fixtures', changefreq: 'daily', priority: '0.8' },
      { path: '/standings', changefreq: 'daily', priority: '0.8' },
      { path: '/teams', changefreq: 'weekly', priority: '0.7' },
      { path: '/tags', changefreq: 'weekly', priority: '0.6' },
      { path: '/search', changefreq: 'weekly', priority: '0.5' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // 12. Vite Dev Server vs Static Build Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: process.env.HMR_PORT ? Number(process.env.HMR_PORT) : undefined,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running on http://localhost:${PORT}`);
    log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured'}`);
  });
}

startServer();
