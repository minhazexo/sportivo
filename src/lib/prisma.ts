import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING

if (!connectionString || connectionString.includes('<neon-host>')) {
  console.warn('[Prisma] WARNING: No valid PostgreSQL connection string found. Prisma queries may fail. Please configure DATABASE_URL in .env');
}

// Connection pooling setup
const pool = new pg.Pool({
  connectionString: connectionString || undefined,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10, // Connection pooling limit
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Timeout after 5 seconds if connection fails
})

pool.on('error', (err) => {
  console.error('[pg Pool] Unexpected error on idle client:', err);
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma