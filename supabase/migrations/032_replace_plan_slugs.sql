-- ============================================================
-- Migration 032 — Remplacement des slugs de plans
-- starter → basique, cabinet → cabinet_essentiel, pro → premium
-- Ajout des nouveaux tiers : essentiel, cabinet_premium
-- ============================================================

-- 1. Supprimer les anciennes contraintes
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_plan_check;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 2. Renommer les valeurs existantes dans user_profiles
UPDATE public.user_profiles SET plan = 'basique'           WHERE plan = 'starter';
UPDATE public.user_profiles SET plan = 'cabinet_essentiel' WHERE plan = 'cabinet';
UPDATE public.user_profiles SET plan = 'premium'           WHERE plan = 'pro';
-- Legacy
UPDATE public.user_profiles SET plan = 'basique'           WHERE plan = 'solo';
UPDATE public.user_profiles SET plan = 'premium'           WHERE plan = 'entreprise';

-- 3. Renommer les valeurs existantes dans subscriptions
UPDATE public.subscriptions SET plan = 'basique'           WHERE plan = 'starter';
UPDATE public.subscriptions SET plan = 'cabinet_essentiel' WHERE plan = 'cabinet';
UPDATE public.subscriptions SET plan = 'premium'           WHERE plan = 'pro';

-- 4. Nouvelles contraintes CHECK
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('basique', 'essentiel', 'premium', 'cabinet_essentiel', 'cabinet_premium'));

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('basique', 'essentiel', 'premium', 'cabinet_essentiel', 'cabinet_premium'));

-- 5. Mettre à jour la valeur par défaut
ALTER TABLE public.user_profiles
  ALTER COLUMN plan SET DEFAULT 'basique';

-- 6. Mettre à jour le trigger de création de compte
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, plan, factures_limit, max_users)
  VALUES (NEW.id, 'basique', 300, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Supprimer la colonne morte subscription_plan (migration 031 prévue, appliquée ici)
ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS subscription_plan;

-- ============================================================
-- END Migration 032
-- ============================================================
