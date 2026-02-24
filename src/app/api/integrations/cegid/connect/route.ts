import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCegidAuthUrl, isCegidConfigured } from '@/lib/integrations/cegid'
import { randomUUID } from 'crypto'

/**
 * POST /api/integrations/cegid/connect
 * Retourne l'URL OAuth2 Cegid Loop pour initier la connexion du cabinet.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!isCegidConfigured()) {
    return NextResponse.json({
      error: 'Cegid non configuré — ajoutez CEGID_CLIENT_ID et CEGID_CLIENT_SECRET',
      configured: false,
    }, { status: 503 })
  }

  const state = randomUUID()
  const authUrl = buildCegidAuthUrl(state)

  return NextResponse.json({ success: true, authUrl, state })
}
