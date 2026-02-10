'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { TrendingUp, TrendingDown, Minus, BarChart3, Info, HelpCircle } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  /** Left border accent color class (e.g. 'border-l-blue-600') */
  borderAccent?: string
  /** Make value larger (text-4xl) for primary KPIs */
  emphasized?: boolean
  /** Help tooltip: short definition of the KPI */
  helpTooltip?: string
  benchmark?: {
    sectorLabel: string
    comparison: string
    status: 'above' | 'below' | 'near'
    /** Percentage of benchmark achieved (e.g. 120 = 120% of sector average) */
    percent?: number
    /** Formatted benchmark value to display */
    benchmarkValue?: string
  }
  analysisTooltip?: {
    summary: string
    factors: Array<{ label: string; value: string; type: 'positive' | 'negative' | 'neutral' }>
  }
  /** Extra content below the KPI (e.g. anomaly badge, action button) */
  footer?: React.ReactNode
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  borderAccent,
  emphasized,
  helpTooltip,
  benchmark,
  analysisTooltip,
  footer,
}: KPICardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const variantStyles = {
    default: {
      iconBg: 'bg-navy-100',
      iconColor: 'text-navy-600',
    },
    success: {
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    warning: {
      iconBg: 'bg-gold-100',
      iconColor: 'text-gold-600',
    },
    danger: {
      iconBg: 'bg-coral-100',
      iconColor: 'text-coral-600',
    },
  }

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />,
  }

  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-coral-600 bg-coral-50',
    neutral: 'text-navy-500 bg-navy-50',
  }

  const benchmarkColors = {
    above: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    below: 'text-coral-700 bg-coral-50 border-coral-200',
    near: 'text-amber-700 bg-amber-50 border-amber-200',
  }

  return (
    <Card
      className={`relative group ${analysisTooltip || helpTooltip ? '' : 'overflow-hidden'} ${borderAccent ? `border-l-4 ${borderAccent}` : ''}`}
      hover
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full ${variantStyles[variant].iconBg}`} />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${variantStyles[variant].iconBg}`}>
            <div className={variantStyles[variant].iconColor}>
              {icon}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Help tooltip — positioned above to avoid clipping */}
            {helpTooltip && (
              <div
                className="relative"
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
              >
                <HelpCircle className="w-4 h-4 text-navy-300 hover:text-navy-500 cursor-help transition-colors" />
                {showHelp && (
                  <div className="absolute z-[60] bottom-full right-1/2 translate-x-1/2 mb-2 w-56 p-3 bg-navy-900 text-white rounded-xl shadow-2xl text-xs whitespace-normal break-words">
                    <p className="relative font-medium mb-1">{title}</p>
                    <p className="relative text-navy-300 leading-relaxed">{helpTooltip}</p>
                    {/* Arrow pointing down */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-navy-900 rotate-45" />
                  </div>
                )}
              </div>
            )}

            {trend && trendValue && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${trendColors[trend]}`}>
                {trendIcons[trend]}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-navy-500 mb-1">{title}</p>
          <div
            className="relative"
            onMouseEnter={() => analysisTooltip && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p className={`${emphasized ? 'text-4xl' : 'text-3xl'} font-display font-bold text-navy-900 tracking-tight`}>
              {value}
              {analysisTooltip && (
                <Info className="inline w-4 h-4 ml-1.5 text-navy-300 cursor-help align-middle" />
              )}
            </p>

            {/* Analysis tooltip */}
            {showTooltip && analysisTooltip && (
              <div className="absolute z-50 top-full right-0 mt-3 min-w-[280px] max-w-[320px] p-4 bg-navy-900 text-white rounded-xl shadow-2xl text-xs whitespace-normal break-words">
                {/* Arrow */}
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-navy-900 rotate-45" />
                <p className="relative font-medium mb-2 leading-snug">{analysisTooltip.summary}</p>
                <div className="relative space-y-2 border-t border-navy-700 pt-2">
                  {analysisTooltip.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-navy-300">{f.label}</span>
                      <span className={`flex-shrink-0 ${
                        f.type === 'positive' ? 'text-emerald-400 font-medium' :
                        f.type === 'negative' ? 'text-coral-400 font-medium' :
                        'text-navy-400'
                      }`}>
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-navy-400 mt-1">{subtitle}</p>
          )}

          {/* Benchmark badge + progress bar */}
          {benchmark && (
            <div className="mt-3 space-y-1.5">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${benchmarkColors[benchmark.status]}`}>
                <BarChart3 className="w-3 h-3" />
                <span>{benchmark.comparison}</span>
                <span className="opacity-70">vs {benchmark.sectorLabel}</span>
              </div>

              {/* Visual progress bar */}
              {benchmark.percent != null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-navy-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        benchmark.status === 'above' ? 'bg-emerald-500' :
                        benchmark.status === 'below' ? 'bg-coral-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(benchmark.percent, 0), 150) / 1.5}%` }}
                    />
                  </div>
                  {benchmark.benchmarkValue && (
                    <span className="text-[10px] text-navy-400 whitespace-nowrap">
                      Moy. : {benchmark.benchmarkValue}
                    </span>
                  )}
                </div>
              )}

              {/* Below benchmark warning */}
              {benchmark.status === 'below' && benchmark.percent != null && benchmark.percent < 80 && (
                <p className="text-[11px] text-coral-600">
                  Inférieur de {(100 - benchmark.percent).toFixed(0)}% à la moyenne du secteur
                </p>
              )}
            </div>
          )}

          {/* Footer slot (anomaly badge, improvement button, etc.) */}
          {footer && (
            <div className="mt-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
