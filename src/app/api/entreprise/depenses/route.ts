import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface DepenseRow {
  compte_comptable: string
  libelle: string
  total: number
  count: number
}

// Libellés PCG par classe de compte (2 chiffres)
const LIBELLES_PCG: Record<string, string> = {
  '60': 'Achats de marchandises',
  '61': 'Services extérieurs (1)',
  '62': 'Services extérieurs (2)',
  '63': 'Impôts et taxes',
  '64': 'Charges de personnel',
  '65': 'Autres charges de gestion',
  '66': 'Charges financières',
  '67': 'Charges exceptionnelles',
  '68': 'Dotations amortissements',
  '69': 'Impôt sur bénéfices',
}

/**
 * GET /api/entreprise/depenses?periode=3m|6m|1y
 * Agrège les factures par compte_comptable (classe 6xx) sur la période.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const url = new URL(req.url)
  const periode = url.searchParams.get('periode') ?? '3m'

  const today = new Date()
  const monthsBack = periode === '1y' ? 12 : periode === '6m' ? 6 : 3
  const dateDebut = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1)
    .toISOString()
    .split('T')[0]
  const dateFin = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const { data: rows, error } = await supabase
    .from('factures')
    .select('montant_ttc, compte_comptable')
    .eq('user_id', user.id)
    .gte('date_facture', dateDebut)
    .lte('date_facture', dateFin)
    .not('montant_ttc', 'is', null)
    .not('compte_comptable', 'is', null)

  if (error) {
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
  }

  // Agréger par les 2 premiers chiffres du compte (classe)
  const agg: Record<string, { total: number; count: number }> = {}
  for (const row of rows ?? []) {
    const compte = String(row.compte_comptable ?? '')
    if (!compte || compte[0] !== '6') continue
    const classe = compte.slice(0, 2)
    if (!agg[classe]) agg[classe] = { total: 0, count: 0 }
    agg[classe].total += row.montant_ttc ?? 0
    agg[classe].count += 1
  }

  const depenses: DepenseRow[] = Object.entries(agg)
    .map(([classe, { total, count }]) => ({
      compte_comptable: classe,
      libelle: LIBELLES_PCG[classe] ?? `Compte ${classe}x`,
      total: Math.round(total * 100) / 100,
      count,
    }))
    .sort((a, b) => b.total - a.total)

  const totalGeneral = depenses.reduce((s, d) => s + d.total, 0)

  return NextResponse.json({
    success: true,
    depenses,
    total: Math.round(totalGeneral * 100) / 100,
    periode,
    date_debut: dateDebut,
    date_fin: dateFin,
  })
}
