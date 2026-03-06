-- 033: Fix onboarding_completed pour les utilisateurs avec abonnement actif
-- Corrige le bug où des utilisateurs payants ont onboarding_completed=false
-- et se retrouvent bloqués sur la page d'onboarding.

-- 1. Corriger tous les users ayant une subscription active/trialing
--    mais onboarding_completed = false
UPDATE user_profiles
SET    onboarding_completed = true
WHERE  onboarding_completed = false
  AND  (
    subscription_status IN ('active', 'trial')
    OR id IN (
      SELECT user_id FROM subscriptions
      WHERE status IN ('active', 'trialing')
    )
  );

-- 2. Corriger les users ayant un plan payant mais onboarding_completed = false
UPDATE user_profiles
SET    onboarding_completed = true
WHERE  onboarding_completed = false
  AND  plan IN ('basique', 'essentiel', 'premium', 'cabinet_premium');
