'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DepenseRow } from '@/app/api/entreprise/depenses/route'

interface Props {
  depenses: DepenseRow[]
  loading: boolean
}

const COLORS = ['#22D3A5', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316']

function fmtEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function DepensesPieChart({ depenses, loading }: Props) {
  if (loading) {
    return <div className="h-64 bg-slate-700/40 animate-pulse rounded-xl" />
  }

  if (depenses.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm rounded-xl border border-slate-700/60">
        Aucune donnée
      </div>
    )
  }

  const data = depenses.map(d => ({ name: d.libelle, value: d.total }))

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Répartition des dépenses</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [fmtEur(value), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#64748B' }}
            formatter={(value: string) => value.length > 20 ? value.slice(0, 20) + '…' : value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
