import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rapprochement/stats
 * KPIs légers pour le widget rapprochement du dashboard et la page transactions
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Run all queries in parallel
    const [txResult, rapResult] = await Promise.all([
      // Total expense transactions (those that can be reconciled)
      supabase
        .from('transactions')
        .select('id, status', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('type', 'expense'),

      // All rapprochements for this user
      supabase
        .from('rapprochements_factures')
        .select('transaction_id, statut, type, confidence_score')
        .eq('user_id', user.id),
    ])

    const transactions = txResult.data ?? []
    const raps = rapResult.data ?? []
    const total = transactions.length

    // Build fast lookup: transaction_id → rapprochement
    const rapMap = new Map(raps.map(r => [r.transaction_id, r]))

    let reconciled = 0
    let with_suggestion = 0
    let unreconciled = 0

    for (const tx of transactions) {
      const rap = rapMap.get(tx.id)
      if (!rap) {
        unreconciled++
      } else if (rap.statut === 'valide') {
        reconciled++
      } else if (rap.statut === 'suggestion') {
        with_suggestion++
      } else {
        // rejete or other → unreconciled
        unreconciled++
      }
    }

    const pct_reconciled = total > 0 ? Math.round((reconciled / total) * 100) : 0

    // Recent automation log count (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    const { count: recent_actions } = await supabase
      .from('automation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('action_type', ['auto_match', 'match_suggested'])
      .gte('created_at', since)

    return NextResponse.json({
      total,
      reconciled,
      with_suggestion,
      unreconciled,
      pct_reconciled,
      recent_auto_actions: recent_actions ?? 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
