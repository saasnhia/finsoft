'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout'
import { TresorerieChart } from '@/components/entreprise/TresorerieChart'
import { Landmark, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import type { TresorerieData } from '@/app/api/entreprise/tresorerie/route'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface ProjectionCardProps {
  label: string
  value: number
  baseline: number
  loading: boolean
}

function ProjectionCard({ label, value, baseline, loading }: ProjectionCardProps) {
  const diff = value - baseline
  const positive = diff >= 0
  const isNegative = value < 0

  return (
    <div className={`rounded-xl border p-5 ${isNegative ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/60 bg-slate-800/60'}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      {loading ? (
        <div className="h-8 w-28 bg-slate-700 animate-pulse rounded" />
      ) : (
        <>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
            {fmt(value)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {isNegative
              ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              : positive
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                : <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            }
            <span className={`text-xs font-medium ${isNegative ? 'text-red-400' : positive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {positive ? '+' : ''}{fmt(diff)} vs aujourd'hui
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default function TresoreriePage() {
  const [data, setData] = useState<TresorerieData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/entreprise/tresorerie')
      .then(r => r.json())
      .then((json: TresorerieData) => { if (json.success) setData(json) })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Landmark className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Prévision de trésorerie</h1>
            <p className="text-sm text-slate-400">Historique 60j + prévisions 30/60/90 jours</p>
          </div>
        </div>

        {/* Solde actuel */}
        <div className="rounded-xl border border-emerald-500/20 bg-slate-800/60 p-6 mb-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10">
            <Landmark className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Solde bancaire actuel</p>
            {loading ? (
              <div className="h-9 w-36 bg-slate-700 animate-pulse rounded" />
            ) : (
              <p className={`text-3xl font-bold ${(data?.solde_actuel ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmt(data?.solde_actuel ?? 0)}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">Comptes bancaires actifs cumulés</p>
          </div>
        </div>

        {/* Projections */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ProjectionCard
            label="Prévision 30 jours"
            value={data?.projection_30j ?? 0}
            baseline={data?.solde_actuel ?? 0}
            loading={loading}
          />
          <ProjectionCard
            label="Prévision 60 jours"
            value={data?.projection_60j ?? 0}
            baseline={data?.solde_actuel ?? 0}
            loading={loading}
          />
          <ProjectionCard
            label="Prévision 90 jours"
            value={data?.projection_90j ?? 0}
            baseline={data?.solde_actuel ?? 0}
            loading={loading}
          />
        </div>

        {/* Chart */}
        <TresorerieChart
          soldeActuel={data?.solde_actuel ?? 0}
          flux={data?.flux ?? []}
          loading={loading}
        />

        {/* Note méthodologique */}
        <div className="mt-6 p-4 rounded-xl border border-slate-700/40 bg-slate-800/40 text-xs text-slate-500">
          <strong className="text-slate-400">Méthodologie :</strong>{' '}
          Les prévisions sont calculées à partir des factures clients non encaissées (encaissements prévus à l'échéance)
          et des factures fournisseurs non payées (décaissements estimés à date facture +30j).
          L'historique est reconstitué à partir des transactions importées.
        </div>
      </div>
    </AppShell>
  )
}
