import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/integrations/cegid'
import { encryptToken, isEncryptionConfigured } from '@/lib/crypto'

/**
 * GET /api/integrations/cegid/callback
 * Callback OAuth2 Cegid — reçoit code + state, échange contre des tokens,
 * chiffre et stocke dans integrations_erp, puis redirige vers /parametres/integrations.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const baseUrl = new URL(request.url).origin

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/parametres/integrations?error=cegid_no_code`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?redirect=/parametres/integrations`)
  }

  if (!isEncryptionConfigured()) {
    return NextResponse.redirect(
      `${baseUrl}/parametres/integrations?error=encryption_not_configured`
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase
      .from('integrations_erp')
      .upsert(
        {
          cabinet_id: user.id,
          provider: 'cegid',
          access_token: encryptToken(tokens.access_token),
          refresh_token: encryptToken(tokens.refresh_token),
          token_expires_at: expiresAt,
          sync_status: 'idle',
          sync_error: null,
        },
        { onConflict: 'cabinet_id,provider' }
      )

    return NextResponse.redirect(`${baseUrl}/parametres/integrations?connected=cegid`)
  } catch (err) {
    const msg = err instanceof Error ? encodeURIComponent(err.message) : 'erreur_inconnue'
    return NextResponse.redirect(
      `${baseUrl}/parametres/integrations?error=cegid_callback&detail=${msg}`
    )
  }
}
