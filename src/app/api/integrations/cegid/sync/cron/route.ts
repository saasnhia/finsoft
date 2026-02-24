import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exportEcritures, refreshCegidToken } from '@/lib/integrations/cegid'
import { decryptToken, encryptToken } from '@/lib/crypto'
import type { EcritureComptable } from '@/lib/integrations/cegid'

interface IntegrationRow {
  id: string
  cabinet_id: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  last_sync_at: string | null
}

/**
 * GET /api/integrations/cegid/sync/cron
 * Appelé par Vercel Cron à 2h00 — synchro toutes les intégrations Cegid actives.
 * Utilise le service role pour accéder à tous les cabinets (contourne RLS).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: integrations, error } = await supabaseAdmin
    .from('integrations_erp')
    .select('id, cabinet_id, access_token, refresh_token, token_expires_at, last_sync_at')
    .eq('provider', 'cegid')
    .not('access_token', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: Array<{ cabinet_id: string; synced: number; error?: string }> = []

  for (const integration of (integrations ?? []) as IntegrationRow[]) {
    try {
      let accessToken = decryptToken(integration.access_token!)

      // Rafraîchit si expiré
      if (integration.token_expires_at && new Date(integration.token_expires_at) <= new Date()) {
        if (!integration.refresh_token) throw new Error('Refresh token manquant')
        const refreshed = await refreshCegidToken(decryptToken(integration.refresh_token))
        accessToken = refreshed.access_token
        await supabaseAdmin
          .from('integrations_erp')
          .update({
            access_token: encryptToken(refreshed.access_token),
            refresh_token: encryptToken(refreshed.refresh_token),
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq('id', integration.id)
      }

      const dateFin = new Date().toISOString().split('T')[0]
      const dateDebut = integration.last_sync_at
        ? new Date(integration.last_sync_at).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const ecritures: EcritureComptable[] = await exportEcritures(accessToken, dateDebut, dateFin)
      let synced = 0

      for (const e of ecritures) {
        const { error: upsertErr } = await supabaseAdmin
          .from('erp_ecritures')
          .upsert(
            {
              cabinet_id: integration.cabinet_id,
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
        if (!upsertErr) synced++
      }

      await supabaseAdmin
        .from('integrations_erp')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
          synced_count: synced,
          sync_error: null,
        })
        .eq('id', integration.id)

      results.push({ cabinet_id: integration.cabinet_id, synced })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      await supabaseAdmin
        .from('integrations_erp')
        .update({ sync_status: 'error', sync_error: message })
        .eq('id', integration.id)
      results.push({ cabinet_id: integration.cabinet_id, synced: 0, error: message })
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results })
}
