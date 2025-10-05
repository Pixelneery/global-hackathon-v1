-- Restrict shares table access to prevent token enumeration
-- This addresses the security vulnerability where anyone could read all share tokens

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read shares" ON shares;

-- Create a restrictive policy: users can only view shares they created
CREATE POLICY "Users can view their own shares"
ON shares FOR SELECT
USING (
  auth.uid() = created_by_user_id
);

-- Keep insert policy but require authentication and set created_by_user_id
DROP POLICY IF EXISTS "Allow public insert shares" ON shares;

CREATE POLICY "Authenticated users can create shares"
ON shares FOR INSERT
WITH CHECK (
  auth.uid() = created_by_user_id
);

-- Allow updates only to revoke shares (setting revoked_at)
CREATE POLICY "Users can revoke their own shares"
ON shares FOR UPDATE
USING (auth.uid() = created_by_user_id)
WITH CHECK (auth.uid() = created_by_user_id);

COMMENT ON POLICY "Users can view their own shares" ON shares IS 'Users can only view shares they created. Public access is handled through edge functions to prevent token enumeration.';
COMMENT ON POLICY "Authenticated users can create shares" ON shares IS 'Only authenticated users can create shares, and they must set themselves as the creator.';
COMMENT ON POLICY "Users can revoke their own shares" ON shares IS 'Users can update their own shares, typically to revoke them.';