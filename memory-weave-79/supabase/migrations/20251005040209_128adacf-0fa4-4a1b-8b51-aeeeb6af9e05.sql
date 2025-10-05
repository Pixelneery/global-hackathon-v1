-- Phase 1: Fix storytellers.owner_id to be NOT NULL
-- First, we need to handle existing storytellers. Since this app doesn't have auth yet,
-- we'll need to delete existing storytellers (they have no owner anyway)
DELETE FROM public.storytellers WHERE owner_id IS NULL;

-- Now make owner_id NOT NULL with a default
ALTER TABLE public.storytellers 
ALTER COLUMN owner_id SET NOT NULL,
ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- Phase 2: Create safe view for memberships that hides sensitive data
CREATE OR REPLACE VIEW public.memberships_safe AS
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

-- Phase 3: Fix audit_logs RLS policy to handle NULL user_id properly
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND user_id IS NOT NULL);

-- Phase 4: Ensure all edge functions properly set user_id in audit logs
COMMENT ON COLUMN public.audit_logs.user_id IS 'MUST be set for all user-initiated actions. NULL only for system actions.';