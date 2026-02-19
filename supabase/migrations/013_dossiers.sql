-- Migration 013: Multi-dossiers cabinet
-- Un cabinet gère N dossiers clients, chacun avec ses propres données

CREATE TABLE IF NOT EXISTS dossiers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         TEXT        NOT NULL,
  siren       TEXT,
  secteur     TEXT,
  regime_tva  TEXT        DEFAULT 'réel normal',
  email       TEXT,
  telephone   TEXT,
  notes       TEXT,
  actif       BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_dossiers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS dossiers_updated_at ON dossiers;
CREATE TRIGGER dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW EXECUTE FUNCTION update_dossiers_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_dossiers_user_id ON dossiers(user_id);

-- RLS
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own dossiers" ON dossiers;
CREATE POLICY "Users manage own dossiers" ON dossiers
  FOR ALL USING (auth.uid() = user_id);

-- Table de statuts par dossier (TVA, rapprochement, factures)
-- Mise à jour par les API routes existantes + un job de résumé
CREATE TABLE IF NOT EXISTS dossier_statuts (
  dossier_id        UUID        PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  tva_status        TEXT        DEFAULT 'inconnu',  -- 'ok'|'retard'|'erreur'|'inconnu'
  tva_prochaine_echeance TIMESTAMPTZ,
  nb_factures_attente  INTEGER  DEFAULT 0,
  dernier_rapprochement TIMESTAMPTZ,
  taux_rapprochement   NUMERIC(5,2),  -- 0-100
  ca_annuel_estime     NUMERIC(15,2),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dossier_statuts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users via dossiers" ON dossier_statuts;
CREATE POLICY "Users via dossiers" ON dossier_statuts
  FOR ALL USING (
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );

-- Table de connexions logiciels (Cegid, Sage, etc.)
CREATE TABLE IF NOT EXISTS integration_connexions (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_id    UUID  REFERENCES dossiers(id) ON DELETE SET NULL,
  provider      TEXT  NOT NULL,  -- 'cegid_loop'|'sage50'|'quickbooks'
  statut        TEXT  NOT NULL DEFAULT 'inactif',  -- 'connecte'|'erreur'|'inactif'
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  derniere_synchro TIMESTAMPTZ,
  meta          JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_connexions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own connexions" ON integration_connexions;
CREATE POLICY "Users manage own connexions" ON integration_connexions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_integration_connexions_user ON integration_connexions(user_id);
