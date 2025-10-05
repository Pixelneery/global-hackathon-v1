-- Fix the memberships_safe view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view respects the permissions of the querying user, not the view creator
DROP VIEW IF EXISTS public.memberships_safe;

CREATE VIEW public.memberships_safe 
WITH (security_invoker=true) AS
SELECT 
  id,
  storyteller_id,
  role,
  invited_at,
  accepted_at,
  revoked_at,
  invited_by,
  CASE 
    WHEN public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'owner' 
    THEN user_email 
    ELSE '***@***.***'
  END as user_email
FROM public.memberships
WHERE public.get_storyteller_access_level(storyteller_id, auth.uid()) IN ('owner', 'member');