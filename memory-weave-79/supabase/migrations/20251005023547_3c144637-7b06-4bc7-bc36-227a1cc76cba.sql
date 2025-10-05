-- Fix audit_logs table RLS policies to prevent unauthorized access
-- This migration addresses the critical security issue where audit logs, user IDs, and IP addresses are publicly accessible

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow public insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public read audit logs" ON audit_logs;

-- Block direct INSERT operations (must go through Edge Functions with service role key)
-- This prevents attackers from injecting fake audit entries to cover their tracks
CREATE POLICY "Block direct audit log inserts"
ON audit_logs FOR INSERT
WITH CHECK (false);

-- Restrict SELECT access to authenticated users viewing their own logs
-- This prevents IP address harvesting and activity pattern theft
CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (
  user_id = auth.uid()
);

-- No UPDATE or DELETE policies - audit logs must be immutable
-- This ensures audit trail integrity and prevents tampering

-- Add comment explaining the security model
COMMENT ON TABLE audit_logs IS 'Audit logs are immutable records of system events. Only Edge Functions can insert (via service role key). Users can only view their own logs. No updates or deletes allowed to maintain audit integrity.';