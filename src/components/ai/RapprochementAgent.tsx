'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Sparkles, CheckCircle2, ArrowRightLeft } from 'lucide-react'
import type { RapprochementResult, AnomalieExpliquee } from '@/lib/agents/rapprochement-agent'

type State = 'idle' | 'loading' | 'success' | 'error'

const PRIORITY_STYLES: Record<AnomalieExpliquee['priorite'], string> = {
  haute: 'border-l-red-500 bg-red-900/20',
  moyenne: 'border-l-amber-500 bg-amber-900/20',
  faible: 'border-l-neutral-600 bg-white/5',
}

const PRIORITY_LABELS: Record<AnomalieExpliquee['priorite'], string> = {
  haute: '🔴 Haute',
  moyenne: '🟡 Moyenne',
  faible: '⚪ Faible',
}

function formatEur(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function RapprochementAgent() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<RapprochementResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/ai/agent-rapprochement', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Erreur inconnue')
      setResult(data)
      setState('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <p className="text-sm text-neutral-400">
          Explique en langage simple les anomalies de rapprochement bancaire et propose des actions correctives.
        </p>
      )}

      {state !== 'loading' && (
        <button
          onClick={run}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Analyser le rapprochement
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm">Analyse des anomalies en cours…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {state === 'success' && result && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-400">{result.taux_rapprochement}%</p>
              <p className="text-[11px] text-neutral-500">Taux rapprochement</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <AlertTriangle className="w-3.5 h-3.5 text-neutral-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-400">{formatEur(result.montant_total_non_rapproche)}</p>
              <p className="text-[11px] text-neutral-500">Non rapproché</p>
            </div>
          </div>

          {/* Anomalies expliquées */}
          {result.anomalies_expliquees.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {result.anomalies_expliquees.length} anomalie{result.anomalies_expliquees.length > 1 ? 's' : ''} à traiter
              </p>
              {result.anomalies_expliquees.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-2 ${PRIORITY_STYLES[a.priorite]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-neutral-300">{a.ref}</span>
                    <span className="text-[11px] text-neutral-500">{PRIORITY_LABELS[a.priorite]}</span>
                  </div>
                  <p className="text-sm text-neutral-300 mb-1.5">{a.explication}</p>
                  <p className="text-xs text-emerald-400">→ {a.action}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Aucune anomalie à traiter.
            </div>
          )}

          {/* Actions prioritaires */}
          {result.actions_prioritaires.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions prioritaires</p>
              {result.actions_prioritaires.map((a, i) => (
                <p key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>{a}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={run}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ↻ Relancer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  )
}
