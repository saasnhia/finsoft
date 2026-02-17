import { NextRequest, NextResponse } from 'next/server'
import { validerTVAIntracom } from '@/lib/api/api-vies'
import { requirePlanFeature, isAuthed } from '@/lib/auth/require-plan'

/**
 * POST /api/tva/valider
 * Valide un numero de TVA intracommunautaire via VIES
 * Requiert: plan Cabinet ou Entreprise
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlanFeature('vies')
    if (!isAuthed(auth)) return auth

    const body = await request.json()
    const { numero_tva } = body

    if (!numero_tva) {
      return NextResponse.json(
        { success: false, error: 'Numero TVA manquant' },
        { status: 400 }
      )
    }

    const validation = await validerTVAIntracom(numero_tva)

    return NextResponse.json({ success: true, validation })
  } catch (error: any) {
    const status = error.message?.includes('invalide') ? 400 : 500
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    )
  }
}
