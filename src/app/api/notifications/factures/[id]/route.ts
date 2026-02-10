import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/notifications/factures/[id]
 * Mettre à jour une facture client (statut paiement, montant payé, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Vérifier que la facture appartient à l'utilisateur
    const { data: existing } = await supabase
      .from('factures_clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    // Construire les champs à mettre à jour
    const updates: Record<string, unknown> = {}

    if (body.statut_paiement !== undefined) {
      updates.statut_paiement = body.statut_paiement
      if (body.statut_paiement === 'payee') {
        updates.montant_paye = existing.montant_ttc
        updates.date_dernier_paiement = new Date().toISOString().split('T')[0]
      }
    }

    if (body.montant_paye !== undefined) {
      const montantPaye = parseFloat(body.montant_paye)
      updates.montant_paye = montantPaye
      updates.date_dernier_paiement = new Date().toISOString().split('T')[0]

      // Auto-déterminer le statut selon le montant
      if (montantPaye >= existing.montant_ttc) {
        updates.statut_paiement = 'payee'
      } else if (montantPaye > 0) {
        updates.statut_paiement = 'partiellement_payee'
      }
    }

    if (body.notes !== undefined) updates.notes = body.notes
    if (body.date_echeance !== undefined) updates.date_echeance = body.date_echeance

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data: facture, error } = await supabase
      .from('factures_clients')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, client:clients(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur mise à jour: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, facture })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/factures/[id]
 * Supprimer une facture client
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('factures_clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur suppression: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
