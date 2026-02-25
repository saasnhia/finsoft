'use client'

import { useEffect, useState } from 'react'
import { Landmark, ShoppingBag, Clock, Zap } from 'lucide-react'
import type { EntrepriseDashboardData } from '@/app/api/entreprise/dashboard/route'
import { DepensesChart } from './DepensesChart'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: 'emerald' | 'red' | 'amber' | 'violet'
  loading: boolean
}

function KpiCard({ title, value, subtitle, icon, color, loading }: KpiCardProps) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  }
  const c = colorMap[color]

  return (
    <div className={`rounded-xl border ${c.border} bg-slate-800/60 p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-28 bg-slate-700 animate-pulse rounded" />
      ) : (
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      )}
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

/**
 * Dashboard KPI panel — mode entreprise
 * Fetches /api/entreprise/dashboard independently.
 */
export function EntrepriseDashboardPanel() {
  const [data, setData] = useState<EntrepriseDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/entreprise/dashboard')
      .then(r => r.json())
      .then((json: EntrepriseDashboardData) => { if (json.success) setData(json) })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false))
  }, [])

  const kpis = data?.kpis

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Solde bancaire"
          value={kpis != null ? fmt(kpis.solde_bancaire) : '—'}
          subtitle="Comptes actifs cumulés"
          icon={<Landmark className="w-4 h-4" />}
          color="emerald"
          loading={loading}
        />
        <KpiCard
          title="Charges du mois"
          value={kpis != null ? fmt(kpis.charges_mois) : '—'}
          subtitle="Factures fournisseurs reçues"
          icon={<ShoppingBag className="w-4 h-4" />}
          color="red"
          loading={loading}
        />
        <KpiCard
          title="Factures en attente"
          value={kpis != null ? String(kpis.factures_attente) : '—'}
          subtitle="Créances clients non encaissées"
          icon={<Clock className="w-4 h-4" />}
          color="amber"
          loading={loading}
        />
        <KpiCard
          title="Économies auto"
          value={kpis != null ? fmt(kpis.economies_automatisation) : '—'}
          subtitle="Estimées ce mois (€15/action)"
          icon={<Zap className="w-4 h-4" />}
          color="violet"
          loading={loading}
        />
      </div>

      {/* Chart */}
      <DepensesChart data={data?.chart_6m ?? []} loading={loading} />
    </div>
  )
}
