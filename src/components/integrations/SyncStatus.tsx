'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react'

interface SyncLog {
  date: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface SyncStatusProps {
  provider: string
  statut: 'connecte' | 'erreur' | 'inactif'
  derniereSynchro?: string | null
  logs?: SyncLog[]
  onSync?: () => Promise<void>
}

export function SyncStatus({ provider, statut, derniereSynchro, logs = [], onSync }: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const handleSync = async () => {
    if (!onSync || syncing) return
    setSyncing(true)
    try { await onSync() } finally { setSyncing(false) }
  }

  const statusConfig = {
    connecte: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      label: 'Synchronisé',
    },
    erreur: {
      icon: AlertCircle,
      color: 'text-coral-600',
      bg: 'bg-coral-50 border-coral-200',
      label: 'Erreur',
    },
    inactif: {
      icon: Clock,
      color: 'text-navy-400',
      bg: 'bg-navy-50 border-navy-200',
      label: 'Non connecté',
    },
  }

  const cfg = statusConfig[statut]
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className={`w-5 h-5 ${cfg.color} flex-shrink-0`} />
          <div>
            <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
            {derniereSynchro && (
              <p className="text-xs text-navy-400 mt-0.5">
                Dernier sync : {new Date(derniereSynchro).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700 transition-colors"
            >
              Logs
              <ChevronDown className={`w-3 h-3 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
            </button>
          )}
          {onSync && statut !== 'inactif' && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchro…' : 'Synchroniser'}
            </button>
          )}
        </div>
      </div>

      {/* Logs panel */}
      {showLogs && logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="space-y-1 max-h-[160px] overflow-y-auto font-mono text-[11px]">
            {logs.slice(0, 10).map((log, i) => (
              <div key={i} className={`flex gap-2 ${
                log.type === 'error' ? 'text-coral-600'
                : log.type === 'success' ? 'text-emerald-600'
                : 'text-navy-500'
              }`}>
                <span className="text-navy-400 flex-shrink-0">
                  {new Date(log.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
