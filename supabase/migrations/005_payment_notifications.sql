-- ============================================
-- Phase 8 : Notifications de paiement & Rappels email
-- Migration idempotente
-- ============================================

-- ─── 1. Table des clients ───
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nom text NOT NULL,
  email text,
  telephone text,
  adresse text,
  siren text,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_user_policy') THEN
    CREATE POLICY clients_user_policy ON clients FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(user_id, nom);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_clients_updated_at') THEN
    CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── 2. Table des factures clients (ventes) ───
CREATE TABLE IF NOT EXISTS factures_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Informations facture
  numero_facture text NOT NULL,
  objet text,
  montant_ht numeric(12,2) NOT NULL DEFAULT 0,
  tva numeric(12,2) NOT NULL DEFAULT 0,
  montant_ttc numeric(12,2) NOT NULL DEFAULT 0,

  -- Dates
  date_emission date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance date NOT NULL,

  -- Paiement
  statut_paiement text NOT NULL DEFAULT 'en_attente'
    CHECK (statut_paiement IN ('en_attente', 'payee', 'en_retard', 'partiellement_payee')),
  montant_paye numeric(12,2) NOT NULL DEFAULT 0,
  date_dernier_paiement date,

  -- Rappels
  nombre_rappels_envoyes integer NOT NULL DEFAULT 0,
  date_dernier_rappel timestamptz,

  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE factures_clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factures_clients' AND policyname = 'factures_clients_user_policy') THEN
    CREATE POLICY factures_clients_user_policy ON factures_clients FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_factures_clients_user_id ON factures_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_clients_client_id ON factures_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_clients_statut ON factures_clients(user_id, statut_paiement);
CREATE INDEX IF NOT EXISTS idx_factures_clients_echeance ON factures_clients(date_echeance)
  WHERE statut_paiement IN ('en_attente', 'en_retard', 'partiellement_payee');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_factures_clients_updated_at') THEN
    CREATE TRIGGER set_factures_clients_updated_at BEFORE UPDATE ON factures_clients
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── 3. Table des rappels email envoyés ───
CREATE TABLE IF NOT EXISTS rappels_email (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facture_client_id uuid NOT NULL REFERENCES factures_clients(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Type de rappel
  type_rappel text NOT NULL
    CHECK (type_rappel IN ('rappel_7j', 'rappel_15j', 'rappel_30j', 'mise_en_demeure', 'manuel')),

  -- Contenu email
  email_destinataire text NOT NULL,
  sujet text NOT NULL,
  contenu text NOT NULL,

  -- Statut envoi
  statut_envoi text NOT NULL DEFAULT 'en_attente'
    CHECK (statut_envoi IN ('envoye', 'echoue', 'en_attente')),
  resend_message_id text,
  erreur text,

  date_envoi timestamptz DEFAULT now(),

  created_at timestamptz DEFAULT now()
);

ALTER TABLE rappels_email ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rappels_email' AND policyname = 'rappels_email_user_policy') THEN
    CREATE POLICY rappels_email_user_policy ON rappels_email FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rappels_email_user_id ON rappels_email(user_id);
CREATE INDEX IF NOT EXISTS idx_rappels_email_facture ON rappels_email(facture_client_id);
CREATE INDEX IF NOT EXISTS idx_rappels_email_client ON rappels_email(client_id);

-- ─── 4. Fonction pour mettre à jour automatiquement le statut des factures en retard ───
CREATE OR REPLACE FUNCTION update_overdue_invoices(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE factures_clients
  SET statut_paiement = 'en_retard',
      updated_at = now()
  WHERE user_id = p_user_id
    AND statut_paiement IN ('en_attente', 'partiellement_payee')
    AND date_echeance < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
