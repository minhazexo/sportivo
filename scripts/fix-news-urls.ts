/**
 * Fix CDATA-wrapped URLs in the CachedNews table
 * 
 * The server.ts regex-based RSS parsing previously stored URLs with CDATA 
 * wrapping (<![CDATA[https://...]]>) instead of clean URLs.
 * This script cleans those up.
 * 
 * Run: npx tsx scripts/fix-news-urls.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString, max: 3 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixCdataUrls() {
  const articles = await prisma.cachedNews.findMany({
    where: { url: { contains: '<![CDATA[' } }
  });
  
  console.log(`Found ${articles.length} articles with CDATA-wrapped URLs`);
  let fixed = 0, deleted = 0;

  for (const a of articles) {
    const cleanUrl = a.url.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
    
    // Check if a record with the clean URL as ID already exists (duplicate)
    const existing = await prisma.cachedNews.findUnique({
      where: { id: cleanUrl }
    });

    if (existing) {
      // Delete the CDATA-wrapped duplicate (keep the clean one)
      await prisma.cachedNews.delete({ where: { id: a.id } });
      deleted++;
      console.log(`  Deleted duplicate: ${a.id.substring(0, 60)}...`);
    } else {
      // Update the record with clean URL
      await prisma.cachedNews.update({
        where: { id: a.id },
        data: { 
          url: cleanUrl,
          id: cleanUrl
        }
      });
      fixed++;
    }
  }

  console.log(`\n✅ Done: ${fixed} fixed, ${deleted} duplicates deleted`);
  await prisma.$disconnect();
}

fixCdataUrls().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
