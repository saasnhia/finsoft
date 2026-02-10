import type { FinancialData, KPIs, ChartDataPoint, Transaction } from '@/types'

/**
 * Calcule les KPIs financiers à partir des données
 * 
 * Formules:
 * - Seuil de rentabilité (SR) = Charges fixes / Taux de marge sur coûts variables
 * - Taux de marge = (CA - Charges variables) / CA = 1 - Taux de charges variables
 * - Point mort (jours) = (SR / CA annuel) × 365
 * - Marge de sécurité = CA - SR
 */
export function calculateKPIs(data: FinancialData): KPIs {
  // Calcul des charges fixes totales
  const totalFixedCosts = Object.values(data.fixed_costs).reduce((sum, cost) => sum + cost, 0)
  
  // Taux de marge sur coûts variables (1 - taux de charges variables)
  const marginRate = 1 - (data.variable_cost_rate / 100)
  
  // Seuil de rentabilité
  // SR = Charges fixes / Taux de marge
  const breakEvenPoint = marginRate > 0 ? totalFixedCosts / marginRate : 0
  
  // Point mort en jours (sur base mensuelle → annualisé)
  const annualRevenue = data.revenue * 12
  const breakEvenDays = annualRevenue > 0 ? (breakEvenPoint * 12 / annualRevenue) * 365 : 365
  
  // Marge de sécurité
  const safetyMargin = data.revenue - breakEvenPoint
  const safetyMarginPercent = data.revenue > 0 ? (safetyMargin / data.revenue) * 100 : 0
  
  // Résultat = CA - Charges fixes - Charges variables
  const variableCosts = data.revenue * (data.variable_cost_rate / 100)
  const currentResult = data.revenue - totalFixedCosts - variableCosts
  
  // Statut de santé financière
  let healthStatus: KPIs['healthStatus']
  if (safetyMarginPercent >= 20) {
    healthStatus = 'excellent'
  } else if (safetyMarginPercent >= 10) {
    healthStatus = 'good'
  } else if (safetyMarginPercent >= 0) {
    healthStatus = 'warning'
  } else {
    healthStatus = 'danger'
  }
  
  return {
    totalFixedCosts,
    marginRate,
    breakEvenPoint,
    breakEvenDays: Math.round(breakEvenDays),
    safetyMargin,
    safetyMarginPercent,
    currentResult,
    healthStatus,
  }
}

/**
 * Génère les données pour le graphique d'évolution
 */
export function generateChartData(dataHistory: FinancialData[]): ChartDataPoint[] {
  return dataHistory.map(data => {
    const totalFixedCosts = Object.values(data.fixed_costs).reduce((sum, cost) => sum + cost, 0)
    const variableCosts = data.revenue * (data.variable_cost_rate / 100)
    const marginRate = 1 - (data.variable_cost_rate / 100)
    const breakEvenPoint = marginRate > 0 ? totalFixedCosts / marginRate : 0
    const result = data.revenue - totalFixedCosts - variableCosts
    
    return {
      month: formatMonth(data.month),
      revenue: data.revenue,
      fixedCosts: totalFixedCosts,
      variableCosts,
      breakEvenPoint,
      result,
    }
  })
}

/**
 * Formate le mois pour l'affichage
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
}

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Calcule les KPIs à partir des transactions
 */
export function calculateKPIsFromTransactions(
  transactions: Transaction[],
  month: string
): FinancialData {
  const monthTransactions = transactions.filter(t => t.date.startsWith(month))
  
  const fixedCosts = {
    rent: 0,
    salaries: 0,
    insurance: 0,
    subscriptions: 0,
    loan_payments: 0,
    other: 0,
  }
  
  let totalIncome = 0
  let totalVariableCosts = 0
  
  monthTransactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount
    } else if (t.is_fixed) {
      const category = t.category as keyof typeof fixedCosts
      if (category in fixedCosts) {
        fixedCosts[category] += t.amount
      } else {
        fixedCosts.other += t.amount
      }
    } else {
      totalVariableCosts += t.amount
    }
  })
  
  const variableCostRate = totalIncome > 0 ? (totalVariableCosts / totalIncome) * 100 : 0
  
  return {
    id: '',
    user_id: '',
    month,
    fixed_costs: fixedCosts,
    variable_cost_rate: variableCostRate,
    revenue: totalIncome,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Génère des données de démonstration
 */
export function generateDemoData(): FinancialData {
  return {
    id: 'demo',
    user_id: 'demo',
    month: new Date().toISOString().slice(0, 7),
    fixed_costs: {
      rent: 2500,
      salaries: 8000,
      insurance: 500,
      subscriptions: 300,
      loan_payments: 1200,
      other: 500,
    },
    variable_cost_rate: 35,
    revenue: 25000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Génère un historique de données de démonstration
 */
export function generateDemoHistory(): FinancialData[] {
  const baseData = generateDemoData()
  const history: FinancialData[] = []
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.toISOString().slice(0, 7)
    
    // Variation aléatoire pour simuler l'évolution
    const revenueVariation = 0.8 + Math.random() * 0.4 // 80% à 120%
    
    history.push({
      ...baseData,
      id: `demo-${i}`,
      month,
      revenue: Math.round(baseData.revenue * revenueVariation),
      variable_cost_rate: baseData.variable_cost_rate + (Math.random() * 10 - 5),
    })
  }
  
  return history
}
