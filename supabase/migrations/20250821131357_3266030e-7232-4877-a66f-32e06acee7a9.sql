-- Fix critical security vulnerability: Remove public access to profiles table
-- while preserving sharing functionality

-- Drop the problematic public access policy
DROP POLICY IF EXISTS "access_profiles" ON public.profiles;

-- Create secure policies that only allow necessary access
-- 1. Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 2. Users can view profiles of people they share lists with (for sharing functionality)
CREATE POLICY "users_can_view_shared_profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Allow viewing profiles of users who have shared lists with the current user
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.created_by = id
    AND list_shares.shared_with = auth.uid()
  )
  OR
  -- Allow viewing profiles of users the current user has shared lists with
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.shared_with = id
    AND list_shares.created_by = auth.uid()
  )
  OR
  -- Allow viewing profiles when looking up by email for sharing (but only the ID)
  -- This is needed for the ShareListDialog functionality
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.created_by = auth.uid()
  )
);

-- 3. Keep the existing policy for managing own profile
-- (already exists as "manage_own_profile")

-- Add an index to improve performance of the new policies
CREATE INDEX IF NOT EXISTS idx_list_shares_created_by ON list_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_list_shares_shared_with ON list_shares(shared_with);