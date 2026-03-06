'use client'

import Link from 'next/link'
import { CheckCircle2, X, ArrowRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DATA — comparatif simplifié, 7 lignes clés
// ─────────────────────────────────────────────────────────────

interface CompRow {
  feature: string
  worthifast: boolean | string
  pennylane: boolean | string
}

const ROWS: CompRow[] = [
  { feature: 'Dossiers illimités (pas de facturation au dossier)', worthifast: true, pennylane: false },
  { feature: 'E-invoicing 2026 natif (Factur-X EN16931)', worthifast: true, pennylane: 'Partiel' },
  { feature: 'Relances automatiques impayés (J+7/J+15/J+30)', worthifast: true, pennylane: false },
  { feature: 'IA spécialisée PCG, BOFIP et CGI', worthifast: true, pennylane: 'Généraliste' },
  { feature: 'Migration FEC + connecteurs Cegid & Sage (déploiement T2 2026)', worthifast: 'Bientôt', pennylane: false },
  { feature: 'Connexion bancaire Open Banking', worthifast: 'Bientôt', pennylane: true },
  { feature: 'Données hébergées en Europe (RGPD)', worthifast: true, pennylane: true },
]

const ROADMAP = [
  'Connecteurs Cegid (OAuth2) & Sage (Chift) — code prêt, déploiement T2 2026',
  'Connexion bancaire Open Banking — en cours',
  'Lettrage avancé et multi-exercice — prévu T3 2026',
  'Signature électronique portail — sur la roadmap',
]

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

function CellIcon({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
  if (value === false) return <X className="w-5 h-5 text-gray-300 mx-auto" />
  return <span className="text-xs font-medium text-amber-600">{value}</span>
}

export function ComparatifSection() {
  return (
    <section id="comparatif" className="py-24 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Worthifast vs Pennylane — comparatif honnête
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Nous montrons clairement où Worthifast excelle et où nous devons encore progresser.
          </p>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Fonctionnalité</th>
                <th className="text-center px-4 py-4 font-bold text-emerald-700 w-32">Worthifast</th>
                <th className="text-center px-4 py-4 font-bold text-slate-500 w-32">Pennylane</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ROWS.map(row => (
                <tr key={row.feature} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-slate-700">{row.feature}</td>
                  <td className="px-4 py-4 text-center"><CellIcon value={row.worthifast} /></td>
                  <td className="px-4 py-4 text-center"><CellIcon value={row.pennylane} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Roadmap */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Ce qui arrive bientôt</h3>
          <ul className="space-y-2">
            {ROADMAP.map(r => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600">
                <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center mt-8">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors text-sm">
            Tester Worthifast gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
