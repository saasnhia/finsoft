'use client'

import { X, Lightbulb, TrendingDown, TrendingUp, Target, ArrowRight } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/calculations'

interface ImprovementModalProps {
  breakEvenDays: number
  totalFixedCosts: number
  revenue: number
  marginRate: number
  onClose: () => void
}

export function ImprovementModal({
  breakEvenDays,
  totalFixedCosts,
  revenue,
  marginRate,
  onClose,
}: ImprovementModalProps) {
  // Calculate improvement scenarios
  const targetDays = 180
  const reduction10pct = Math.round(totalFixedCosts * 0.10)
  const newBreakEvenAfterCostCut = marginRate > 0
    ? Math.round(((totalFixedCosts - reduction10pct) / (revenue * marginRate)) * 30)
    : breakEvenDays
  const daysGainedCostCut = breakEvenDays - newBreakEvenAfterCostCut

  const priceIncrease = 0.10
  const newRevenueAfterPrice = revenue * (1 + priceIncrease)
  const newBreakEvenAfterPrice = marginRate > 0
    ? Math.round((totalFixedCosts / (newRevenueAfterPrice * marginRate)) * 30)
    : breakEvenDays
  const daysGainedPrice = breakEvenDays - newBreakEvenAfterPrice

  const caIncrease = 0.20
  const newRevenueAfterCampaign = revenue * (1 + caIncrease)
  const newBreakEvenAfterCampaign = marginRate > 0
    ? Math.round((totalFixedCosts / (newRevenueAfterCampaign * marginRate)) * 30)
    : breakEvenDays
  const daysGainedCampaign = breakEvenDays - newBreakEvenAfterCampaign

  const recommendations = [
    {
      number: 1,
      title: 'Renégocier vos charges fixes',
      description: 'Réduire de 10% vos charges fixes (loyer, assurances, abonnements)',
      impact: `-${daysGainedCostCut}j`,
      detail: `Économie de ${formatCurrency(reduction10pct)}/mois`,
      icon: TrendingDown,
      color: 'emerald',
    },
    {
      number: 2,
      title: 'Augmenter vos prix de 10%',
      description: 'Revaloriser votre offre pour améliorer la marge',
      impact: `-${daysGainedPrice}j`,
      detail: `CA estimé à ${formatCurrency(newRevenueAfterPrice)}/mois`,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      number: 3,
      title: 'Lancer une campagne commerciale',
      description: 'Objectif +20% de CA via acquisition clients',
      impact: `-${daysGainedCampaign}j`,
      detail: `Objectif CA : ${formatCurrency(newRevenueAfterCampaign)}/mois`,
      icon: Target,
      color: 'violet',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg">
                  Comment réduire votre Point Mort ?
                </h2>
                <p className="text-amber-100 text-sm">
                  3 actions concrètes avec impact estimé
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Current vs Target */}
        <div className="px-6 py-4 bg-navy-50 flex items-center justify-between">
          <div>
            <span className="text-xs text-navy-500">Actuellement</span>
            <p className="text-2xl font-mono font-bold text-coral-600">{breakEvenDays} jours</p>
          </div>
          <ArrowRight className="w-5 h-5 text-navy-300" />
          <div className="text-right">
            <span className="text-xs text-navy-500">Objectif recommandé</span>
            <p className="text-2xl font-mono font-bold text-emerald-600">&lt; {targetDays} jours</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {recommendations.map((rec) => (
            <div
              key={rec.number}
              className="flex items-start gap-3 p-4 border border-navy-100 rounded-xl hover:bg-navy-50/50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                rec.color === 'emerald' ? 'bg-emerald-100' :
                rec.color === 'blue' ? 'bg-blue-100' :
                'bg-violet-100'
              }`}>
                <rec.icon className={`w-4 h-4 ${
                  rec.color === 'emerald' ? 'text-emerald-600' :
                  rec.color === 'blue' ? 'text-blue-600' :
                  'text-violet-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-navy-900">
                    {rec.number}. {rec.title}
                  </h4>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-xs text-navy-500 mt-0.5">{rec.description}</p>
                <p className="text-xs text-navy-400 mt-1 font-mono">{rec.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-navy-100 bg-navy-50/50">
          <p className="text-[11px] text-navy-400 text-center">
            Ces estimations sont indicatives et basées sur vos données actuelles. Consultez votre expert-comptable pour un plan d&apos;action personnalisé.
          </p>
        </div>
      </div>
    </div>
  )
}
