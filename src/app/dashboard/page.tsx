'use client'

import { useMemo } from 'react'
import { Header } from '@/components/layout'
import { Card } from '@/components/ui'
import { 
  KPICard, 
  BreakEvenChart, 
  BreakEvenGauge, 
  DataInputForm 
} from '@/components/dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useFinancialData } from '@/hooks/useFinancialData'
import { calculateKPIs, generateChartData, formatCurrency } from '@/lib/calculations'
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    currentData, 
    history, 
    loading: dataLoading, 
    saveData 
  } = useFinancialData(user?.id)

  const kpis = useMemo(() => {
    if (!currentData) return null
    return calculateKPIs(currentData)
  }, [currentData])

  const chartData = useMemo(() => {
    if (!history.length) return []
    return generateChartData(history)
  }, [history])

  const loading = authLoading || dataLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement de vos données...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentData || !kpis) {
    return (
      <div className="min-h-screen bg-navy-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-navy-500">Erreur lors du chargement des données</p>
        </div>
      </div>
    )
  }

  // Calculate trends (comparing to previous month)
  const previousMonth = history[history.length - 2]
  const previousKpis = previousMonth ? calculateKPIs(previousMonth) : null
  
  const revenueTrend = previousKpis 
    ? ((currentData.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0

  const resultTrend = previousKpis
    ? ((kpis.currentResult - previousKpis.currentResult) / Math.abs(previousKpis.currentResult)) * 100
    : 0

  return (
    <div className="min-h-screen bg-navy-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-navy-900">
            Dashboard
          </h1>
          <p className="mt-1 text-navy-500">
            Vue d&apos;ensemble de votre situation financière
          </p>
        </div>

        {/* Demo Banner */}
        {!user && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 border-none">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-display font-semibold text-lg">Mode Démonstration</h3>
                <p className="text-emerald-100 text-sm">
                  Créez un compte pour sauvegarder vos données réelles
                </p>
              </div>
              <a 
                href="/signup"
                className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                Créer un compte
              </a>
            </div>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Seuil de Rentabilité"
            value={formatCurrency(kpis.breakEvenPoint)}
            subtitle="Point mort mensuel"
            icon={<Target className="w-5 h-5" />}
            variant="success"
          />
          
          <KPICard
            title="Chiffre d'Affaires"
            value={formatCurrency(currentData.revenue)}
            subtitle="Ce mois"
            trend={revenueTrend >= 0 ? 'up' : 'down'}
            trendValue={`${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            variant={revenueTrend >= 0 ? 'success' : 'danger'}
          />
          
          <KPICard
            title="Point Mort"
            value={`${kpis.breakEvenDays} jours`}
            subtitle="Pour atteindre le SR"
            icon={<Calendar className="w-5 h-5" />}
            variant={kpis.breakEvenDays <= 180 ? 'success' : 'warning'}
          />
          
          <KPICard
            title="Résultat Mensuel"
            value={formatCurrency(kpis.currentResult)}
            subtitle={kpis.currentResult >= 0 ? 'Bénéfice' : 'Déficit'}
            trend={kpis.currentResult >= 0 ? 'up' : 'down'}
            trendValue={resultTrend !== 0 ? `${resultTrend >= 0 ? '+' : ''}${resultTrend.toFixed(0)}%` : undefined}
            icon={<PiggyBank className="w-5 h-5" />}
            variant={kpis.currentResult >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <BreakEvenChart 
              data={chartData} 
              breakEvenPoint={kpis.breakEvenPoint}
            />
          </div>

          {/* Gauge */}
          <div className="lg:col-span-1">
            <BreakEvenGauge
              revenue={currentData.revenue}
              breakEvenPoint={kpis.breakEvenPoint}
              safetyMarginPercent={kpis.safetyMarginPercent}
              healthStatus={kpis.healthStatus}
            />
          </div>
        </div>

        {/* Data Input Form */}
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DataInputForm
              initialData={currentData}
              onSave={saveData}
              disabled={!user}
            />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-display font-semibold text-navy-900 mb-4">
                Analyse Rapide
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Charges fixes</span>
                  <span className="font-mono font-medium text-navy-900">
                    {formatCurrency(kpis.totalFixedCosts)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Taux de marge</span>
                  <span className="font-mono font-medium text-navy-900">
                    {(kpis.marginRate * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Charges variables</span>
                  <span className="font-mono font-medium text-navy-900">
                    {currentData.variable_cost_rate.toFixed(1)}% du CA
                  </span>
                </div>
              </div>
            </Card>

            <Card className={`
              ${kpis.safetyMarginPercent >= 0 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-coral-50 border-coral-200'
              }
            `}>
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${kpis.safetyMarginPercent >= 0 
                    ? 'bg-emerald-100' 
                    : 'bg-coral-100'
                  }
                `}>
                  {kpis.safetyMarginPercent >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-coral-600" />
                  )}
                </div>
                <div>
                  <h4 className={`
                    font-display font-semibold
                    ${kpis.safetyMarginPercent >= 0 
                      ? 'text-emerald-900' 
                      : 'text-coral-900'
                    }
                  `}>
                    {kpis.safetyMarginPercent >= 0 ? 'Marge positive' : 'Attention requise'}
                  </h4>
                  <p className={`
                    text-sm mt-1
                    ${kpis.safetyMarginPercent >= 0 
                      ? 'text-emerald-700' 
                      : 'text-coral-700'
                    }
                  `}>
                    {kpis.safetyMarginPercent >= 0 
                      ? `Vous êtes ${formatCurrency(kpis.safetyMargin)} au-dessus de votre seuil de rentabilité.`
                      : `Vous êtes ${formatCurrency(Math.abs(kpis.safetyMargin))} en dessous de votre seuil de rentabilité.`
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
