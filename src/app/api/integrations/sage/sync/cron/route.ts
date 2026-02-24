import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChiftJournalEntries } from '@/lib/integrations/chift'
import type { ChiftJournalEntry } from '@/lib/integrations/chift'

interface IntegrationRow {
  id: string
  cabinet_id: string
  config: { chift_company_id?: string }
  last_sync_at: string | null
}

/**
 * GET /api/integrations/sage/sync/cron
 * Appelé par Vercel Cron à 2h00 — synchro toutes les intégrations Sage actives.
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
    .select('id, cabinet_id, config, last_sync_at')
    .eq('provider', 'sage')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: Array<{ cabinet_id: string; synced: number; error?: string }> = []

  for (const integration of (integrations ?? []) as IntegrationRow[]) {
    const companyId = integration.config?.chift_company_id
    if (!companyId) continue

    try {
      const dateFin = new Date().toISOString().split('T')[0]
      const dateDebut = integration.last_sync_at
        ? new Date(integration.last_sync_at).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const entries: ChiftJournalEntry[] = await getChiftJournalEntries(companyId, dateDebut, dateFin)
      let synced = 0

      for (const entry of entries) {
        for (const line of entry.lines) {
          const { error: upsertErr } = await supabaseAdmin
            .from('erp_ecritures')
            .upsert(
              {
                cabinet_id: integration.cabinet_id,
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
          if (!upsertErr) synced++
        }
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
