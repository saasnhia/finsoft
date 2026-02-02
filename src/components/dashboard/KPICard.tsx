'use client'

import { Card } from '@/components/ui'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
}: KPICardProps) {
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

  return (
    <Card 
      className="relative overflow-hidden group"
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
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${trendColors[trend]}`}>
              {trendIcons[trend]}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-navy-500 mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-navy-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-navy-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
