-- ============================================================
-- Migration 031 — Nettoyage colonne subscription_plan (dead code)
-- ============================================================

-- 1. Supprimer la colonne subscription_plan (jamais lue ni écrite par l'app)
--    Ajoutée par migration 016 avec CHECK ('solo', 'cabinet', 'entreprise')
--    Obsolète depuis migration 020 (plan renommé) et 021 (subscriptions table)
ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS subscription_plan;

-- 2. S'assurer que tous les user_profiles ont un plan valide
--    Remettre à 'starter' tout plan NULL ou invalide
UPDATE public.user_profiles
  SET plan = 'starter'
  WHERE plan IS NULL
     OR plan NOT IN ('starter', 'cabinet', 'pro');

-- 3. S'assurer que subscription_status a une valeur valide
UPDATE public.user_profiles
  SET subscription_status = 'inactive'
  WHERE subscription_status IS NULL
     OR subscription_status NOT IN ('active', 'inactive', 'trial', 'cancelled');

-- ============================================================
-- END Migration 031
-- ============================================================
