-- Fix memberships table RLS policies to prevent email exposure
-- This migration addresses the critical security issue where user emails are publicly readable

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Members can view their own memberships" ON memberships;
DROP POLICY IF EXISTS "Allow public insert memberships" ON memberships;
DROP POLICY IF EXISTS "Allow public update memberships" ON memberships;
DROP POLICY IF EXISTS "Allow public delete memberships" ON memberships;

-- Create secure SELECT policy: Users can only see memberships they're involved with
-- This prevents email harvesting by restricting access to:
-- 1. Memberships where the user's email matches (their own invitations)
-- 2. Memberships for storytellers the user owns
CREATE POLICY "Users can view relevant memberships"
ON memberships FOR SELECT
USING (
  -- User can see their own membership invitations
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- User can see all memberships for storytellers they own
  storyteller_id IN (
    SELECT id FROM storytellers WHERE owner_id = auth.uid()
  )
);

-- Block direct INSERT operations (must go through /invite Edge Function with proper validation)
CREATE POLICY "Block direct membership inserts"
ON memberships FOR INSERT
WITH CHECK (false);

-- Only storyteller owners can UPDATE memberships (e.g., to revoke them)
CREATE POLICY "Owners can update memberships"
ON memberships FOR UPDATE
USING (
  storyteller_id IN (
    SELECT id FROM storytellers WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  storyteller_id IN (
    SELECT id FROM storytellers WHERE owner_id = auth.uid()
  )
);

-- Only storyteller owners can DELETE memberships
CREATE POLICY "Owners can delete memberships"
ON memberships FOR DELETE
USING (
  storyteller_id IN (
    SELECT id FROM storytellers WHERE owner_id = auth.uid()
  )
);