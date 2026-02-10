-- Migration 007: Audit logs table for compliance tracking (RGPD, ISO 27001)
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  -- Create audit_logs table
  CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL CHECK (action IN (
      'login', 'logout', 'view', 'create', 'update', 'delete', 'export', 'upload', 'send_email'
    )),
    resource_type text NOT NULL CHECK (resource_type IN (
      'facture', 'transaction', 'client', 'declaration_tva', 'rappel', 'bank_account', 'user', 'fec'
    )),
    resource_id text,
    ip_address text,
    user_agent text,
    details jsonb,
    created_at timestamptz DEFAULT now()
  );

  -- Indexes for efficient querying
  CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
  CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON public.audit_logs(resource_type);

  -- Enable RLS
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

  -- Policies: users can view their own logs, insert only
  DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
  CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
  CREATE POLICY "Users can insert their own audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END $$;
