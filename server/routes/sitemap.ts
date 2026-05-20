import type { Express } from "express";

export function registerSitemapRoute(app: Express) {
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
}
