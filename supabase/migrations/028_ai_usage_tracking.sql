-- ============================================================
-- 028 : AI Usage Tracking — quota tokens par plan utilisateur
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used integer NOT NULL,
  model text NOT NULL,
  endpoint text NOT NULL, -- 'assistant' | 'agent'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ai_usage_user_policy'
  ) THEN
    CREATE POLICY ai_usage_user_policy ON public.ai_usage
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month
  ON public.ai_usage(user_id, created_at);

-- Vue agrégée par mois
CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  user_id,
  SUM(tokens_used) AS total_tokens,
  date_trunc('month', created_at) AS month
FROM public.ai_usage
GROUP BY user_id, date_trunc('month', created_at);
