'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChartEntry } from '@/app/api/entreprise/dashboard/route'

interface Props {
  data: ChartEntry[]
  loading: boolean
}

function fmtMois(mois: string): string {
  const [year, month] = mois.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function fmtEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

const BARS = [
  { key: 'achats',    label: 'Achats (60x)',        color: '#22D3A5' },
  { key: 'services',  label: 'Services (61-62x)',   color: '#3B82F6' },
  { key: 'personnel', label: 'Personnel (64x)',      color: '#F59E0B' },
  { key: 'autres',    label: 'Autres charges',       color: '#8B5CF6' },
]

export function DepensesChart({ data, loading }: Props) {
  const chartData = data.map(d => ({ ...d, moisLabel: fmtMois(d.mois) }))

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-navy-900">Dépenses par catégorie PCG — 6 mois</h3>
        <p className="text-xs text-navy-400 mt-0.5">Factures fournisseurs classées par compte</p>
      </div>

      {loading ? (
        <div className="h-48 bg-navy-50 animate-pulse rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="moisLabel"
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#334155', marginBottom: 4 }}
              formatter={(value: number, name: string) => [fmtEur(value), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 8 }}
            />
            {BARS.map(b => (
              <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} stackId="a" radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
