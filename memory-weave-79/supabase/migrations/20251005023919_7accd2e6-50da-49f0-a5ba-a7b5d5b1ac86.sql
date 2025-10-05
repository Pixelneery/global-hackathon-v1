-- Enhance memberships RLS policy to prevent any potential email enumeration
-- This addresses concerns about authenticated users potentially accessing email addresses
-- they shouldn't be able to see

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view relevant memberships" ON memberships;

-- Create a more restrictive policy that only allows users to see memberships if:
-- 1. They own the storyteller (to manage members), OR
-- 2. They are an active member of that storyteller (to see other collaborators)
CREATE POLICY "Users can view memberships for storytellers they have access to"
ON memberships FOR SELECT
USING (
  -- Storyteller owners can see all memberships for their storytellers
  storyteller_id IN (
    SELECT id FROM storytellers WHERE owner_id = auth.uid()
  )
  OR
  -- Active members can see other members of the same storyteller (for collaboration)
  storyteller_id IN (
    SELECT storyteller_id 
    FROM memberships 
    WHERE user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND accepted_at IS NOT NULL 
      AND revoked_at IS NULL
  )
);

-- Add comment explaining the security model
COMMENT ON POLICY "Users can view memberships for storytellers they have access to" ON memberships IS 'Users can only view membership lists for storytellers they own or are active members of. This prevents email enumeration by unauthorized users.';