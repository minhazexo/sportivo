import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testRegistration() {
  try {
    // Try to create a test user
    const testEmail = `test_${Date.now()}@example.com`;
    console.log('Testing registration with email:', testEmail);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashed_test_password',
        displayName: 'Test User',
        role: 'user'
      }
    });

    console.log('User created successfully:', user.id);
    console.log('Email:', user.email);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user cleaned up');
  } catch (error) {
    console.error('Registration test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();