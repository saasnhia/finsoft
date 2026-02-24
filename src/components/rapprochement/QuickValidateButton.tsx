'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface QuickValidateButtonProps {
  rapprochementId: string
  onValidated?: () => void
}

/**
 * Bouton de validation en 1 clic depuis la liste des transactions.
 * Appelle POST /api/rapprochement/valider avec action='valider'.
 */
export function QuickValidateButton({ rapprochementId, onValidated }: QuickValidateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleValidate() {
    if (loading || done) return
    setLoading(true)
    try {
      const res = await fetch('/api/rapprochement/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rapprochement_id: rapprochementId, action: 'valider' }),
      })
      if (res.ok) {
        setDone(true)
        onValidated?.()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Validé
      </span>
    )
  }

  return (
    <button
      onClick={handleValidate}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-800/60 hover:text-emerald-200 transition-colors disabled:opacity-50"
      title="Valider ce rapprochement"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      Valider
    </button>
  )
}
