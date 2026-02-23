'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Sparkles, Mail, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { MailResult, RappelMail } from '@/lib/agents/mail-agent'

type State = 'idle' | 'loading' | 'success' | 'error'

function RappelCard({ rappel }: { rappel: RappelMail }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const text = `Sujet : ${rappel.sujet}\n\n${rappel.corps}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Email copié dans le presse-papier')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-medium text-white truncate">{rappel.client}</p>
          <span className="text-xs text-neutral-500 truncate hidden sm:block">{rappel.email}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-neutral-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-xs text-neutral-500">Sujet : <span className="text-neutral-300">{rappel.sujet}</span></p>
        <p className="text-sm text-neutral-400 whitespace-pre-line leading-relaxed">{rappel.corps}</p>
      </div>
    </div>
  )
}

export function MailAgent() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<MailResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/ai/agent-mail', { method: 'POST' })
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
          Génère des rappels de paiement personnalisés pour vos clients avec des factures en retard.
        </p>
      )}

      {state !== 'loading' && (
        <button
          onClick={run}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Générer les rappels
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm">Génération des rappels personnalisés…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {state === 'success' && result && (
        <div className="space-y-3">
          {result.rappels.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Aucune facture en retard. Excellent !
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {result.rappels.length} rappel{result.rappels.length > 1 ? 's' : ''} généré{result.rappels.length > 1 ? 's' : ''}
              </p>
              {result.rappels.map((r, i) => (
                <RappelCard key={i} rappel={r} />
              ))}
            </>
          )}

          <button
            onClick={run}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ↻ Regénérer
          </button>
        </div>
      )}
    </div>
  )
}
