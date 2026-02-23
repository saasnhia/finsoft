-- Migration 014: AI Agent logs table
-- Tracks every Mistral AI call per user (rate limiting + audit trail)

CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('audit', 'tva', 'rapprochement', 'mail')),
  input_summary text,
  output_summary text,
  tokens_used integer,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_logs" ON ai_agent_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user_created
  ON ai_agent_logs (user_id, created_at DESC);
