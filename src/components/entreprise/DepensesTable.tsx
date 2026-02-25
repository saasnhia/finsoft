'use client'

import type { DepenseRow } from '@/app/api/entreprise/depenses/route'

interface Props {
  depenses: DepenseRow[]
  total: number
  loading: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export function DepensesTable({ depenses, total, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-700/40 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (depenses.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Aucune dépense trouvée pour la période sélectionnée
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/60 bg-slate-800/80">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Compte PCG</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Libellé</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nb factures</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Total TTC</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">% total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40">
          {depenses.map(d => {
            const pct = total > 0 ? Math.round((d.total / total) * 1000) / 10 : 0
            return (
              <tr key={d.compte_comptable} className="bg-slate-800/40 hover:bg-slate-700/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{d.compte_comptable}x</td>
                <td className="px-4 py-3 text-white font-medium">{d.libelle}</td>
                <td className="px-4 py-3 text-center text-slate-400">{d.count}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-white">{fmt(d.total)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-600 bg-slate-800/80">
            <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-300">Total</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-white">{fmt(total)}</td>
            <td className="px-4 py-3 text-right text-xs text-slate-400">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
