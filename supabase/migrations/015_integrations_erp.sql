-- ============================================================
-- 015 : Intégrations ERP natives (Cegid Loop + Sage via Chift)
-- ============================================================
-- Les tokens OAuth sont chiffrés AES-256-GCM côté application
-- avant insertion (clé : INTEGRATION_ENCRYPTION_KEY env var).
-- RLS : chaque cabinet accède uniquement à ses propres données.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Table principale : integrations_erp
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations_erp (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         TEXT        NOT NULL CHECK (provider IN ('cegid', 'sage')),

  -- Tokens stockés chiffrés AES-256-GCM (base64)
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync
  last_sync_at     TIMESTAMPTZ,
  sync_status      TEXT        NOT NULL DEFAULT 'idle'
                               CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  sync_error       TEXT,
  synced_count     INTEGER     NOT NULL DEFAULT 0,

  -- Config provider (ex. chift_company_id pour Sage)
  config           JSONB       NOT NULL DEFAULT '{}'::JSONB,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cabinet_id, provider)
);

ALTER TABLE integrations_erp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cabinet accède à ses intégrations ERP" ON integrations_erp;
CREATE POLICY "Cabinet accède à ses intégrations ERP"
  ON integrations_erp
  FOR ALL
  USING (auth.uid() = cabinet_id)
  WITH CHECK (auth.uid() = cabinet_id);

CREATE INDEX IF NOT EXISTS idx_integrations_erp_cabinet ON integrations_erp(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_integrations_erp_provider ON integrations_erp(provider);

-- ─────────────────────────────────────────────────────────────
-- 2. Table des écritures synchronisées depuis les ERP
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_ecritures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL CHECK (provider IN ('cegid', 'sage')),

  -- Référence unique côté ERP (ex. numeroEcriture Cegid, id Chift)
  external_id   TEXT        NOT NULL,

  -- Données comptables
  ecriture_date DATE        NOT NULL,
  journal_code  TEXT,
  journal_lib   TEXT,
  compte_num    TEXT        NOT NULL,
  compte_lib    TEXT,
  debit         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  libelle       TEXT,
  piece_ref     TEXT,

  -- Données brutes du provider (pour audit/debug)
  raw           JSONB       NOT NULL DEFAULT '{}'::JSONB,

  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cabinet_id, provider, external_id)
);

ALTER TABLE erp_ecritures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cabinet accède à ses écritures ERP" ON erp_ecritures;
CREATE POLICY "Cabinet accède à ses écritures ERP"
  ON erp_ecritures
  FOR ALL
  USING (auth.uid() = cabinet_id)
  WITH CHECK (auth.uid() = cabinet_id);

CREATE INDEX IF NOT EXISTS idx_erp_ecritures_cabinet     ON erp_ecritures(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_erp_ecritures_provider    ON erp_ecritures(provider);
CREATE INDEX IF NOT EXISTS idx_erp_ecritures_date        ON erp_ecritures(ecriture_date DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. Trigger updated_at sur integrations_erp
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION erp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS integrations_erp_set_updated_at ON integrations_erp;
CREATE TRIGGER integrations_erp_set_updated_at
  BEFORE UPDATE ON integrations_erp
  FOR EACH ROW EXECUTE FUNCTION erp_set_updated_at();
