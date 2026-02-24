import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportEcritures, refreshCegidToken } from '@/lib/integrations/cegid'
import { decryptToken, encryptToken } from '@/lib/crypto'
import type { EcritureComptable } from '@/lib/integrations/cegid'

interface IntegrationRow {
  id: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  last_sync_at: string | null
}

/**
 * POST /api/integrations/cegid/sync
 * Synchronise manuellement les écritures Cegid pour le cabinet connecté.
 * Retourne { synced_count, errors[] }.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: integration, error: loadErr } = await supabase
    .from('integrations_erp')
    .select('id, access_token, refresh_token, token_expires_at, last_sync_at')
    .eq('cabinet_id', user.id)
    .eq('provider', 'cegid')
    .maybeSingle<IntegrationRow>()

  if (loadErr || !integration) {
    return NextResponse.json({ error: 'Intégration Cegid non trouvée — connectez votre compte' }, { status: 404 })
  }
  if (!integration.access_token) {
    return NextResponse.json({ error: 'Tokens Cegid manquants — reconnectez votre compte' }, { status: 400 })
  }

  // Marque le statut syncing
  await supabase
    .from('integrations_erp')
    .update({ sync_status: 'syncing', sync_error: null })
    .eq('id', integration.id)

  try {
    let accessToken = decryptToken(integration.access_token)

    // Rafraîchit le token si expiré
    if (integration.token_expires_at && new Date(integration.token_expires_at) <= new Date()) {
      if (!integration.refresh_token) throw new Error('Refresh token manquant — reconnectez votre compte Cegid')
      const refreshed = await refreshCegidToken(decryptToken(integration.refresh_token))
      accessToken = refreshed.access_token
      await supabase
        .from('integrations_erp')
        .update({
          access_token: encryptToken(refreshed.access_token),
          refresh_token: encryptToken(refreshed.refresh_token),
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id)
    }

    // Plage de dates : depuis dernière sync ou 30 derniers jours
    const dateFin = new Date().toISOString().split('T')[0]
    const dateDebut = integration.last_sync_at
      ? new Date(integration.last_sync_at).toISOString().split('T')[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const ecritures: EcritureComptable[] = await exportEcritures(accessToken, dateDebut, dateFin)

    const errors: string[] = []
    let synced = 0

    for (const e of ecritures) {
      const { error: upsertErr } = await supabase
        .from('erp_ecritures')
        .upsert(
          {
            cabinet_id: user.id,
            provider: 'cegid',
            external_id: e.numeroEcriture,
            ecriture_date: e.dateEcriture,
            journal_code: e.journalCode,
            compte_num: e.compteDebit,
            debit: e.montant,
            credit: 0,
            libelle: e.libelle,
            piece_ref: e.pieceRef ?? null,
            raw: e as unknown as Record<string, unknown>,
          },
          { onConflict: 'cabinet_id,provider,external_id', ignoreDuplicates: true }
        )
      if (upsertErr) errors.push(upsertErr.message)
      else synced++
    }

    await supabase
      .from('integrations_erp')
      .update({
        sync_status: errors.length > 0 ? 'error' : 'success',
        last_sync_at: new Date().toISOString(),
        synced_count: synced,
        sync_error: errors.length > 0 ? errors.slice(0, 3).join(' | ') : null,
      })
      .eq('id', integration.id)

    return NextResponse.json({ success: true, synced_count: synced, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur sync Cegid'
    await supabase
      .from('integrations_erp')
      .update({ sync_status: 'error', sync_error: message })
      .eq('id', integration.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
