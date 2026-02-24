import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isChiftConfigured } from '@/lib/integrations/chift'

/**
 * GET /api/integrations/sage/status
 * Retourne le statut de connexion Sage (via Chift) pour le cabinet connecté.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: integration } = await supabase
    .from('integrations_erp')
    .select('sync_status, last_sync_at, synced_count, sync_error, config')
    .eq('cabinet_id', user.id)
    .eq('provider', 'sage')
    .maybeSingle()

  const config = integration?.config as { chift_company_id?: string } | null

  return NextResponse.json({
    success: true,
    configured: isChiftConfigured(),
    connected: !!integration && !!config?.chift_company_id,
    chift_company_id: config?.chift_company_id ?? null,
    sync_status: integration?.sync_status ?? 'idle',
    last_sync_at: integration?.last_sync_at ?? null,
    synced_count: integration?.synced_count ?? 0,
    sync_error: integration?.sync_error ?? null,
  })
}
