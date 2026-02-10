'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  X,
  Mail,
  Send,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { FactureEnRetard, TypeRappel } from '@/types'

const TYPE_OPTIONS: { value: TypeRappel; label: string; description: string }[] = [
  { value: 'rappel_7j', label: 'Rappel courtois', description: 'Ton amical, simple rappel de paiement' },
  { value: 'rappel_15j', label: 'Rappel ferme', description: 'Ton professionnel, mention d\'urgence' },
  { value: 'rappel_30j', label: 'Relance urgente', description: 'Mention pénalités de retard et recouvrement' },
  { value: 'mise_en_demeure', label: 'Mise en demeure', description: 'Dernier recours, référence légale (art. L441-10)' },
  { value: 'manuel', label: 'Rappel personnalisé', description: 'Template générique neutre' },
]

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

interface SendReminderModalProps {
  facture: FactureEnRetard
  onClose: () => void
  onSend: (factureId: string, typeRappel: TypeRappel) => Promise<void>
}

export function SendReminderModal({ facture, onClose, onSend }: SendReminderModalProps) {
  // Auto-select the appropriate type based on delay
  const autoType: TypeRappel = facture.jours_retard > 30
    ? 'mise_en_demeure'
    : facture.jours_retard > 15
    ? 'rappel_30j'
    : facture.jours_retard > 7
    ? 'rappel_15j'
    : 'rappel_7j'

  const [selectedType, setSelectedType] = useState<TypeRappel>(autoType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientNom = facture.client?.nom || 'Client'
  const clientEmail = facture.client?.email

  const handleSend = async () => {
    if (!clientEmail) {
      setError('Ce client n\'a pas d\'adresse email')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await onSend(facture.id, selectedType)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-coral-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-coral-600" />
            </div>
            <h2 className="font-display font-semibold text-navy-900">Envoyer un rappel</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-navy-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invoice summary */}
          <div className="bg-navy-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy-600">Client</span>
              <span className="text-sm font-medium text-navy-900">{clientNom}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy-600">Facture</span>
              <span className="text-sm font-mono text-navy-900">{facture.numero_facture}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy-600">Montant dû</span>
              <span className="text-sm font-mono font-bold text-coral-600">
                {formatEuro(facture.montant_restant)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy-600">Retard</span>
              <span className="text-sm font-bold text-coral-600">{facture.jours_retard} jours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy-600">Destinataire</span>
              <span className="text-sm text-navy-900">{clientEmail || 'Pas d\'email'}</span>
            </div>
          </div>

          {/* Type selection */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">Type de rappel</label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedType === opt.value
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-navy-100 hover:border-navy-200 hover:bg-navy-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type_rappel"
                    value={opt.value}
                    checked={selectedType === opt.value}
                    onChange={() => setSelectedType(opt.value)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-navy-900">{opt.label}</div>
                    <div className="text-xs text-navy-500 mt-0.5">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Warning for mise en demeure */}
          {selectedType === 'mise_en_demeure' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                La mise en demeure fait référence à l&apos;article L441-10 du Code de commerce et mentionne
                des pénalités de retard. Il est recommandé d&apos;envoyer également une version papier par
                lettre recommandée avec accusé de réception.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-coral-50 border border-coral-200 rounded-xl text-sm text-coral-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleSend}
              loading={loading}
              disabled={!clientEmail}
              icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              Envoyer le rappel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
