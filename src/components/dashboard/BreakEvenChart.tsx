'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui'
import type { ChartDataPoint } from '@/types'
import { formatCurrency } from '@/lib/calculations'

interface BreakEvenChartProps {
  data: ChartDataPoint[]
  breakEvenPoint: number
}

export function BreakEvenChart({ data, breakEvenPoint }: BreakEvenChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      totalCosts: point.fixedCosts + point.variableCosts,
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color: string }>
    label?: string
  }) => {
    if (!active || !payload) return null

    return (
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-navy-900">
            Évolution du Chiffre d&apos;Affaires
          </h3>
          <p className="text-sm text-navy-500 mt-0.5">
            CA vs Coûts sur les 6 derniers mois
          </p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#d9e2ec" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#627d98', fontSize: 12 }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#627d98', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
            />

            <ReferenceLine
              y={breakEvenPoint}
              stroke="#f59e0b"
              strokeDasharray="8 4"
              strokeWidth={2}
              label={{
                value: `SR: ${formatCurrency(breakEvenPoint)}`,
                position: 'right',
                fill: '#f59e0b',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            
            <Area
              type="monotone"
              dataKey="revenue"
              name="Chiffre d'affaires"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
            />
            
            <Area
              type="monotone"
              dataKey="totalCosts"
              name="Coûts totaux"
              stroke="#e53e3e"
              strokeWidth={2.5}
              fill="url(#costsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
