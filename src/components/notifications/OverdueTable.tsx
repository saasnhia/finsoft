'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import {
  AlertTriangle,
  Clock,
  Mail,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react'
import type { FactureEnRetard, NiveauRetard } from '@/types'

const NIVEAU_CONFIG: Record<NiveauRetard, { label: string; color: string; bg: string; border: string; badge: string; icon: string }> = {
  leger: {
    label: 'Léger (1-7j)',
    color: 'text-gold-700',
    bg: 'bg-gold-50',
    border: 'border-gold-200',
    badge: 'bg-gold-100 text-gold-700',
    icon: 'text-gold-500',
  },
  moyen: {
    label: 'Moyen (8-15j)',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'text-amber-500',
  },
  critique: {
    label: 'Critique (16-30j)',
    color: 'text-coral-700',
    bg: 'bg-coral-50',
    border: 'border-coral-200',
    badge: 'bg-coral-100 text-coral-700',
    icon: 'text-coral-500',
  },
  contentieux: {
    label: 'Contentieux (30j+)',
    color: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
    icon: 'text-red-600',
  },
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

interface OverdueTableProps {
  factures: FactureEnRetard[]
  onSendReminder: (factureId: string) => void
  onMarkPaid: (factureId: string) => void
  sendingId: string | null
}

export function OverdueTable({ factures, onSendReminder, onMarkPaid, sendingId }: OverdueTableProps) {
  const [filterNiveau, setFilterNiveau] = useState<NiveauRetard | null>(null)
  const [sortField, setSortField] = useState<'jours_retard' | 'montant_restant'>('jours_retard')
  const [sortAsc, setSortAsc] = useState(false)

  const filteredFactures = factures
    .filter(f => !filterNiveau || f.niveau_retard === filterNiveau)
    .sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      return sortAsc ? valA - valB : valB - valA
    })

  const toggleSort = (field: 'jours_retard' | 'montant_restant') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />
  }

  if (factures.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="font-display font-semibold text-navy-900 mb-1">
          Aucune facture en retard
        </h3>
        <p className="text-sm text-navy-500 max-w-sm">
          Tous vos clients sont à jour de leurs paiements. Bravo !
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-navy-400" />
        <button
          onClick={() => setFilterNiveau(null)}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            filterNiveau === null ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-navy-500 hover:bg-navy-100'
          }`}
        >
          Tous ({factures.length})
        </button>
        {(Object.keys(NIVEAU_CONFIG) as NiveauRetard[]).map(niveau => {
          const count = factures.filter(f => f.niveau_retard === niveau).length
          if (count === 0) return null
          const config = NIVEAU_CONFIG[niveau]
          return (
            <button
              key={niveau}
              onClick={() => setFilterNiveau(filterNiveau === niveau ? null : niveau)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                filterNiveau === niveau ? `${config.badge} font-medium` : 'text-navy-500 hover:bg-navy-100'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Facture</th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-navy-500 cursor-pointer select-none hover:text-navy-700"
                  onClick={() => toggleSort('montant_restant')}
                >
                  Montant dû <SortIcon field="montant_restant" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-navy-500">Échéance</th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-navy-500 cursor-pointer select-none hover:text-navy-700"
                  onClick={() => toggleSort('jours_retard')}
                >
                  Retard <SortIcon field="jours_retard" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-navy-500">Niveau</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-navy-500">Rappels</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filteredFactures.map((facture) => {
                const config = NIVEAU_CONFIG[facture.niveau_retard]
                const clientNom = facture.client?.nom || 'Client inconnu'
                const clientEmail = facture.client?.email || null

                return (
                  <tr key={facture.id} className="hover:bg-navy-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy-900 text-sm">{clientNom}</div>
                      {clientEmail && (
                        <div className="text-xs text-navy-400 mt-0.5">{clientEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-navy-800 text-xs">{facture.numero_facture}</div>
                      {facture.objet && (
                        <div className="text-xs text-navy-400 mt-0.5 truncate max-w-[160px]">{facture.objet}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-navy-900">
                        {formatEuro(facture.montant_restant)}
                      </span>
                      {facture.montant_paye > 0 && (
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          {formatEuro(facture.montant_paye)} reçu
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-navy-600">
                      {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold text-sm ${config.color}`}>
                        {facture.jours_retard}j
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.badge}`}>
                        <AlertTriangle className={`w-2.5 h-2.5 ${config.icon}`} />
                        {facture.niveau_retard === 'leger' ? 'Léger'
                          : facture.niveau_retard === 'moyen' ? 'Moyen'
                          : facture.niveau_retard === 'critique' ? 'Critique'
                          : 'Contentieux'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mail className="w-3 h-3 text-navy-400" />
                        <span className="text-xs text-navy-600">{facture.nombre_rappels_envoyes}</span>
                      </div>
                      {facture.date_dernier_rappel && (
                        <div className="text-[10px] text-navy-400 mt-0.5">
                          {new Date(facture.date_dernier_rappel).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {clientEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendReminder(facture.id)}
                            loading={sendingId === facture.id}
                            icon={<Mail className="w-3 h-3" />}
                          >
                            Relancer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkPaid(facture.id)}
                          icon={<CheckCircle2 className="w-3 h-3" />}
                        >
                          Payé
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-xs text-navy-500 px-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {filteredFactures.length} facture{filteredFactures.length > 1 ? 's' : ''} en retard
        </div>
        <div className="font-mono font-medium text-navy-700">
          Total dû : {formatEuro(filteredFactures.reduce((sum, f) => sum + f.montant_restant, 0))}
        </div>
      </div>
    </div>
  )
}
