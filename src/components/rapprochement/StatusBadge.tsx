'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, HelpCircle } from 'lucide-react'

export type RapprochementStatus = 'valide' | 'suggestion' | 'rejete' | 'none'
export type RapprochementType = 'auto' | 'suggestion' | 'manuel' | null

interface StatusBadgeProps {
  statut: RapprochementStatus
  type?: RapprochementType
  confidence?: number
  className?: string
}

export function StatusBadge({ statut, type, confidence, className = '' }: StatusBadgeProps) {
  if (statut === 'valide') {
    const isAuto = type === 'auto'
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${isAuto ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' : 'bg-blue-900/40 text-blue-300 border border-blue-700/40'}
          ${className}`}
        title={isAuto ? `Rapproché automatiquement${confidence ? ` (${confidence}%)` : ''}` : 'Rapproché manuellement'}
      >
        <CheckCircle2 className="h-3 w-3" />
        {isAuto ? 'Auto' : 'Manuel'}
      </span>
    )
  }

  if (statut === 'suggestion') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 ${className}`}
        title={`Suggestion de rapprochement${confidence ? ` (${confidence}%)` : ''}`}
      >
        <Clock className="h-3 w-3" />
        {confidence ? `${confidence}%` : 'Suggestion'}
      </span>
    )
  }

  if (statut === 'rejete') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/30 ${className}`}
        title="Rapprochement rejeté"
      >
        <XCircle className="h-3 w-3" />
        Rejeté
      </span>
    )
  }

  // 'none' — not reconciled
  return (
    <Link
      href="/rapprochement"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-600/30 hover:bg-slate-600/40 hover:text-slate-300 transition-colors ${className}`}
      title="Aucun rapprochement — cliquer pour associer manuellement"
    >
      <HelpCircle className="h-3 w-3" />
      Non rapproché
    </Link>
  )
}
