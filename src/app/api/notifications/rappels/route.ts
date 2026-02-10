import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/rappels
 * Liste l'historique des rappels email envoyés
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: rappels, error } = await supabase
      .from('rappels_email')
      .select('*, client:clients(nom, email), facture_client:factures_clients(numero_facture, montant_ttc)')
      .eq('user_id', user.id)
      .order('date_envoi', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération rappels' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rappels: rappels || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
