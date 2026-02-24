import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCegidConfigured } from '@/lib/integrations/cegid'

/**
 * GET /api/integrations/cegid/status
 * Retourne le statut de connexion Cegid pour le cabinet connecté.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: integration } = await supabase
    .from('integrations_erp')
    .select('sync_status, last_sync_at, synced_count, sync_error, token_expires_at')
    .eq('cabinet_id', user.id)
    .eq('provider', 'cegid')
    .maybeSingle()

  return NextResponse.json({
    success: true,
    configured: isCegidConfigured(),
    connected: !!integration,
    sync_status: integration?.sync_status ?? 'idle',
    last_sync_at: integration?.last_sync_at ?? null,
    synced_count: integration?.synced_count ?? 0,
    sync_error: integration?.sync_error ?? null,
  })
}
