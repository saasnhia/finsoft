-- Seed: 3 dossiers de démo cabinet FinSoft
-- À exécuter dans Supabase SQL Editor une fois la migration 013 faite.
-- Remplacez :user_id par votre UUID (visible dans Authentication > Users).

DO $$
DECLARE
  v_user_id     UUID;
  v_dossier1_id UUID;
  v_dossier2_id UUID;
  v_dossier3_id UUID;
BEGIN
  -- Récupère le premier utilisateur existant (adapter si nécessaire)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé — connectez-vous d''abord à FinSoft';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- Dossier 1 : Cabinet Moreau & Associés — CA3 en retard, 2 erreurs TVA
  -- ──────────────────────────────────────────────────────────────────────
  INSERT INTO dossiers (user_id, nom, siren, secteur, regime_tva, email, telephone)
  VALUES (
    v_user_id,
    'Cabinet Moreau & Associés',
    '412 345 678',
    'Expertise comptable',
    'réel normal',
    'contact@moreau-associes.fr',
    '+33 3 80 12 34 56'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_dossier1_id;

  IF v_dossier1_id IS NULL THEN
    SELECT id INTO v_dossier1_id FROM dossiers
    WHERE user_id = v_user_id AND nom = 'Cabinet Moreau & Associés';
  END IF;

  INSERT INTO dossier_statuts (
    dossier_id, tva_status, tva_prochaine_echeance,
    nb_factures_attente, dernier_rapprochement, taux_rapprochement, ca_annuel_estime
  ) VALUES (
    v_dossier1_id,
    'retard',
    NOW() - INTERVAL '3 days',   -- CA3 dépassée il y a 3 jours
    8,
    NOW() - INTERVAL '12 days',
    78.50,
    245000.00
  )
  ON CONFLICT (dossier_id) DO UPDATE SET
    tva_status               = EXCLUDED.tva_status,
    tva_prochaine_echeance   = EXCLUDED.tva_prochaine_echeance,
    nb_factures_attente      = EXCLUDED.nb_factures_attente,
    dernier_rapprochement    = EXCLUDED.dernier_rapprochement,
    taux_rapprochement       = EXCLUDED.taux_rapprochement,
    ca_annuel_estime         = EXCLUDED.ca_annuel_estime,
    updated_at               = NOW();

  -- ──────────────────────────────────────────────────────────────────────
  -- Dossier 2 : Boulangerie Martin SAS — 5 factures en attente, rapprochement 94%
  -- ──────────────────────────────────────────────────────────────────────
  INSERT INTO dossiers (user_id, nom, siren, secteur, regime_tva, email, telephone)
  VALUES (
    v_user_id,
    'Boulangerie Martin SAS',
    '523 456 789',
    'Alimentation / Commerce',
    'réel simplifié',
    'martin.boulangerie@gmail.com',
    '+33 3 85 21 43 65'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_dossier2_id;

  IF v_dossier2_id IS NULL THEN
    SELECT id INTO v_dossier2_id FROM dossiers
    WHERE user_id = v_user_id AND nom = 'Boulangerie Martin SAS';
  END IF;

  INSERT INTO dossier_statuts (
    dossier_id, tva_status, tva_prochaine_echeance,
    nb_factures_attente, dernier_rapprochement, taux_rapprochement, ca_annuel_estime
  ) VALUES (
    v_dossier2_id,
    'ok',
    NOW() + INTERVAL '18 days',
    5,
    NOW() - INTERVAL '2 days',
    94.20,
    380000.00
  )
  ON CONFLICT (dossier_id) DO UPDATE SET
    tva_status               = EXCLUDED.tva_status,
    tva_prochaine_echeance   = EXCLUDED.tva_prochaine_echeance,
    nb_factures_attente      = EXCLUDED.nb_factures_attente,
    dernier_rapprochement    = EXCLUDED.dernier_rapprochement,
    taux_rapprochement       = EXCLUDED.taux_rapprochement,
    ca_annuel_estime         = EXCLUDED.ca_annuel_estime,
    updated_at               = NOW();

  -- ──────────────────────────────────────────────────────────────────────
  -- Dossier 3 : Garage Dupont SARL — tout à jour, tout vert
  -- ──────────────────────────────────────────────────────────────────────
  INSERT INTO dossiers (user_id, nom, siren, secteur, regime_tva, email, telephone)
  VALUES (
    v_user_id,
    'Garage Dupont SARL',
    '634 567 890',
    'Automobile / Services',
    'réel normal',
    'dupont.garage@beaune21.fr',
    '+33 3 80 45 67 89'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_dossier3_id;

  IF v_dossier3_id IS NULL THEN
    SELECT id INTO v_dossier3_id FROM dossiers
    WHERE user_id = v_user_id AND nom = 'Garage Dupont SARL';
  END IF;

  INSERT INTO dossier_statuts (
    dossier_id, tva_status, tva_prochaine_echeance,
    nb_factures_attente, dernier_rapprochement, taux_rapprochement, ca_annuel_estime
  ) VALUES (
    v_dossier3_id,
    'ok',
    NOW() + INTERVAL '25 days',
    0,
    NOW() - INTERVAL '1 day',
    99.80,
    520000.00
  )
  ON CONFLICT (dossier_id) DO UPDATE SET
    tva_status               = EXCLUDED.tva_status,
    tva_prochaine_echeance   = EXCLUDED.tva_prochaine_echeance,
    nb_factures_attente      = EXCLUDED.nb_factures_attente,
    dernier_rapprochement    = EXCLUDED.dernier_rapprochement,
    taux_rapprochement       = EXCLUDED.taux_rapprochement,
    ca_annuel_estime         = EXCLUDED.ca_annuel_estime,
    updated_at               = NOW();

  RAISE NOTICE 'Seed démo OK — 3 dossiers insérés pour user %', v_user_id;
END $$;
