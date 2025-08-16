-- Migration: 004_add_first_name_column
-- Description: Add first_name column to users table for registration
-- Date: 2025-08-16

-- Add first_name column to users table
ALTER TABLE users ADD COLUMN first_name TEXT;

-- Update any existing users to have a default first_name if needed
-- (This is optional since we're just adding the column)
UPDATE users 
SET first_name = 'User' 
WHERE first_name IS NULL;

-- Verification query to check the migration worked
-- PRAGMA table_info(users);