'use client'

import { Card } from '@/components/ui'
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { RappelEmail, TypeRappel } from '@/types'

const TYPE_LABELS: Record<TypeRappel, string> = {
  rappel_7j: 'Rappel 7 jours',
  rappel_15j: 'Rappel 15 jours',
  rappel_30j: 'Rappel 30 jours',
  mise_en_demeure: 'Mise en demeure',
  manuel: 'Rappel manuel',
}

const TYPE_COLORS: Record<TypeRappel, string> = {
  rappel_7j: 'bg-gold-100 text-gold-700',
  rappel_15j: 'bg-amber-100 text-amber-700',
  rappel_30j: 'bg-coral-100 text-coral-700',
  mise_en_demeure: 'bg-red-100 text-red-800',
  manuel: 'bg-navy-100 text-navy-700',
}

interface ReminderHistoryProps {
  rappels: RappelEmail[]
}

export function ReminderHistory({ rappels }: ReminderHistoryProps) {
  if (rappels.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-navy-400" />
        </div>
        <h3 className="font-display font-semibold text-navy-900 mb-1">
          Aucun rappel envoyé
        </h3>
        <p className="text-sm text-navy-500 max-w-sm">
          L&apos;historique des emails de rappel apparaîtra ici après le premier envoi.
        </p>
      </Card>
    )
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Destinataire</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Sujet</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-navy-500">Type</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-navy-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {rappels.map((rappel) => (
              <tr key={rappel.id} className="hover:bg-navy-50/30 transition-colors">
                <td className="px-4 py-3 text-xs text-navy-600 whitespace-nowrap">
                  {new Date(rappel.date_envoi).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-navy-900">{rappel.client?.nom || 'Client'}</div>
                  <div className="text-xs text-navy-400">{rappel.email_destinataire}</div>
                </td>
                <td className="px-4 py-3 text-sm text-navy-700 max-w-[280px] truncate">
                  {rappel.sujet}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[rappel.type_rappel]}`}>
                    {TYPE_LABELS[rappel.type_rappel]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {rappel.statut_envoi === 'envoye' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Envoyé
                    </span>
                  ) : rappel.statut_envoi === 'echoue' ? (
                    <span className="inline-flex items-center gap-1 text-coral-600 text-xs" title={rappel.erreur || undefined}>
                      <XCircle className="w-3.5 h-3.5" />
                      Échoué
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-navy-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      En attente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats footer */}
      <div className="px-4 py-3 border-t border-navy-100 bg-navy-50/30 flex items-center justify-between text-xs text-navy-500">
        <span>{rappels.length} rappel{rappels.length > 1 ? 's' : ''} au total</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {rappels.filter(r => r.statut_envoi === 'envoye').length} envoyés
          </span>
          {rappels.some(r => r.statut_envoi === 'echoue') && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-coral-500" />
              {rappels.filter(r => r.statut_envoi === 'echoue').length} échoués
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
