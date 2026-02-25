'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout'
import { DepensesTable } from '@/components/entreprise/DepensesTable'
import { DepensesPieChart } from '@/components/entreprise/DepensesPieChart'
import { PieChart, Download } from 'lucide-react'
import type { DepenseRow } from '@/app/api/entreprise/depenses/route'

type Periode = '3m' | '6m' | '1y'

interface ApiResponse {
  success: boolean
  depenses: DepenseRow[]
  total: number
  periode: string
  date_debut: string
  date_fin: string
}

const PERIODE_LABELS: Record<Periode, string> = {
  '3m': '3 derniers mois',
  '6m': '6 derniers mois',
  '1y': 'Dernière année',
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function exportCSV(depenses: DepenseRow[], total: number) {
  const header = 'Compte PCG;Libellé;Nb factures;Total TTC (€);%\n'
  const rows = depenses.map(d => {
    const pct = total > 0 ? Math.round((d.total / total) * 1000) / 10 : 0
    return `${d.compte_comptable}x;${d.libelle};${d.count};${d.total.toFixed(2)};${pct}`
  })
  const csv = header + rows.join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `depenses-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DepensesPage() {
  const [periode, setPeriode] = useState<Periode>('3m')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/entreprise/depenses?periode=${periode}`)
      .then(r => r.json())
      .then((json: ApiResponse) => { if (json.success) setData(json) })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [periode])

  const depenses = data?.depenses ?? []
  const total = data?.total ?? 0

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <PieChart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dépenses par catégorie</h1>
              <p className="text-sm text-slate-400">
                {data
                  ? `Du ${fmtDate(data.date_debut)} au ${fmtDate(data.date_fin)}`
                  : 'Chargement…'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtre période */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
              {(Object.keys(PERIODE_LABELS) as Periode[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    periode === p
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '3m' ? '3 mois' : p === '6m' ? '6 mois' : '1 an'}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportCSV(depenses, total)}
              disabled={loading || depenses.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* KPI rapide */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-emerald-500/20 bg-slate-800/60 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total dépenses</p>
            {loading ? (
              <div className="h-7 w-24 bg-slate-700 animate-pulse rounded" />
            ) : (
              <p className="text-xl font-bold text-emerald-400">{fmt(total)}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{PERIODE_LABELS[periode]}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Catégories</p>
            {loading ? (
              <div className="h-7 w-12 bg-slate-700 animate-pulse rounded" />
            ) : (
              <p className="text-xl font-bold text-white">{depenses.length}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Comptes PCG distincts</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Poste principal</p>
            {loading ? (
              <div className="h-7 w-32 bg-slate-700 animate-pulse rounded" />
            ) : (
              <p className="text-xl font-bold text-white truncate">
                {depenses[0]?.libelle.split(' ')[0] ?? '—'}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">{depenses[0] ? fmt(depenses[0].total) : '—'}</p>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Table — 2/3 */}
          <div className="lg:col-span-2">
            <DepensesTable depenses={depenses} total={total} loading={loading} />
          </div>

          {/* Pie chart — 1/3 */}
          <div>
            <DepensesPieChart depenses={depenses} loading={loading} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
