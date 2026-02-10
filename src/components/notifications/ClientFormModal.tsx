'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react'

interface ClientFormModalProps {
  onClose: () => void
  onSubmit: (data: {
    nom: string
    email: string
    telephone: string
    adresse: string
    siren: string
    notes: string
  }) => Promise<void>
}

export function ClientFormModal({ onClose, onSubmit }: ClientFormModalProps) {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    siren: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom du client est requis')
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
              <User className="w-4 h-4 text-brand-green-primary" />
            </div>
            <h2 className="font-display font-semibold text-navy-900">Nouveau client</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-navy-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Nom / Raison sociale *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                placeholder="Ex: SARL Dupont & Fils"
                className="w-full pl-10 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contact@entreprise.fr"
                className="w-full pl-10 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-navy-400 mt-1">Requis pour l&apos;envoi de rappels par email</p>
          </div>

          {/* Téléphone + SIREN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder="01 23 45 67 89"
                  className="w-full pl-10 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">SIREN</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="siren"
                  value={form.siren}
                  onChange={handleChange}
                  placeholder="123 456 789"
                  maxLength={11}
                  className="w-full pl-10 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Adresse</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-navy-400 absolute left-3 top-3" />
              <input
                type="text"
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full pl-10 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              Créer le client
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
