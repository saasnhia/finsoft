import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface FactureClientRow {
  id: string
  montant_ttc: number
  montant_paye: number
  statut_paiement: string
  date_echeance: string
  numero_facture: string
  // Supabase foreign table join returns array
  client: { nom: string }[] | null
}

interface RapprochementRow {
  id: string
  montant: number
  confidence_score: number
  created_at: string
  // Supabase foreign table joins return arrays
  facture: { fournisseur: string | null; montant_ttc: number | null; date_facture: string | null }[] | null
  transaction: { description: string; date: string; amount: number }[] | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const [facturesRes, tvaRes, alertesRes, rapprochementsRes, transactionsRes] =
    await Promise.allSettled([
      supabase
        .from('factures_clients')
        .select('id, montant_ttc, montant_paye, statut_paiement, date_echeance, numero_facture, client:clients(nom)')
        .eq('user_id', user.id)
        .in('statut_paiement', ['en_attente', 'en_retard', 'partiellement_payee'])
        .order('date_echeance', { ascending: true }),

      supabase
        .from('declarations_tva')
        .select('tva_nette, statut')
        .eq('user_id', user.id)
        .gte('periode_debut', firstOfMonth)
        .lte('periode_debut', lastOfMonth)
        .maybeSingle(),

      supabase
        .from('alerts')
        .select('id, severite, titre')
        .eq('user_id', user.id)
        .eq('statut', 'nouvelle')
        .order('created_at', { ascending: false }),

      supabase
        .from('rapprochements_factures')
        .select('id, montant, confidence_score, created_at, facture:factures(fournisseur, montant_ttc, date_facture), transaction:transactions(description, date, amount)')
        .eq('user_id', user.id)
        .eq('statut', 'suggestion')
        .order('confidence_score', { ascending: false })
        .limit(5),

      supabase
        .from('transactions')
        .select('id, date, description, amount, category, status')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(8),
    ])

  const factures = (facturesRes.status === 'fulfilled' ? facturesRes.value.data ?? [] : []) as FactureClientRow[]

  const balanceAgee = factures.map(f => {
    const echeance = new Date(f.date_echeance)
    const joursRetard = Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))
    const resteA = (f.montant_ttc ?? 0) - (f.montant_paye ?? 0)
    let tranche: string
    if (joursRetard <= 0) tranche = 'non_echu'
    else if (joursRetard <= 30) tranche = '0_30'
    else if (joursRetard <= 60) tranche = '31_60'
    else if (joursRetard <= 90) tranche = '61_90'
    else tranche = 'plus_90'
    return {
      id: f.id,
      numero_facture: f.numero_facture,
      client_nom: (Array.isArray(f.client) ? f.client[0]?.nom : null) ?? '—',
      montant_ttc: f.montant_ttc,
      resteA,
      date_echeance: f.date_echeance,
      joursRetard,
      tranche,
      statut_paiement: f.statut_paiement,
    }
  })

  const totalEnAttente = factures.reduce(
    (sum, f) => sum + ((f.montant_ttc ?? 0) - (f.montant_paye ?? 0)),
    0
  )
  const totalEnRetard = factures
    .filter(f => f.statut_paiement === 'en_retard')
    .reduce((sum, f) => sum + ((f.montant_ttc ?? 0) - (f.montant_paye ?? 0)), 0)
  const countEnRetard = factures.filter(f => f.statut_paiement === 'en_retard').length

  const tva = tvaRes.status === 'fulfilled' ? tvaRes.value.data : null
  const alertes = alertesRes.status === 'fulfilled' ? alertesRes.value.data ?? [] : []
  const rapprochements = (rapprochementsRes.status === 'fulfilled' ? rapprochementsRes.value.data ?? [] : []) as RapprochementRow[]
  const transactions = transactionsRes.status === 'fulfilled' ? transactionsRes.value.data ?? [] : []

  return NextResponse.json({
    success: true,
    kpis: {
      encours_clients: totalEnAttente,
      count_en_attente: factures.length,
      total_en_retard: totalEnRetard,
      count_en_retard: countEnRetard,
      tva_nette: tva?.tva_nette ?? null,
      tva_statut: tva?.statut ?? null,
      alertes_count: alertes.length,
      alertes_critiques: (alertes as { id: string; severite: string; titre: string }[]).filter(
        a => a.severite === 'critical'
      ).length,
    },
    balance_agee: balanceAgee,
    rapprochements,
    transactions,
  })
}
