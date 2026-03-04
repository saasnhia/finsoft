import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Quota mensuel de tokens par plan.
 */
export function getMonthlyQuota(plan: string): number {
  switch (plan) {
    case 'basique':           return 50_000
    case 'essentiel':         return 200_000
    case 'cabinet_essentiel': return 200_000
    case 'premium':           return 999_999_999
    case 'cabinet_premium':   return 999_999_999
    default:                  return 50_000
  }
}

/**
 * Modèle Anthropic selon le plan utilisateur.
 * Plan basique → Haiku (rapide, économique)
 * Autres → Sonnet (performant)
 */
export function getModelForPlan(plan: string): string {
  switch (plan) {
    case 'basique':  return 'claude-haiku-4-5-20251001'
    default:         return 'claude-sonnet-4-5-20241022'
  }
}

/**
 * Vérifie le quota mensuel et consomme des tokens.
 * Retourne true si OK, false si quota dépassé.
 */
export async function checkAndConsumeTokens(
  supabase: SupabaseClient,
  userId: string,
  tokensToUse: number,
  plan: string,
  model: string,
  endpoint: 'assistant' | 'agent',
): Promise<boolean> {
  const quota = getMonthlyQuota(plan)

  // Lire usage du mois courant
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('ai_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const totalUsed = (data ?? []).reduce((sum, row) => sum + (row.tokens_used as number), 0)

  if (totalUsed + tokensToUse > quota) {
    return false
  }

  // Enregistrer la consommation
  await supabase.from('ai_usage').insert({
    user_id: userId,
    tokens_used: tokensToUse,
    model,
    endpoint,
  })

  return true
}

/**
 * Récupère l'usage du mois courant pour un utilisateur.
 */
export async function getMonthlyUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('ai_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  return (data ?? []).reduce((sum, row) => sum + (row.tokens_used as number), 0)
}
