/**
 * Agent Rapprochement — explique les anomalies non résolues en langage clair.
 * Les données sont anonymisées avant envoi au LLM.
 */

import { createClient } from '@/lib/supabase/server'
import { runAgent, parseJsonFromLLM } from './orchestrator'

interface RawRapprochement {
  id: string
  montant_transaction: number | null
  montant_releve: number | null
  match_score: number | null
  statut: string | null
  date_transaction: string | null
  date_releve: string | null
}

interface AnonRapprochement {
  ref: string
  montant_tx: number
  montant_releve: number
  ecart: number
  score: number
  statut: string
  date: string
}

function anonymizeRaprochements(rows: RawRapprochement[]): AnonRapprochement[] {
  return rows.map((r, i) => {
    const mt = r.montant_transaction ?? 0
    const mr = r.montant_releve ?? 0
    return {
      ref: `RAP_${String(i + 1).padStart(3, '0')}`,
      montant_tx: mt,
      montant_releve: mr,
      ecart: Math.abs(mt - mr),
      score: r.match_score ?? 0,
      statut: r.statut ?? 'inconnu',
      date: (r.date_transaction ?? r.date_releve ?? '').slice(0, 10),
    }
  })
}

export interface AnomalieExpliquee {
  ref: string
  explication: string
  action: string
  priorite: 'haute' | 'moyenne' | 'faible'
}

export interface RapprochementResult {
  anomalies_expliquees: AnomalieExpliquee[]
  actions_prioritaires: string[]
  montant_total_non_rapproche: number
  taux_rapprochement: number
}

export async function runRapprochementAgent(userId: string): Promise<RapprochementResult> {
  const supabase = await createClient()

  const { data: anomalies } = await supabase
    .from('rapprochements')
    .select('id, montant_transaction, montant_releve, match_score, statut, date_transaction, date_releve')
    .eq('user_id', userId)
    .in('statut', ['rejet', 'suggestion', 'pending'])
    .order('match_score', { ascending: true })
    .limit(50)

  if (!anomalies || anomalies.length === 0) {
    return {
      anomalies_expliquees: [],
      actions_prioritaires: ['Aucune anomalie de rapprochement détectée. Excellent travail !'],
      montant_total_non_rapproche: 0,
      taux_rapprochement: 100,
    }
  }

  const anonymized = anonymizeRaprochements(anomalies as RawRapprochement[])
  const totalNonRaproche = anonymized.reduce((sum, r) => sum + r.ecart, 0)

  const { count: totalCount } = await supabase
    .from('rapprochements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const taux = totalCount && totalCount > 0
    ? Math.round(((totalCount - anomalies.length) / totalCount) * 100)
    : 0

  const systemPrompt = `Tu es un expert en rapprochement bancaire français. Tu expliques les anomalies en termes simples pour des non-experts. Réponds UNIQUEMENT avec du JSON pur, sans markdown.`

  const userPrompt = `Analyse ces ${anonymized.length} anomalies de rapprochement bancaire non résolues.

DONNÉES (anonymisées):
${JSON.stringify(anonymized, null, 2)}

Retourne exactement ce JSON:
{
  "anomalies_expliquees": [
    {
      "ref": "RAP_001",
      "explication": "Explication simple en français pour un non-expert",
      "action": "Action concrète à effectuer",
      "priorite": "haute|moyenne|faible"
    }
  ],
  "actions_prioritaires": ["action prioritaire 1", "action 2"],
  "montant_total_non_rapproche": ${totalNonRaproche.toFixed(2)},
  "taux_rapprochement": ${taux}
}`

  const result = await runAgent({
    agentType: 'rapprochement',
    systemPrompt,
    userPrompt,
    userId,
    inputSummary: `${anomalies.length} anomalies, ${totalNonRaproche.toFixed(2)}€`,
  })

  return parseJsonFromLLM<RapprochementResult>(result.text)
}
