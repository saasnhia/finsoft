import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface EntrepriseDashboardData {
  success: true
  kpis: {
    solde_bancaire: number
    charges_mois: number
    factures_attente: number
    economies_automatisation: number
  }
  chart_6m: ChartEntry[]
}

export interface ChartEntry {
  mois: string        // 'YYYY-MM'
  achats: number      // compte 60x
  services: number    // compte 61x, 62x
  personnel: number   // compte 64x
  autres: number      // autres 6xx
}

/**
 * GET /api/entreprise/dashboard
 * KPIs + graphique 6 mois dépenses par catégorie PCG — mode entreprise
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]
  const sixMonthsAgo = new Date(year, month - 5, 1).toISOString().split('T')[0]

  const [
    soldeBancaireRes,
    chargesMoisRes,
    facturesAttenteRes,
    economiesRes,
    chart6mRes,
  ] = await Promise.allSettled([
    // Solde bancaire — somme des comptes actifs
    supabase
      .from('comptes_bancaires')
      .select('current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true),

    // Charges du mois — factures du mois courant
    supabase
      .from('factures')
      .select('montant_ttc')
      .eq('user_id', user.id)
      .gte('date_facture', firstOfMonth)
      .lte('date_facture', lastOfMonth)
      .not('montant_ttc', 'is', null),

    // Factures clients en attente — count
    supabase
      .from('factures_clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('statut_paiement', 'en_attente'),

    // Économies automatisation — actions appliquées ce mois
    supabase
      .from('automation_log')
      .select('id')
      .eq('user_id', user.id)
      .in('action_type', ['rule_applied', 'categorization_applied'])
      .gte('created_at', firstOfMonth),

    // Dépenses 6 derniers mois — avec compte_comptable
    supabase
      .from('factures')
      .select('date_facture, montant_ttc, compte_comptable')
      .eq('user_id', user.id)
      .gte('date_facture', sixMonthsAgo)
      .lte('date_facture', lastOfMonth)
      .not('montant_ttc', 'is', null),
  ])

  // ── Solde bancaire ─────────────────────────────────────────────────────────
  const comptes = soldeBancaireRes.status === 'fulfilled'
    ? (soldeBancaireRes.value.data ?? [])
    : []
  const soldeBancaire = comptes.reduce((s, c) => s + (c.current_balance ?? 0), 0)

  // ── Charges du mois ────────────────────────────────────────────────────────
  const chargesRows = chargesMoisRes.status === 'fulfilled'
    ? (chargesMoisRes.value.data ?? [])
    : []
  const chargesMois = chargesRows.reduce((s, r) => s + (r.montant_ttc ?? 0), 0)

  // ── Factures en attente ────────────────────────────────────────────────────
  const facturesAttente = facturesAttenteRes.status === 'fulfilled'
    ? (facturesAttenteRes.value.data ?? []).length
    : 0

  // ── Économies automatisation : €15 estimés par action ─────────────────────
  const actionsCount = economiesRes.status === 'fulfilled'
    ? (economiesRes.value.data ?? []).length
    : 0
  const economiesAutomatisation = actionsCount * 15

  // ── Graphique 6 mois ───────────────────────────────────────────────────────
  const monthLabels: string[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 5 + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const chartByMonth: Record<string, ChartEntry> = {}
  for (const label of monthLabels) {
    chartByMonth[label] = { mois: label, achats: 0, services: 0, personnel: 0, autres: 0 }
  }

  const depensesRows = chart6mRes.status === 'fulfilled'
    ? (chart6mRes.value.data ?? [])
    : []

  for (const row of depensesRows) {
    if (!row.date_facture || !row.montant_ttc) continue
    const moisKey = (row.date_facture as string).slice(0, 7)
    if (!chartByMonth[moisKey]) continue
    const compte = String(row.compte_comptable ?? '')
    const classe2 = compte.slice(0, 2)
    const montant = row.montant_ttc as number
    if (classe2 === '60') chartByMonth[moisKey].achats += montant
    else if (classe2 === '61' || classe2 === '62') chartByMonth[moisKey].services += montant
    else if (classe2 === '64') chartByMonth[moisKey].personnel += montant
    else if (compte[0] === '6') chartByMonth[moisKey].autres += montant
  }

  return NextResponse.json({
    success: true,
    kpis: {
      solde_bancaire: soldeBancaire,
      charges_mois: chargesMois,
      factures_attente: facturesAttente,
      economies_automatisation: economiesAutomatisation,
    },
    chart_6m: monthLabels.map(m => chartByMonth[m]),
  } satisfies EntrepriseDashboardData)
}
