-- ═══════════════════════════════════════════════════════════════
-- Migration 025 — Immobilisations, Analytique, Achats, Notes de frais
-- ═══════════════════════════════════════════════════════════════

-- ── 1. IMMOBILISATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS immobilisations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  designation           TEXT NOT NULL,
  categorie             TEXT NOT NULL,
  date_acquisition      DATE NOT NULL,
  valeur_brute          NUMERIC(15,2) NOT NULL,
  duree_amortissement   INTEGER NOT NULL, -- en années
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE immobilisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "immobilisations_user" ON immobilisations;
CREATE POLICY "immobilisations_user" ON immobilisations
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. EMPRUNTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emprunts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  libelle               TEXT NOT NULL,
  banque                TEXT NOT NULL,
  capital_initial       NUMERIC(15,2) NOT NULL,
  capital_restant       NUMERIC(15,2) NOT NULL,
  taux_annuel           NUMERIC(8,4) NOT NULL, -- en %
  duree_mois            INTEGER NOT NULL,
  date_debut            DATE NOT NULL,
  assurance_mensuelle   NUMERIC(8,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE emprunts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emprunts_user" ON emprunts;
CREATE POLICY "emprunts_user" ON emprunts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. AXES ANALYTIQUES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS axes_analytiques (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE axes_analytiques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "axes_analytiques_user" ON axes_analytiques;
CREATE POLICY "axes_analytiques_user" ON axes_analytiques
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. CODES ANALYTIQUES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS codes_analytiques (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  axe_id     UUID NOT NULL REFERENCES axes_analytiques(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  libelle    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE codes_analytiques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "codes_analytiques_user" ON codes_analytiques;
CREATE POLICY "codes_analytiques_user" ON codes_analytiques
  USING (
    EXISTS (
      SELECT 1 FROM axes_analytiques a
      WHERE a.id = codes_analytiques.axe_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM axes_analytiques a
      WHERE a.id = codes_analytiques.axe_id AND a.user_id = auth.uid()
    )
  );

-- ── 5. AFFECTATIONS ANALYTIQUES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS affectations_analytiques (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID, -- optional FK to transactions
  code_analytique_id  UUID NOT NULL REFERENCES codes_analytiques(id) ON DELETE CASCADE,
  pourcentage         NUMERIC(5,2) NOT NULL DEFAULT 100,
  montant             NUMERIC(15,2) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE affectations_analytiques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affectations_analytiques_user" ON affectations_analytiques;
CREATE POLICY "affectations_analytiques_user" ON affectations_analytiques
  USING (
    EXISTS (
      SELECT 1 FROM codes_analytiques ca
      JOIN axes_analytiques a ON a.id = ca.axe_id
      WHERE ca.id = affectations_analytiques.code_analytique_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM codes_analytiques ca
      JOIN axes_analytiques a ON a.id = ca.axe_id
      WHERE ca.id = affectations_analytiques.code_analytique_id AND a.user_id = auth.uid()
    )
  );

-- ── 6. DEMANDES D'ACHAT ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demandes_achat (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_da          TEXT NOT NULL,
  fournisseur_nom    TEXT,
  description        TEXT NOT NULL,
  montant_estime     NUMERIC(15,2) NOT NULL DEFAULT 0,
  statut             TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon','en_attente','approuve','bc_emis','receptionne','facture','cloture','refuse')),
  demandeur_nom      TEXT,
  approbateur_nom    TEXT,
  date_demande       DATE NOT NULL DEFAULT CURRENT_DATE,
  date_approbation   DATE,
  motif_refus        TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE demandes_achat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demandes_achat_user" ON demandes_achat;
CREATE POLICY "demandes_achat_user" ON demandes_achat
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 7. SEUILS D'APPROBATION ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS seuils_approbation (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  montant_min      NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_max      NUMERIC(15,2),
  approbateur_nom  TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE seuils_approbation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seuils_approbation_user" ON seuils_approbation;
CREATE POLICY "seuils_approbation_user" ON seuils_approbation
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 8. NOTES DE FRAIS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes_frais (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_depense         DATE NOT NULL,
  categorie            TEXT NOT NULL,
  description          TEXT NOT NULL,
  montant_ttc          NUMERIC(15,2) NOT NULL,
  tva_recuperable      NUMERIC(15,2) DEFAULT 0,
  montant_ht           NUMERIC(15,2),
  justificatif_url     TEXT,
  code_analytique_id   UUID REFERENCES codes_analytiques(id),
  statut               TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon','en_attente','valide','rembourse','refuse')),
  validateur_id        UUID REFERENCES auth.users(id),
  kilometrage          NUMERIC(8,1),
  puissance_fiscale    INTEGER,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notes_frais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_frais_user" ON notes_frais;
CREATE POLICY "notes_frais_user" ON notes_frais
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
