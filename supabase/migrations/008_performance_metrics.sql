-- Migration 008: Performance metrics table for extraction monitoring
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    extraction_time_ms integer NOT NULL,
    confidence_score numeric(3,2),
    method text NOT NULL CHECK (method IN ('regex', 'ai_local', 'hybrid')),
    success boolean NOT NULL DEFAULT true,
    file_type text,
    file_size_bytes integer,
    error_message text,
    created_at timestamptz DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS perf_metrics_created_at_idx ON public.performance_metrics(created_at);
  CREATE INDEX IF NOT EXISTS perf_metrics_method_idx ON public.performance_metrics(method);

  ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can view their own metrics" ON public.performance_metrics;
  CREATE POLICY "Users can view their own metrics"
    ON public.performance_metrics FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.performance_metrics;
  CREATE POLICY "Users can insert their own metrics"
    ON public.performance_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END $$;
