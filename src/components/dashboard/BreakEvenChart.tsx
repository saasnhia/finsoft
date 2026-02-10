'use client'

import { useMemo, useState } from 'react'
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
  Line,
  ComposedChart,
} from 'recharts'
import { Card } from '@/components/ui'
import type { ChartDataPoint } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Period = '3m' | '6m' | '12m' | 'all'

interface BreakEvenChartProps {
  data: ChartDataPoint[]
  breakEvenPoint: number
}

export function BreakEvenChart({ data, breakEvenPoint }: BreakEvenChartProps) {
  const [period, setPeriod] = useState<Period>('6m')

  // Filter data by selected period
  const filteredData = useMemo(() => {
    if (period === 'all') return data
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
    return data.slice(-months)
  }, [data, period])

  // Calculate trend line (linear regression on revenue)
  const chartData = useMemo(() => {
    const points = filteredData.map((point, i) => ({
      ...point,
      totalCosts: point.fixedCosts + point.variableCosts,
      index: i,
    }))

    if (points.length < 2) {
      return points.map(p => ({ ...p, trendLine: p.revenue }))
    }

    // Simple linear regression: y = mx + b
    const n = points.length
    const sumX = points.reduce((s, p) => s + p.index, 0)
    const sumY = points.reduce((s, p) => s + p.revenue, 0)
    const sumXY = points.reduce((s, p) => s + p.index * p.revenue, 0)
    const sumX2 = points.reduce((s, p) => s + p.index * p.index, 0)

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const b = (sumY - m * sumX) / n

    return points.map(p => ({
      ...p,
      trendLine: Math.round(m * p.index + b),
    }))
  }, [filteredData])

  // Calculate trend percentage
  const trendAnalysis = useMemo(() => {
    if (chartData.length < 2) return null
    const first = chartData[0].revenue
    const last = chartData[chartData.length - 1].revenue
    if (first === 0) return null
    const pct = ((last - first) / first) * 100
    return {
      percentage: pct,
      direction: pct > 1 ? 'up' : pct < -1 ? 'down' : 'stable' as 'up' | 'down' | 'stable',
    }
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color: string; dataKey: string }>
    label?: string
  }) => {
    if (!active || !payload) return null

    return (
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.filter(e => e.dataKey !== 'trendLine').map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  const periodLabels: Record<Period, string> = {
    '3m': '3 mois',
    '6m': '6 mois',
    '12m': '12 mois',
    'all': 'Tout',
  }

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-navy-900">
            Évolution du Chiffre d&apos;Affaires
          </h3>
          <p className="text-sm text-navy-500 mt-0.5">
            CA vs Coûts — {periodLabels[period]}
          </p>
        </div>

        {/* Period filters */}
        <div className="flex items-center gap-1 bg-navy-50 rounded-lg p-1">
          {(['3m', '6m', '12m', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
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

            {/* Trend line */}
            <Line
              type="monotone"
              dataKey="trendLine"
              name="Tendance"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              legendType="line"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Contextual trend message */}
      {trendAnalysis && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          trendAnalysis.direction === 'up'
            ? 'bg-emerald-50 text-emerald-700'
            : trendAnalysis.direction === 'down'
              ? 'bg-coral-50 text-coral-700'
              : 'bg-navy-50 text-navy-600'
        }`}>
          {trendAnalysis.direction === 'up' && <TrendingUp className="w-4 h-4 flex-shrink-0" />}
          {trendAnalysis.direction === 'down' && <TrendingDown className="w-4 h-4 flex-shrink-0" />}
          {trendAnalysis.direction === 'stable' && <Minus className="w-4 h-4 flex-shrink-0" />}
          <span>
            {trendAnalysis.direction === 'up'
              ? `Votre CA est en hausse de ${trendAnalysis.percentage.toFixed(1)}% sur la période. Continuez ainsi !`
              : trendAnalysis.direction === 'down'
                ? `Votre CA est en baisse de ${Math.abs(trendAnalysis.percentage).toFixed(1)}% sur la période. Analysez les causes.`
                : `Votre CA est stable sur la période.`
            }
          </span>
        </div>
      )}
    </Card>
  )
}
