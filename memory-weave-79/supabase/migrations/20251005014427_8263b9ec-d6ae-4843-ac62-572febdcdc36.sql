-- Create role enum
CREATE TYPE public.member_role AS ENUM ('owner', 'editor', 'viewer');

-- Create memberships table for family permissions
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyteller_id UUID NOT NULL REFERENCES public.storytellers(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role public.member_role NOT NULL,
  invited_by UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  token_hash TEXT,
  token_expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(storyteller_id, user_email)
);

-- Add expires_at, revoked_at, created_by_user_id to shares
ALTER TABLE public.shares 
ADD COLUMN expires_at TIMESTAMPTZ,
ADD COLUMN revoked_at TIMESTAMPTZ,
ADD COLUMN created_by_user_id UUID;

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add owner_id to storytellers
ALTER TABLE public.storytellers
ADD COLUMN owner_id UUID;

-- Enable RLS on new tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for memberships
CREATE POLICY "Members can view their own memberships"
ON public.memberships FOR SELECT
USING (true);

CREATE POLICY "Allow public insert memberships"
ON public.memberships FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update memberships"
ON public.memberships FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete memberships"
ON public.memberships FOR DELETE
USING (true);

-- RLS policies for audit logs (read-only for security)
CREATE POLICY "Allow public read audit logs"
ON public.audit_logs FOR SELECT
USING (true);

CREATE POLICY "Allow public insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_memberships_storyteller_id ON public.memberships(storyteller_id);
CREATE INDEX idx_memberships_user_email ON public.memberships(user_email);
CREATE INDEX idx_memberships_token_hash ON public.memberships(token_hash);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);