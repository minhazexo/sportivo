-- Migration: Add missing password column to users table
-- Migration ID: 20260518000001_add_password_column

BEGIN;

-- Add password column to users table if it doesn't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

COMMIT;

-- Verify the column was added
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password';