import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

/** GET /api/dossiers/:id — détail + statuts */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: dossier, error } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  const { data: statuts } = await supabase
    .from('dossier_statuts')
    .select('*')
    .eq('dossier_id', id)
    .maybeSingle()

  return NextResponse.json({ success: true, dossier, statuts: statuts ?? null })
}

/** PATCH /api/dossiers/:id — mettre à jour un dossier */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { nom, siren, secteur, regime_tva, email, telephone, notes } = body

  const { data, error } = await supabase
    .from('dossiers')
    .update({ nom, siren, secteur, regime_tva, email, telephone, notes })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, dossier: data })
}

/** DELETE /api/dossiers/:id — archiver un dossier (soft delete) */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase
    .from('dossiers')
    .update({ actif: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
