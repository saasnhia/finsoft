'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Save, RotateCcw } from 'lucide-react'
import type { FinancialData } from '@/types'

interface DataInputFormProps {
  initialData?: FinancialData | null
  onSave: (data: Partial<FinancialData>) => Promise<void>
  disabled?: boolean
  importedData?: any // Ajouté pour l'import automatique
}

export function DataInputForm({ initialData, onSave, disabled, importedData }: DataInputFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rent: 0,
    salaries: 0,
    insurance: 0,
    subscriptions: 0,
    loan_payments: 0,
    other: 0,
    variable_cost_rate: 0,
    revenue: 0,
  })

  // Remplissage auto si importedData change
  useEffect(() => {
    if (importedData) {
      setFormData({
        rent: importedData.rent ?? formData.rent,
        salaries: importedData.salary ?? formData.salaries,
        insurance: importedData.insurance ?? formData.insurance,
        subscriptions: importedData.subscriptions ?? formData.subscriptions,
        loan_payments: importedData.loans ?? formData.loan_payments,
        other: importedData.other_expenses ?? formData.other,
        variable_cost_rate: importedData.variable_cost_rate ?? formData.variable_cost_rate,
        revenue: importedData.revenue ?? formData.revenue,
      })
    }
  }, [importedData])

  useEffect(() => {
    if (initialData) {
      setFormData({
        rent: initialData.fixed_costs.rent,
        salaries: initialData.fixed_costs.salaries,
        insurance: initialData.fixed_costs.insurance,
        subscriptions: initialData.fixed_costs.subscriptions,
        loan_payments: initialData.fixed_costs.loan_payments,
        other: initialData.fixed_costs.other,
        variable_cost_rate: initialData.variable_cost_rate,
        revenue: initialData.revenue,
      })
    }
  }, [initialData])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave({
        fixed_costs: {
          rent: formData.rent,
          salaries: formData.salaries,
          insurance: formData.insurance,
          subscriptions: formData.subscriptions,
          loan_payments: formData.loan_payments,
          other: formData.other,
        },
        variable_cost_rate: formData.variable_cost_rate,
        revenue: formData.revenue,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (initialData) {
      setFormData({
        rent: initialData.fixed_costs.rent,
        salaries: initialData.fixed_costs.salaries,
        insurance: initialData.fixed_costs.insurance,
        subscriptions: initialData.fixed_costs.subscriptions,
        loan_payments: initialData.fixed_costs.loan_payments,
        other: initialData.fixed_costs.other,
        variable_cost_rate: initialData.variable_cost_rate,
        revenue: initialData.revenue,
      })
    }
  }

  const totalFixedCosts = 
    formData.rent + 
    formData.salaries + 
    formData.insurance + 
    formData.subscriptions + 
    formData.loan_payments + 
    formData.other

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-navy-900">
            Saisie des données
          </h3>
          <p className="text-sm text-navy-500 mt-0.5">
            Mettez à jour vos chiffres mensuels
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chiffre d'affaires */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <h4 className="text-sm font-semibold text-emerald-800 mb-3">
            Chiffre d&apos;Affaires
          </h4>
          <Input
            type="number"
            value={formData.revenue || ''}
            onChange={handleChange('revenue')}
            placeholder="0"
            suffix="€"
            disabled={disabled}
          />
        </div>

        {/* Charges fixes */}
        <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
          <h4 className="text-sm font-semibold text-navy-800 mb-3">
            Charges Fixes Mensuelles
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Loyer"
              type="number"
              value={formData.rent || ''}
              onChange={handleChange('rent')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
            <Input
              label="Salaires"
              type="number"
              value={formData.salaries || ''}
              onChange={handleChange('salaries')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
            <Input
              label="Assurances"
              type="number"
              value={formData.insurance || ''}
              onChange={handleChange('insurance')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
            <Input
              label="Abonnements"
              type="number"
              value={formData.subscriptions || ''}
              onChange={handleChange('subscriptions')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
            <Input
              label="Emprunts"
              type="number"
              value={formData.loan_payments || ''}
              onChange={handleChange('loan_payments')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
            <Input
              label="Autres"
              type="number"
              value={formData.other || ''}
              onChange={handleChange('other')}
              placeholder="0"
              suffix="€"
              disabled={disabled}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-navy-200 flex justify-between">
            <span className="text-sm font-medium text-navy-600">Total charges fixes</span>
            <span className="font-mono font-semibold text-navy-900">
              {totalFixedCosts.toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>

        {/* Charges variables */}
        <div className="p-4 bg-gold-50 rounded-xl border border-gold-100">
          <h4 className="text-sm font-semibold text-gold-800 mb-3">
            Taux de Charges Variables
          </h4>
          <Input
            type="number"
            value={formData.variable_cost_rate || ''}
            onChange={handleChange('variable_cost_rate')}
            placeholder="0"
            suffix="%"
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
          />
          <p className="mt-2 text-xs text-gold-700">
            Pourcentage du CA consommé par les charges variables (achats, sous-traitance...)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={disabled || loading}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Réinitialiser
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={disabled}
            icon={<Save className="w-4 h-4" />}
            className="flex-1"
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}
