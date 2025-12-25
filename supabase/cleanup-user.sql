-- Script to completely remove a user and allow re-signup
-- Replace 'your.email@uwaterloo.ca' with the actual email

-- First, check if user exists in auth.users
SELECT id, email, created_at, deleted_at 
FROM auth.users 
WHERE email = 'your.email@uwaterloo.ca';

-- Delete from public.users (if exists)
DELETE FROM public.users 
WHERE email = 'your.email@uwaterloo.ca';

-- Delete from auth.users (this is the important one)
-- Note: You need to use Supabase Dashboard -> Authentication -> Users to fully delete
-- Or use the admin API, but for now, check if they exist:

-- If the user shows up with deleted_at NOT NULL, they're soft-deleted
-- In Supabase Dashboard:
-- 1. Go to Authentication -> Users
-- 2. Search for your email
-- 3. Click the three dots (...) next to the user
-- 4. Click "Delete User" 
-- 5. Confirm deletion

-- Alternative: Force delete via SQL (use with caution)
-- This requires superuser privileges which you might not have
-- DELETE FROM auth.users WHERE email = 'your.email@uwaterloo.ca';
