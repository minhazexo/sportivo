import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { UPLOADS_DIR } from "./config";
import { csrfProtection, startCsrfCleanup } from "./middleware/csrf";
import { createRateLimiter } from "./middleware/rateLimiter";
import { generateCsrfToken } from "./middleware/csrf";
import { upload, handleMulterError } from "./middleware/upload";
import { requireAuth } from "./middleware/auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerUserRoutes } from "./routes/users";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerSportsRoutes } from "./routes/sports";
import { registerArticleRoutes } from "./routes/articles";
import { registerAdminRoutes } from "./routes/admin";
import { registerAiRoutes } from "./routes/ai";
import { registerSitemapRoute } from "./routes/sitemap";

dotenv.config();

// Initialize log helpers
const log = (msg: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
};

// ----------------------------------------------------
// Server Bootstrap
// ----------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    log(`📁 Created uploads directory at ${UPLOADS_DIR}`);
  }

  app.use(express.json({ limit: '1mb' }));

  // ── Security Headers ──────────────────────────────────────────────
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

  // ── CSRF ─────────────────────────────────────────────────────────
  app.use(csrfProtection);
  startCsrfCleanup();

  app.get('/api/csrf-token', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50, message: "Too many token requests" }), (req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token });
  });

  // ── Upload Endpoint ──────────────────────────────────────────────
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

  app.use("/uploads", express.static(UPLOADS_DIR));

  // ── API Logging ──────────────────────────────────────────────────
  app.use((req, res, next) => {
    const start = Date.now();
    log(`➡️ ${req.method} ${req.path}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      log(`⬅️ ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // ── Health Check ─────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "neon", timestamp: new Date().toISOString() });
  });

  // ── Register All Route Groups ────────────────────────────────────
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerNotificationRoutes(app);
  registerSportsRoutes(app);
  registerArticleRoutes(app);
  registerAdminRoutes(app);
  registerAiRoutes(app);
  registerSitemapRoute(app);

  // ── Vite Dev Server vs Static Build Serving ──────────────────────
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

  // ── Start Listening ──────────────────────────────────────────────
  app.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running on http://localhost:${PORT}`);
    log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured'}`);
  });
}

startServer();
