import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFacturXML, validateEN16931, detectAndExtractFacturX } from '@/lib/einvoicing/facturx'
import type { FacturXData } from '@/lib/einvoicing/facturx'

/** POST /api/einvoicing
 * body: { action: 'generate'|'detect', data?: FacturXData, pdfBase64?: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  if (action === 'generate') {
    const data = body.data as FacturXData
    if (!data) return NextResponse.json({ error: 'Données facture requises' }, { status: 400 })

    const errors = validateEN16931(data)
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 422 })
    }

    const xml = generateFacturXML(data)
    return NextResponse.json({
      success: true,
      xml,
      conforme: true,
      profil: 'EN16931',
      standard: 'Factur-X 1.0',
    })
  }

  if (action === 'detect') {
    const { pdfBase64 } = body
    if (!pdfBase64) return NextResponse.json({ error: 'PDF requis (base64)' }, { status: 400 })

    const pdfBytes = Uint8Array.from(Buffer.from(pdfBase64, 'base64'))
    const result = await detectAndExtractFacturX(pdfBytes)

    return NextResponse.json({ success: true, ...result })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
