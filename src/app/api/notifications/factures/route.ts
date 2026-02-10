import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/factures
 * Liste les factures clients avec jointure client
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statut = searchParams.get('statut')
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('factures_clients')
      .select('*, client:clients(*)')
      .eq('user_id', user.id)
      .order('date_echeance', { ascending: true })

    if (statut) query = query.eq('statut_paiement', statut)
    if (clientId) query = query.eq('client_id', clientId)

    const { data: factures, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération factures' }, { status: 500 })
    }

    return NextResponse.json({ success: true, factures: factures || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}

/**
 * POST /api/notifications/factures
 * Créer une nouvelle facture client
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const {
      client_id, numero_facture, objet,
      montant_ht, tva, montant_ttc,
      date_emission, date_echeance, notes,
    } = body

    if (!client_id || !numero_facture || !date_echeance || !montant_ttc) {
      return NextResponse.json({
        error: 'Champs requis : client_id, numero_facture, date_echeance, montant_ttc',
      }, { status: 400 })
    }

    // Vérifier que le client appartient à l'utilisateur
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    // Déterminer statut initial
    const echeance = new Date(date_echeance)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const statutInitial = echeance < today ? 'en_retard' : 'en_attente'

    const { data: facture, error } = await supabase
      .from('factures_clients')
      .insert({
        user_id: user.id,
        client_id,
        numero_facture: numero_facture.trim(),
        objet: objet?.trim() || null,
        montant_ht: parseFloat(montant_ht) || 0,
        tva: parseFloat(tva) || 0,
        montant_ttc: parseFloat(montant_ttc) || 0,
        date_emission: date_emission || new Date().toISOString().split('T')[0],
        date_echeance,
        statut_paiement: statutInitial,
        notes: notes?.trim() || null,
      })
      .select('*, client:clients(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur création facture: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, facture })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
