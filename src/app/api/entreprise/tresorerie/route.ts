import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface FluxItem {
  date: string
  libelle: string
  montant: number   // positif = entrée, négatif = sortie
  type: 'historique' | 'prevision'
}

export interface TresorerieData {
  success: true
  solde_actuel: number
  projection_30j: number
  projection_60j: number
  projection_90j: number
  flux: FluxItem[]
}

/**
 * GET /api/entreprise/tresorerie
 * Solde actuel + prévisions de trésorerie 30/60/90 jours.
 *
 * Historique : transactions des 60 derniers jours (solde quotidien cumulé)
 * Prévisions : factures clients non payées (encaissements) + factures fournisseurs (décaissements)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const today = new Date()
  const today0 = today.toISOString().split('T')[0]
  const date60Ago = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60)
    .toISOString().split('T')[0]
  const date90Ahead = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90)
    .toISOString().split('T')[0]

  const [
    comptesRes,
    transactionsRes,
    facturesClientsRes,
    facturesFournisseursRes,
  ] = await Promise.allSettled([
    // Solde bancaire actuel
    supabase
      .from('comptes_bancaires')
      .select('current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true),

    // Transactions historiques (60 derniers jours)
    supabase
      .from('transactions')
      .select('date, description, amount')
      .eq('user_id', user.id)
      .gte('date', date60Ago)
      .lte('date', today0)
      .order('date', { ascending: true }),

    // Factures clients non encaissées — prévisions entrées
    supabase
      .from('factures_clients')
      .select('date_echeance, montant_ttc, montant_paye, numero_facture')
      .eq('user_id', user.id)
      .in('statut_paiement', ['en_attente', 'en_retard'])
      .not('montant_ttc', 'is', null)
      .lte('date_echeance', date90Ahead),

    // Factures fournisseurs non payées — prévisions sorties
    supabase
      .from('factures')
      .select('date_facture, montant_ttc, numero_facture, fournisseur')
      .eq('user_id', user.id)
      .neq('statut', 'payée')
      .not('montant_ttc', 'is', null)
      .order('date_facture', { ascending: true }),
  ])

  // ── Solde actuel ───────────────────────────────────────────────────────────
  const comptes = comptesRes.status === 'fulfilled' ? (comptesRes.value.data ?? []) : []
  const soldeActuel = comptes.reduce((s, c) => s + (c.current_balance ?? 0), 0)

  // ── Flux historiques ───────────────────────────────────────────────────────
  const transactions = transactionsRes.status === 'fulfilled'
    ? (transactionsRes.value.data ?? [])
    : []
  const fluxHistorique: FluxItem[] = transactions.map(t => ({
    date: t.date as string,
    libelle: t.description as string,
    montant: t.amount as number,
    type: 'historique',
  }))

  // ── Prévisions — entrées (factures clients) ────────────────────────────────
  const facturesClients = facturesClientsRes.status === 'fulfilled'
    ? (facturesClientsRes.value.data ?? [])
    : []
  const fluxEntrees: FluxItem[] = facturesClients.map(f => ({
    date: f.date_echeance as string,
    libelle: `Encaissement ${f.numero_facture ?? ''}`.trim(),
    montant: ((f.montant_ttc ?? 0) - (f.montant_paye ?? 0)),
    type: 'prevision',
  }))

  // ── Prévisions — sorties (factures fournisseurs, éch. estimée j+30) ───────
  const facturesFourn = facturesFournisseursRes.status === 'fulfilled'
    ? (facturesFournisseursRes.value.data ?? [])
    : []
  const fluxSorties: FluxItem[] = facturesFourn
    .filter(f => f.date_facture && f.montant_ttc)
    .map(f => {
      const dateFacture = new Date(f.date_facture as string)
      const echeance = new Date(dateFacture.getTime() + 30 * 24 * 60 * 60 * 1000)
      return {
        date: echeance.toISOString().split('T')[0],
        libelle: `Règlement ${f.fournisseur ?? f.numero_facture ?? ''}`.trim(),
        montant: -(f.montant_ttc as number),
        type: 'prevision' as const,
      }
    })
    .filter(f => f.date <= date90Ahead)

  // ── Calcul projections 30/60/90j ──────────────────────────────────────────
  const allPrevisions = [...fluxEntrees, ...fluxSorties].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  function sumPrevisions(daysAhead: number): number {
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead)
      .toISOString().split('T')[0]
    return allPrevisions
      .filter(f => f.date > today0 && f.date <= cutoff)
      .reduce((s, f) => s + f.montant, 0)
  }

  const projection30j = soldeActuel + sumPrevisions(30)
  const projection60j = soldeActuel + sumPrevisions(60)
  const projection90j = soldeActuel + sumPrevisions(90)

  const flux = [
    ...fluxHistorique,
    ...allPrevisions.slice(0, 50),
  ]

  return NextResponse.json({
    success: true,
    solde_actuel: soldeActuel,
    projection_30j: projection30j,
    projection_60j: projection60j,
    projection_90j: projection90j,
    flux,
  } satisfies TresorerieData)
}
