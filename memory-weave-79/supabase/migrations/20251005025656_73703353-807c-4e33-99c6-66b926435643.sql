-- Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "Users can view memberships for storytellers they have access to" ON public.memberships;

-- Create a security definer function to safely check if user can access a storyteller
CREATE OR REPLACE FUNCTION public.can_access_storyteller(_storyteller_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User is the owner of the storyteller
  SELECT EXISTS (
    SELECT 1 FROM public.storytellers 
    WHERE id = _storyteller_id AND owner_id = _user_id
  )
  OR
  -- User is an accepted, non-revoked member
  EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN auth.users u ON u.email = m.user_email
    WHERE m.storyteller_id = _storyteller_id 
      AND u.id = _user_id
      AND m.accepted_at IS NOT NULL 
      AND m.revoked_at IS NULL
  );
$$;

-- Create a new, secure SELECT policy using the security definer function
CREATE POLICY "Users can view memberships they have access to"
ON public.memberships
FOR SELECT
TO authenticated
USING (public.can_access_storyteller(storyteller_id, auth.uid()));