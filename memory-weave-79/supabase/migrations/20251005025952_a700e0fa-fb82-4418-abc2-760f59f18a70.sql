-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view memberships they have access to" ON public.memberships;

-- Update the security definer function to be more granular
-- Returns 'owner' if user owns the storyteller, 'member' if they're an accepted member, or 'none' otherwise
CREATE OR REPLACE FUNCTION public.get_storyteller_access_level(_storyteller_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Check if user is the owner
    WHEN EXISTS (
      SELECT 1 FROM public.storytellers 
      WHERE id = _storyteller_id AND owner_id = _user_id
    ) THEN 'owner'
    -- Check if user is an accepted, non-revoked member
    WHEN EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN auth.users u ON u.email = m.user_email
      WHERE m.storyteller_id = _storyteller_id 
        AND u.id = _user_id
        AND m.accepted_at IS NOT NULL 
        AND m.revoked_at IS NULL
    ) THEN 'member'
    ELSE 'none'
  END;
$$;

-- Create a new SELECT policy that restricts access appropriately
-- Owners can see all memberships, members can only see their own
CREATE POLICY "Restrict membership visibility by role"
ON public.memberships
FOR SELECT
TO authenticated
USING (
  -- Owner can see all memberships for their storyteller
  public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'owner'
  OR
  -- Members can only see their own membership record
  (
    public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'member'
    AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);