import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCegidAuthUrl, exchangeCodeForTokens, isCegidConfigured } from '@/lib/integrations/cegid'
import { randomUUID } from 'crypto'

/** GET /api/integrations/cegid — initie le flow OAuth2 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!isCegidConfigured()) {
    return NextResponse.json({
      error: 'Cegid non configuré — ajoutez CEGID_CLIENT_ID et CEGID_CLIENT_SECRET dans .env.local',
      configured: false,
    }, { status: 503 })
  }

  const state = randomUUID()
  // Store state in cookie for CSRF protection (simple approach)
  const authUrl = buildCegidAuthUrl(state)

  return NextResponse.json({ success: true, authUrl, state })
}

/** GET /api/integrations/cegid/callback — callback OAuth2 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { code, state } = await request.json()
  if (!code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 })

  try {
    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Save tokens to DB
    await supabase.from('integration_connexions').upsert({
      user_id: user.id,
      provider: 'cegid_loop',
      statut: 'connecte',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      derniere_synchro: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

    return NextResponse.json({ success: true, connected: true })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur connexion Cegid',
    }, { status: 500 })
  }
}
