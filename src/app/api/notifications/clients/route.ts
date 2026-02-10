import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/clients
 * Liste les clients de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('nom', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération clients' }, { status: 500 })
    }

    return NextResponse.json({ success: true, clients: clients || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}

/**
 * POST /api/notifications/clients
 * Créer un nouveau client
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { nom, email, telephone, adresse, siren, notes } = body

    if (!nom || nom.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 })
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        nom: nom.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        siren: siren?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur création client: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, client })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
