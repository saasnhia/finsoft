/**
 * Agent Mail — génère des rappels personnalisés pour factures en retard.
 * Les données client sont anonymisées avant envoi au LLM.
 */

import { createClient } from '@/lib/supabase/server'
import { runAgent, parseJsonFromLLM } from './orchestrator'

interface RawFacture {
  id: string
  montant: number | null
  date_echeance: string | null
  client_nom: string | null
  client_email: string | null
  numero_facture: string | null
  jours_retard: number | null
}

interface AnonFacture {
  ref: string
  montant: number
  jours_retard: number
  echeance: string
  code_client: string
}

interface ClientGroup {
  code: string
  email: string
  nom: string
  factures: AnonFacture[]
  total_du: number
}

function anonymizeFactures(rows: RawFacture[]): { anon: AnonFacture[]; clientMap: Map<string, string> } {
  const clientMap = new Map<string, string>()
  let clientCount = 0

  const anon: AnonFacture[] = rows.map((f, i) => {
    const clientKey = f.client_email ?? f.client_nom ?? `unknown_${i}`
    if (!clientMap.has(clientKey)) {
      clientCount++
      clientMap.set(clientKey, `CLIENT_${String(clientCount).padStart(3, '0')}`)
    }
    return {
      ref: `FAC_${String(i + 1).padStart(3, '0')}`,
      montant: f.montant ?? 0,
      jours_retard: f.jours_retard ?? 0,
      echeance: (f.date_echeance ?? '').slice(0, 10),
      code_client: clientMap.get(clientKey)!,
    }
  })

  return { anon, clientMap }
}

export interface RappelMail {
  client: string
  email: string
  sujet: string
  corps: string
}

export interface MailResult {
  rappels: RappelMail[]
}

export async function runMailAgent(userId: string): Promise<MailResult> {
  const supabase = await createClient()

  // Fetch overdue invoices from notifications_factures or transactions
  const { data: factures } = await supabase
    .from('notifications_factures')
    .select('id, montant, date_echeance, client_nom, client_email, numero_facture, jours_retard')
    .eq('user_id', userId)
    .in('statut', ['en_retard', 'tres_en_retard'])
    .order('jours_retard', { ascending: false })
    .limit(20)

  if (!factures || factures.length === 0) {
    return { rappels: [] }
  }

  const { anon, clientMap } = anonymizeFactures(factures as RawFacture[])

  // Group by client code for the prompt
  const groupsByCode = new Map<string, AnonFacture[]>()
  for (const f of anon) {
    const existing = groupsByCode.get(f.code_client) ?? []
    existing.push(f)
    groupsByCode.set(f.code_client, existing)
  }
  const groups = Array.from(groupsByCode.entries()).map(([code, facs]) => ({
    code,
    factures: facs,
    total: facs.reduce((s, f) => s + f.montant, 0),
  }))

  // Build reverse map for de-anonymization
  const reverseClientMap = new Map<string, { email: string; nom: string }>()
  for (const f of factures as RawFacture[]) {
    const clientKey = f.client_email ?? f.client_nom ?? ''
    const code = clientMap.get(clientKey)
    if (code && !reverseClientMap.has(code)) {
      reverseClientMap.set(code, {
        email: f.client_email ?? '',
        nom: f.client_nom ?? 'Client',
      })
    }
  }

  const systemPrompt = `Tu es un assistant comptable courtois et professionnel. Tu rédiges des rappels de paiement en français, ton neutre mais bienveillant. Réponds UNIQUEMENT avec du JSON pur, sans markdown.`

  const userPrompt = `Génère des rappels de paiement personnalisés pour ${groups.length} clients avec des factures impayées.

DONNÉES (anonymisées):
${JSON.stringify(groups, null, 2)}

Pour chaque client, rédige un email de rappel professionnel et courtois.
Retourne exactement ce JSON:
{
  "rappels": [
    {
      "client": "CODE_CLIENT",
      "email": "CODE_CLIENT@placeholder.fr",
      "sujet": "Rappel de paiement — Factures en attente",
      "corps": "Corps complet de l'email en français, mentionnant le montant total dû et les références de factures de manière anonymisée."
    }
  ]
}`

  const result = await runAgent({
    agentType: 'mail',
    systemPrompt,
    userPrompt,
    userId,
    inputSummary: `${factures.length} factures en retard, ${groups.length} clients`,
  })

  const parsed = parseJsonFromLLM<MailResult>(result.text)

  // Re-hydrate real client info (email + nom)
  const rappels: RappelMail[] = parsed.rappels.map(r => {
    const real = reverseClientMap.get(r.client)
    return {
      client: real?.nom ?? r.client,
      email: real?.email ?? r.email,
      sujet: r.sujet,
      corps: r.corps,
    }
  })

  return { rappels }
}
