// Types pour FinPilote

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface FinancialData {
  id: string
  user_id: string
  month: string // Format: YYYY-MM
  
  // Charges fixes
  fixed_costs: {
    rent: number          // Loyer
    salaries: number      // Salaires
    insurance: number     // Assurances
    subscriptions: number // Abonnements
    loan_payments: number // Remboursements emprunts
    other: number         // Autres charges fixes
  }
  
  // Charges variables (en % du CA)
  variable_cost_rate: number // Taux de charges variables
  
  // Revenus
  revenue: number // Chiffre d'affaires réalisé
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface KPIs {
  // Charges fixes totales
  totalFixedCosts: number
  
  // Taux de marge sur coûts variables
  marginRate: number
  
  // Seuil de rentabilité
  breakEvenPoint: number
  
  // Point mort (en jours)
  breakEvenDays: number
  
  // Marge de sécurité
  safetyMargin: number
  safetyMarginPercent: number
  
  // Résultat
  currentResult: number
  
  // Indicateur de santé
  healthStatus: 'excellent' | 'good' | 'warning' | 'danger'
}

export interface ChartDataPoint {
  month: string
  revenue: number
  fixedCosts: number
  variableCosts: number
  breakEvenPoint: number
  result: number
}

export interface Transaction {
  id: string
  user_id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  is_fixed: boolean
  created_at: string
}

export type TransactionCategory = 
  | 'rent'
  | 'salaries'
  | 'insurance'
  | 'subscriptions'
  | 'loan_payments'
  | 'supplies'
  | 'marketing'
  | 'utilities'
  | 'sales'
  | 'services'
  | 'other'

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  rent: 'Loyer',
  salaries: 'Salaires',
  insurance: 'Assurances',
  subscriptions: 'Abonnements',
  loan_payments: 'Emprunts',
  supplies: 'Fournitures',
  marketing: 'Marketing',
  utilities: 'Charges',
  sales: 'Ventes',
  services: 'Services',
  other: 'Autre',
}

export const FIXED_COST_CATEGORIES: TransactionCategory[] = [
  'rent',
  'salaries',
  'insurance',
  'subscriptions',
  'loan_payments',
]

export const VARIABLE_COST_CATEGORIES: TransactionCategory[] = [
  'supplies',
  'marketing',
]

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'sales',
  'services',
  'other',
]
