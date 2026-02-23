'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react'
import type { AuditResult, AuditAnomalie } from '@/lib/agents/audit-agent'

type State = 'idle' | 'loading' | 'success' | 'error'

const SEVERITY_STYLES: Record<AuditAnomalie['severity'], string> = {
  eleve: 'bg-red-50 border-red-200 text-red-700',
  moyen: 'bg-amber-50 border-amber-200 text-amber-700',
  faible: 'bg-gray-50 border-gray-200 text-gray-700',
}

const SEVERITY_LABELS: Record<AuditAnomalie['severity'], string> = {
  eleve: 'Élevé',
  moyen: 'Moyen',
  faible: 'Faible',
}

export function AuditAgent() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/ai/agent-audit', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Erreur inconnue')
      setResult(data)
      setState('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  const scoreColor = result
    ? result.score_conformite >= 80
      ? 'text-emerald-600'
      : result.score_conformite >= 60
        ? 'text-amber-600'
        : 'text-red-600'
    : ''

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <p className="text-sm text-gray-500">
          Analyse les 100 dernières transactions pour détecter anomalies, doublons et incohérences PCG.
        </p>
      )}

      {state !== 'loading' && (
        <button
          onClick={run}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Lancer l&apos;audit IA
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Analyse en cours avec Mistral AI…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {state === 'success' && result && (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-center">
              <p className={`text-4xl font-bold ${scoreColor}`}>{result.score_conformite}</p>
              <p className="text-xs text-gray-400 mt-1">/ 100</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Score de conformité</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.score_conformite >= 80 ? 'bg-emerald-500' :
                    result.score_conformite >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.score_conformite}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{result.resume_executif}</p>
            </div>
          </div>

          {/* Anomalies */}
          {result.anomalies.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {result.anomalies.length} anomalie{result.anomalies.length > 1 ? 's' : ''} détectée{result.anomalies.length > 1 ? 's' : ''}
              </p>
              {result.anomalies.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${SEVERITY_STYLES[a.severity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{a.ref} — {a.type}</span>
                    <span className="ml-auto text-xs opacity-70">{SEVERITY_LABELS[a.severity]}</span>
                  </div>
                  <p className="text-xs opacity-80 ml-5">{a.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Aucune anomalie détectée.
            </div>
          )}

          {/* Recommandations */}
          {result.recommandations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recommandations</p>
              {result.recommandations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={run}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ↻ Relancer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  )
}
