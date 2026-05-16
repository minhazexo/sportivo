import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import https from "https";
import http from "http";

dotenv.config();

const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    res.setHeader('X-RateLimit-Remaining', (RATE_LIMIT_MAX - 1).toString());
    return next();
  }

  record.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX - record.count);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  next();
}

// CSRF token generation and validation
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

  const token = req.headers['x-csrf-token'] as string;
  if (!validateCsrfToken(token)) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  next();
}

// Clean expired CSRF tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(token);
    }
  }
}, 60000); // Clean every minute

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.googleapis.com https://firestore.googleapis.com https://www.google-analytics.com https://pagead2.googlesyndication.com; frame-src https://www.google.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
    next();
  });

  // Apply rate limiting
  app.use(rateLimiter);

  // Apply CSRF protection for mutating requests
  app.use(csrfProtection);

  // Expose CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token });
  });

  app.use((req, res, next) => {
    const start = Date.now();
    log(`➡️ ${req.method} ${req.path}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      log(`⬅️ ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // API Route for Gemini
  app.post("/api/ai/generate", async (req, res) => {
    log("🤖 AI Generate request received", { body: req.body });
    try {
      const { prompt, type } = req.body;
      
      // Input validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: "Prompt is required and must be a non-empty string" });
      }
      if (prompt.length > 10000) {
        return res.status(400).json({ error: "Prompt exceeds maximum length of 10000 characters" });
      }
      if (type && typeof type !== 'string') {
        return res.status(400).json({ error: "Type must be a string" });
      }
      
      if (!process.env.GEMINI_API_KEY) {
        log("❌ GEMINI_API_KEY not configured");
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      log(`📝 Generating ${type || 'content'} with prompt: ${prompt.substring(0, 50)}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      log("✅ AI Generate successful", { textLength: response.text?.length });
      res.json({ text: response.text });
    } catch (error) {
      log("❌ AI Generate failed", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });

  // Helper function to fetch from external APIs using https module
  function fetchExternal(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Sportivo/1.0',
          'Accept': 'application/json',
        },
        timeout: 10000,
      }, (response) => {
        let data = '';
        
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Handle redirects
          fetchExternal(response.headers.location).then(resolve).catch(reject);
          return;
        }
        
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
          }
        });
        response.on('error', reject);
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Proxy for Sports Data (TheSportsDB Free API)
  app.get("/api/sports/scores", async (req, res) => {
    log("⚽ Scores request received", { query: req.query });
    try {
      const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
      
      // Validate league parameter
      if (league && typeof league !== 'string') {
        return res.status(400).json({ error: "Invalid league parameter" });
      }
      
      let url = "https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=today&s=soccer";
      if (league && typeof league === 'string' && league !== 'undefined') {
        // Validate league ID format (should be numeric)
        if (!/^\d+$/.test(league)) {
          return res.status(400).json({ error: "League ID must be a numeric value" });
        }
        url = `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${league}`;
      }
      log(`📡 Fetching scores from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Scores fetched successfully", { eventsCount: data.events?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Scores fetch failed", error);
      res.status(500).json({ error: "Failed to fetch scores", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/teams/:league", async (req, res) => {
    log("🏟️ Teams request received", { params: req.params });
    try {
      const { league } = req.params;
      
      // Validate league parameter
      if (!league || typeof league !== 'string' || league.length > 100) {
        return res.status(400).json({ error: "Invalid league parameter" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`;
      log(`📡 Fetching teams from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Teams fetched successfully", { teamsCount: data.teams?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Teams fetch failed", error);
      res.status(500).json({ error: "Failed to fetch teams", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/fixtures", async (req, res) => {
    log("📅 Fixtures request received", { query: req.query });
    try {
      const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
      
      // Validate league parameter
      if (league && typeof league !== 'string') {
        return res.status(400).json({ error: "Invalid league parameter" });
      }
      if (league && typeof league === 'string' && !/^\d+$/.test(league)) {
        return res.status(400).json({ error: "League ID must be a numeric value" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league || ''}`;
      log(`📡 Fetching fixtures from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Fixtures fetched successfully", { eventsCount: data.events?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Fixtures fetch failed", error);
      res.status(500).json({ error: "Failed to fetch fixtures", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/standings", async (req, res) => {
    log("🏆 Standings request received", { query: req.query });
    try {
      const league = Array.isArray(req.query.league) ? req.query.league[0] : req.query.league;
      
      // Validate league parameter
      if (!league || typeof league !== 'string') {
        return res.status(400).json({ error: "League parameter is required" });
      }
      if (!/^\d+$/.test(league)) {
        return res.status(400).json({ error: "League ID must be a numeric value" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${league}`;
      log(`📡 Fetching standings from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Standings fetched successfully", { tableLength: data.table?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Standings fetch failed", error);
      res.status(500).json({ error: "Failed to fetch standings", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/team/:id", async (req, res) => {
    log("👥 Team detail request received", { params: req.params });
    try {
      const { id } = req.params;
      
      // Validate team ID
      if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid team ID. Must be a numeric value" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${id}`;
      log(`📡 Fetching team from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Team fetched successfully", { teamCount: data.teams?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Team fetch failed", error);
      res.status(500).json({ error: "Failed to fetch team", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/team/:id/events", async (req, res) => {
    log("📊 Team events request received", { params: req.params });
    try {
      const { id } = req.params;
      
      // Validate team ID
      if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid team ID. Must be a numeric value" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${id}`;
      log(`📡 Fetching team events from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Team events fetched successfully", { eventsCount: data.events?.length || 0 });
      res.json(data);
    } catch (error) {
      log("❌ Team events fetch failed", error);
      res.status(500).json({ error: "Failed to fetch team events", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/sports/match/:id", async (req, res) => {
    log("⚽ Match detail request received", { params: req.params });
    try {
      const { id } = req.params;
      
      // Validate match ID
      if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid match ID. Must be a numeric value" });
      }
      
      const url = `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${id}`;
      log(`📡 Fetching match from: ${url}`);
      
      const data = await fetchExternal(url);
      log("✅ Match fetched successfully");
      res.json(data);
    } catch (error) {
      log("❌ Match fetch failed", error);
      res.status(500).json({ error: "Failed to fetch match", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    log("💚 Health check request");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Sitemap
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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
