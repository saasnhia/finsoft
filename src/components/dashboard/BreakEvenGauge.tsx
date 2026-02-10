'use client'

import { Card } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/lib/calculations'

interface BreakEvenGaugeProps {
  revenue: number
  breakEvenPoint: number
  safetyMarginPercent: number
  healthStatus: 'excellent' | 'good' | 'warning' | 'danger'
}

export function BreakEvenGauge({
  revenue,
  breakEvenPoint,
  safetyMarginPercent,
  healthStatus,
}: BreakEvenGaugeProps) {
  // Calculate percentage for the gauge (cap at 150% for visualization)
  const percentage = Math.min((revenue / breakEvenPoint) * 100, 150)
  const gaugePercentage = (percentage / 150) * 100

  const statusConfig = {
    excellent: {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      label: 'Excellent',
      message: 'Votre marge de sécurité est confortable',
    },
    good: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      label: 'Bon',
      message: 'Situation financière saine',
    },
    warning: {
      color: 'text-gold-500',
      bgColor: 'bg-gold-500',
      label: 'Attention',
      message: 'Proche du seuil de rentabilité',
    },
    danger: {
      color: 'text-coral-500',
      bgColor: 'bg-coral-500',
      label: 'Critique',
      message: 'En dessous du seuil de rentabilité',
    },
  }

  const config = statusConfig[healthStatus]

  // Calculate circumference for SVG arc
  const radius = 80
  const circumference = Math.PI * radius // Semi-circle
  const strokeDashoffset = circumference - (gaugePercentage / 100) * circumference

  return (
    <Card className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-display font-semibold text-navy-900">
          Seuil de Rentabilité
        </h3>
        <p className="text-sm text-navy-500 mt-0.5">
          Position par rapport au point mort
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Gauge SVG */}
        <div className="relative w-48 h-28">
          <svg
            className="w-full h-full"
            viewBox="0 0 200 110"
          >
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="16"
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeLinecap="round"
              className={config.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />

            {/* Threshold marker at 66.67% (where SR = 100%) */}
            <line
              x1="100"
              y1="30"
              x2="100"
              y2="45"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <text
              x="100"
              y="20"
              textAnchor="middle"
              className="fill-gold-600 text-xs font-medium"
            >
              SR
            </text>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className={`text-3xl font-display font-bold ${config.color}`}>
              {percentage.toFixed(0)}%
            </span>
            <span className="text-xs text-navy-400">du SR</span>
          </div>
        </div>

        {/* Status badge */}
        <div className={`mt-4 px-4 py-2 rounded-full ${config.bgColor} bg-opacity-10`}>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        {/* Details */}
        <div className="mt-6 w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-navy-500">CA actuel</span>
            <span className="font-mono font-medium text-navy-900">
              {formatCurrency(revenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-navy-500">Seuil de rentabilité</span>
            <span className="font-mono font-medium text-gold-600">
              {formatCurrency(breakEvenPoint)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-navy-100">
            <span className="text-sm text-navy-500">Marge de sécurité</span>
            <span className={`font-mono font-medium ${safetyMarginPercent >= 0 ? 'text-emerald-600' : 'text-coral-600'}`}>
              {formatPercent(safetyMarginPercent)}
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="mt-4 text-sm text-center text-navy-500">
          {config.message}
        </p>
      </div>
    </Card>
  )
}
