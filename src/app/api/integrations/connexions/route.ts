import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/integrations/connexions */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await supabase
    .from('integration_connexions')
    .select('id, provider, statut, derniere_synchro')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ success: true, connexions: data ?? [] })
}
