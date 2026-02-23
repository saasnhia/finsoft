/**
 * Agent Audit — détecte anomalies, doublons et incohérences comptables.
 * Les données sont anonymisées avant envoi au LLM.
 */

import { createClient } from '@/lib/supabase/server'
import { runAgent, parseJsonFromLLM } from './orchestrator'

interface RawTransaction {
  id: string
  description: string
  amount: number
  category: string | null
  date: string
  type: string
  confidence_score: number | null
}

interface AnonTransaction {
  ref: string
  montant: number
  type: string
  categorie: string
  date: string
  prefix: string
}

function anonymizeTransactions(rows: RawTransaction[]): AnonTransaction[] {
  return rows.map((t, i) => ({
    ref: `TXN_${String(i + 1).padStart(3, '0')}`,
    montant: t.amount,
    type: t.type,
    categorie: t.category ?? 'non_categorise',
    date: t.date,
    prefix: t.description.slice(0, 3).toUpperCase(),
  }))
}

export interface AuditAnomalie {
  ref: string
  type: string
  description: string
  severity: 'faible' | 'moyen' | 'eleve'
}

export interface AuditResult {
  anomalies: AuditAnomalie[]
  recommandations: string[]
  score_conformite: number
  resume_executif: string
}

export async function runAuditAgent(userId: string): Promise<AuditResult> {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, description, amount, category, date, type, confidence_score')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(100)

  if (!transactions || transactions.length === 0) {
    return {
      anomalies: [],
      recommandations: ["Importez des transactions pour lancer l'audit."],
      score_conformite: 100,
      resume_executif: 'Aucune transaction disponible pour analyse.',
    }
  }

  const anonymized = anonymizeTransactions(transactions as RawTransaction[])

  const systemPrompt = `Tu es un expert-comptable français certifié (PCG, DGFiP). Tu analyses des données comptables anonymisées. Réponds UNIQUEMENT avec du JSON pur, sans markdown, sans explication.`

  const userPrompt = `Analyse ces ${anonymized.length} transactions comptables anonymisées et produis un rapport d'audit.

DONNÉES:
${JSON.stringify(anonymized, null, 2)}

Retourne exactement ce JSON:
{
  "anomalies": [
    { "ref": "TXN_001", "type": "doublon|montant_suspect|categorie_incorrecte|autre", "description": "Explication en français", "severity": "faible|moyen|eleve" }
  ],
  "recommandations": ["conseil 1", "conseil 2"],
  "score_conformite": 85,
  "resume_executif": "Résumé en 2-3 phrases."
}`

  const result = await runAgent({
    agentType: 'audit',
    systemPrompt,
    userPrompt,
    userId,
    inputSummary: `${anonymized.length} transactions`,
  })

  return parseJsonFromLLM<AuditResult>(result.text)
}
