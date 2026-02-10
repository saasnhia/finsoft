'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  X,
  FileText,
  Loader2,
} from 'lucide-react'
import type { Client } from '@/types'

interface InvoiceFormModalProps {
  clients: Client[]
  onClose: () => void
  onSubmit: (data: {
    client_id: string
    numero_facture: string
    objet: string
    montant_ht: string
    tva: string
    montant_ttc: string
    date_emission: string
    date_echeance: string
    notes: string
  }) => Promise<void>
}

export function InvoiceFormModal({ clients, onClose, onSubmit }: InvoiceFormModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const defaultEcheance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: '',
    numero_facture: '',
    objet: '',
    montant_ht: '',
    tva: '',
    montant_ttc: '',
    date_emission: today,
    date_echeance: defaultEcheance,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }

      // Auto-calcul TTC quand HT ou TVA change
      if (name === 'montant_ht' || name === 'tva') {
        const ht = parseFloat(name === 'montant_ht' ? value : next.montant_ht) || 0
        const tva = parseFloat(name === 'tva' ? value : next.tva) || 0
        next.montant_ttc = (ht + tva).toFixed(2)
      }

      return next
    })
  }

  const handleHTBlur = () => {
    // Auto-calcul TVA à 20% si le champ TVA est vide
    if (form.montant_ht && !form.tva) {
      const ht = parseFloat(form.montant_ht) || 0
      const tva = ht * 0.2
      setForm(prev => ({
        ...prev,
        tva: tva.toFixed(2),
        montant_ttc: (ht + tva).toFixed(2),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) {
      setError('Veuillez sélectionner un client')
      return
    }
    if (!form.numero_facture.trim()) {
      setError('Le numéro de facture est requis')
      return
    }
    if (!form.montant_ttc || parseFloat(form.montant_ttc) <= 0) {
      setError('Le montant TTC doit être supérieur à 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(form)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green-light rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-green-primary" />
            </div>
            <h2 className="font-display font-semibold text-navy-900">Nouvelle facture client</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-navy-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Client *</label>
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">Sélectionner un client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="text-xs text-coral-500 mt-1">Aucun client. Créez d&apos;abord un client.</p>
            )}
          </div>

          {/* Numéro + Objet */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">N° Facture *</label>
              <input
                type="text"
                name="numero_facture"
                value={form.numero_facture}
                onChange={handleChange}
                required
                placeholder="FAC-2026-001"
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Objet</label>
              <input
                type="text"
                name="objet"
                value={form.objet}
                onChange={handleChange}
                placeholder="Prestation de service"
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Montant HT (€)</label>
              <input
                type="number"
                name="montant_ht"
                value={form.montant_ht}
                onChange={handleChange}
                onBlur={handleHTBlur}
                step="0.01"
                min="0"
                placeholder="1 000,00"
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">TVA (€)</label>
              <input
                type="number"
                name="tva"
                value={form.tva}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="200,00"
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Montant TTC (€) *</label>
              <input
                type="number"
                name="montant_ttc"
                value={form.montant_ttc}
                onChange={handleChange}
                required
                step="0.01"
                min="0.01"
                placeholder="1 200,00"
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Date d&apos;émission</label>
              <input
                type="date"
                name="date_emission"
                value={form.date_emission}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Date d&apos;échéance *</label>
              <input
                type="date"
                name="date_echeance"
                value={form.date_echeance}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Notes internes..."
              className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-coral-50 border border-coral-200 rounded-xl text-sm text-coral-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              Créer la facture
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
