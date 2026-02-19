'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, FolderOpen, Plus, Check } from 'lucide-react'
import { useDossier } from '@/contexts/DossierContext'

export function DossierSwitcher() {
  const { dossiers, activeDossier, setActiveDossier, loading } = useDossier()
  const [open, setOpen] = useState(false)

  if (loading) {
    return <div className="w-28 h-7 bg-white/10 rounded-lg animate-pulse" />
  }

  if (!dossiers.length) {
    return (
      <Link
        href="/cabinet"
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Nouveau dossier
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors max-w-[180px]"
      >
        <FolderOpen className="w-3.5 h-3.5 text-brand-green-action flex-shrink-0" />
        <span className="truncate font-medium">
          {activeDossier?.nom ?? 'Sélectionner…'}
        </span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-20">
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
              Dossier actif
            </p>
            {dossiers.map(d => (
              <button
                key={d.id}
                onClick={() => { setActiveDossier(d); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-800 truncate">{d.nom}</p>
                  {d.siren && <p className="text-[11px] text-neutral-400">SIREN {d.siren}</p>}
                </div>
                {activeDossier?.id === d.id && (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <Link
                href="/cabinet"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Gérer les dossiers
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
