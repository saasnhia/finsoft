'use client'

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
} from 'recharts'
import type { FluxItem } from '@/app/api/entreprise/tresorerie/route'

interface Props {
  soldeActuel: number
  flux: FluxItem[]
  loading: boolean
}

interface ChartPoint {
  date: string
  label: string
  solde: number
  type: 'historique' | 'prevision'
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function buildCurve(flux: FluxItem[], soldeActuel: number): ChartPoint[] {
  if (flux.length === 0) return []

  // Sépare historique et prévision
  const historique = flux.filter(f => f.type === 'historique').sort((a, b) => a.date.localeCompare(b.date))
  const previsions = flux.filter(f => f.type === 'prevision').sort((a, b) => a.date.localeCompare(b.date))

  // Reconstruit le solde historique à rebours depuis soldeActuel
  const histPoints: ChartPoint[] = []
  let cumul = soldeActuel
  const histReversed = [...historique].reverse()
  for (const f of histReversed) {
    cumul -= f.montant
    histPoints.unshift({ date: f.date, label: fmtDate(f.date), solde: cumul, type: 'historique' })
  }
  // Point actuel
  histPoints.push({ date: new Date().toISOString().split('T')[0], label: "Aujourd'hui", solde: soldeActuel, type: 'historique' })

  // Prévisions cumulées à partir du solde actuel
  const prevPoints: ChartPoint[] = []
  let prevCumul = soldeActuel
  for (const f of previsions) {
    prevCumul += f.montant
    prevPoints.push({ date: f.date, label: fmtDate(f.date), solde: prevCumul, type: 'prevision' })
  }

  return [...histPoints, ...prevPoints]
}

export function TresorerieChart({ soldeActuel, flux, loading }: Props) {
  if (loading) {
    return <div className="h-64 bg-slate-700/40 animate-pulse rounded-xl" />
  }

  const points = buildCurve(flux, soldeActuel)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Évolution de la trésorerie</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Historique (trait plein) · Prévisions (trait pointillé)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={points} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number, _: string, props: { payload?: ChartPoint }) => [
              fmtEur(value),
              props.payload?.type === 'prevision' ? 'Prévision' : 'Solde',
            ]}
          />
          <ReferenceLine x={fmtDate(today)} stroke="#334155" strokeDasharray="4 4" label={{ value: 'Aujourd\'hui', fill: '#64748B', fontSize: 10 }} />
          <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="2 2" />
          {/* Zone historique */}
          <Area
            dataKey={(d: ChartPoint) => d.type === 'historique' ? d.solde : null}
            fill="#22D3A5"
            fillOpacity={0.08}
            stroke="transparent"
          />
          {/* Ligne historique */}
          <Line
            dataKey={(d: ChartPoint) => d.type === 'historique' ? d.solde : null}
            stroke="#22D3A5"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Historique"
          />
          {/* Ligne prévisions */}
          <Line
            dataKey={(d: ChartPoint) => d.type === 'prevision' ? d.solde : null}
            stroke="#22D3A5"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            name="Prévision"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
