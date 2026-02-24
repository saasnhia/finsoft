import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChiftJournalEntries } from '@/lib/integrations/chift'
import type { ChiftJournalEntry } from '@/lib/integrations/chift'

interface IntegrationRow {
  id: string
  config: { chift_company_id?: string }
  last_sync_at: string | null
}

/**
 * POST /api/integrations/sage/sync
 * Synchronise manuellement les écritures Sage 50 via Chift pour le cabinet connecté.
 * Retourne { synced_count, errors[] }.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: integration, error: loadErr } = await supabase
    .from('integrations_erp')
    .select('id, config, last_sync_at')
    .eq('cabinet_id', user.id)
    .eq('provider', 'sage')
    .maybeSingle<IntegrationRow>()

  if (loadErr || !integration) {
    return NextResponse.json(
      { error: 'Intégration Sage non trouvée — configurez votre Chift company ID' },
      { status: 404 }
    )
  }

  const companyId = integration.config?.chift_company_id
  if (!companyId) {
    return NextResponse.json(
      { error: 'Chift company_id manquant — reconnectez votre compte Sage' },
      { status: 400 }
    )
  }

  // Marque le statut syncing
  await supabase
    .from('integrations_erp')
    .update({ sync_status: 'syncing', sync_error: null })
    .eq('id', integration.id)

  try {
    const dateFin = new Date().toISOString().split('T')[0]
    const dateDebut = integration.last_sync_at
      ? new Date(integration.last_sync_at).toISOString().split('T')[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const entries: ChiftJournalEntry[] = await getChiftJournalEntries(companyId, dateDebut, dateFin)

    const errors: string[] = []
    let synced = 0

    for (const entry of entries) {
      // Chaque journal entry peut avoir plusieurs lignes (débit/crédit)
      for (const line of entry.lines) {
        const { error: upsertErr } = await supabase
          .from('erp_ecritures')
          .upsert(
            {
              cabinet_id: user.id,
              provider: 'sage',
              external_id: `${entry.id}-${line.accountCode}`,
              ecriture_date: entry.date,
              journal_code: entry.reference,
              compte_num: line.accountCode,
              compte_lib: line.accountName,
              debit: line.debit,
              credit: line.credit,
              libelle: line.label,
              piece_ref: entry.reference,
              raw: entry as unknown as Record<string, unknown>,
            },
            { onConflict: 'cabinet_id,provider,external_id', ignoreDuplicates: true }
          )
        if (upsertErr) errors.push(upsertErr.message)
        else synced++
      }
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
    const message = err instanceof Error ? err.message : 'Erreur sync Sage'
    await supabase
      .from('integrations_erp')
      .update({ sync_status: 'error', sync_error: message })
      .eq('id', integration.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
