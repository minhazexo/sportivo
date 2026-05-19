import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  max: 2,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Adding password column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "password" TEXT');
    console.log('✓ Password column added successfully');
    
    // Verify
    const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'");
    if (result.rows.length > 0) {
      console.log('✓ Verified: password column exists');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();