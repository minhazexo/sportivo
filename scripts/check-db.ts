import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const tables = [
      { name: 'articles', model: () => prisma.article.count() },
      { name: 'users', model: () => prisma.user.count() },
      { name: 'cached_matches', model: () => prisma.cachedMatch.count() },
      { name: 'cached_teams', model: () => prisma.cachedTeam.count() },
      { name: 'cached_standings', model: () => prisma.cachedStanding.count() },
      { name: 'cached_news', model: () => prisma.cachedNews.count() },
      { name: 'cache_metadata', model: () => prisma.cacheMetadata.count() },
      { name: 'notifications', model: () => prisma.notification.count() },
      { name: 'ad_placements', model: () => prisma.adPlacement.count() },
    ];

    console.log('📊 DATABASE STATUS');
    console.log('─────────────────────');
    
    for (const table of tables) {
      try {
        const count = await table.model();
        console.log(`  ${table.name}: ${count} rows`);
      } catch (e) {
        console.log(`  ${table.name}: ERROR - ${e instanceof Error ? e.message : e}`);
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
