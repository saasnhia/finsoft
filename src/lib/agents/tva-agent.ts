/**
 * Agent TVA — vérifie les taux, génère un résumé CA3 et conseils fiscaux.
 * Les données sont anonymisées avant envoi au LLM.
 */

import { createClient } from '@/lib/supabase/server'
import { runAgent, parseJsonFromLLM } from './orchestrator'

interface RawTVATx {
  amount: number
  type: string
  tva_taux: number | null
  date: string
  category: string | null
}

interface AnonTVATx {
  montant: number
  type: string
  tva_taux: number
  mois: string
  categorie: string
}

function anonymizeTVA(rows: RawTVATx[]): AnonTVATx[] {
  return rows.map(t => ({
    montant: Math.abs(t.amount),
    type: t.type,
    tva_taux: t.tva_taux ?? 20,
    mois: t.date.slice(0, 7), // YYYY-MM
    categorie: t.category ?? 'non_categorise',
  }))
}

export interface TVAAlerte {
  type: string
  message: string
}

export interface TVAResult {
  tva_collectee: number
  tva_deductible: number
  solde: number
  alertes: TVAAlerte[]
  resume_ca3: string
  conseils: string[]
}

export async function runTVAAgent(userId: string): Promise<TVAResult> {
  const supabase = await createClient()

  // Trimestre courant
  const now = new Date()
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, tva_taux, date, category')
    .eq('user_id', userId)
    .gte('date', quarterStart.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  if (!transactions || transactions.length === 0) {
    return {
      tva_collectee: 0,
      tva_deductible: 0,
      solde: 0,
      alertes: [{ type: 'info', message: 'Aucune transaction sur le trimestre courant.' }],
      resume_ca3: 'Aucune donnée disponible.',
      conseils: ['Importez vos relevés bancaires pour activer cette analyse.'],
    }
  }

  const anonymized = anonymizeTVA(transactions as RawTVATx[])
  const periode = `${quarterStart.toLocaleDateString('fr-FR')} — aujourd'hui`

  const systemPrompt = `Tu es un fiscaliste français expert en TVA (DGFiP, formulaire CA3). Tu analyses des données anonymisées. Réponds UNIQUEMENT avec du JSON pur, sans markdown.`

  const userPrompt = `Analyse la TVA pour la période ${periode} (${anonymized.length} transactions anonymisées).

DONNÉES:
${JSON.stringify(anonymized, null, 2)}

Calcule et retourne exactement ce JSON:
{
  "tva_collectee": 1234.56,
  "tva_deductible": 567.89,
  "solde": 666.67,
  "alertes": [
    { "type": "erreur|avertissement|info", "message": "Description en français" }
  ],
  "resume_ca3": "Résumé narrative du formulaire CA3 pour cette période.",
  "conseils": ["conseil fiscal 1", "conseil 2"]
}`

  const result = await runAgent({
    agentType: 'tva',
    systemPrompt,
    userPrompt,
    userId,
    inputSummary: `${anonymized.length} transactions Q${Math.floor(now.getMonth() / 3) + 1}`,
  })

  return parseJsonFromLLM<TVAResult>(result.text)
}
