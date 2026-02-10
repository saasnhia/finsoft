import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NiveauRetard } from '@/types'

function getNiveauRetard(joursRetard: number): NiveauRetard {
  if (joursRetard > 30) return 'contentieux'
  if (joursRetard > 15) return 'critique'
  if (joursRetard > 7) return 'moyen'
  return 'leger'
}

/**
 * GET /api/notifications/overdue
 * Détecte les factures en retard de paiement et retourne les stats
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 1. Mettre à jour les statuts des factures en retard
    await supabase.rpc('update_overdue_invoices', { p_user_id: user.id })

    // 2. Récupérer toutes les factures non payées
    const { data: factures, error } = await supabase
      .from('factures_clients')
      .select('*, client:clients(*)')
      .eq('user_id', user.id)
      .in('statut_paiement', ['en_attente', 'en_retard', 'partiellement_payee'])
      .order('date_echeance', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération factures' }, { status: 500 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 3. Enrichir avec les jours de retard et le niveau
    const facturesEnRetard = (factures || [])
      .map(f => {
        const echeance = new Date(f.date_echeance)
        const joursRetard = Math.max(0, Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24)))
        const montantRestant = f.montant_ttc - f.montant_paye
        return {
          ...f,
          jours_retard: joursRetard,
          niveau_retard: getNiveauRetard(joursRetard),
          montant_restant: montantRestant,
        }
      })
      .filter(f => f.jours_retard > 0) // Seulement celles en retard effectif
      .sort((a, b) => b.jours_retard - a.jours_retard)

    // 4. Calculer les stats
    const stats = {
      total_en_retard: facturesEnRetard.length,
      montant_total_du: facturesEnRetard.reduce((sum, f) => sum + f.montant_restant, 0),
      par_niveau: {
        leger: facturesEnRetard.filter(f => f.niveau_retard === 'leger').length,
        moyen: facturesEnRetard.filter(f => f.niveau_retard === 'moyen').length,
        critique: facturesEnRetard.filter(f => f.niveau_retard === 'critique').length,
        contentieux: facturesEnRetard.filter(f => f.niveau_retard === 'contentieux').length,
      },
      rappels_envoyes_30j: 0,
    }

    // 5. Compter les rappels envoyés ces 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count } = await supabase
      .from('rappels_email')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('statut_envoi', 'envoye')
      .gte('date_envoi', thirtyDaysAgo.toISOString())

    stats.rappels_envoyes_30j = count || 0

    return NextResponse.json({
      success: true,
      factures: facturesEnRetard,
      stats,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
