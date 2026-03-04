import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyQuota, getMonthlyUsage } from '@/lib/ai-quota'

/**
 * GET /api/usage/ai
 * Retourne l'usage IA du mois courant et le quota selon le plan.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Récupérer le plan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan as string) ?? 'basique'
  const used = await getMonthlyUsage(supabase, user.id)
  const quota = getMonthlyQuota(plan)

  return NextResponse.json({ used, quota, plan })
}
