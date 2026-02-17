export type Plan = 'solo' | 'cabinet' | 'entreprise'

export type Feature =
  | 'ocr'
  | 'siren'
  | 'vies'
  | 'pappers'
  | 'smart_matching'
  | 'fec_export'
  | 'alerts'
  | 'custom_api'
  | 'unlimited_users'

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  solo: ['ocr', 'siren', 'fec_export'],
  cabinet: ['ocr', 'siren', 'vies', 'pappers', 'smart_matching', 'fec_export', 'alerts'],
  entreprise: ['ocr', 'siren', 'vies', 'pappers', 'smart_matching', 'fec_export', 'alerts', 'custom_api', 'unlimited_users'],
}

const PLAN_LIMITS: Record<Plan, { factures: number; users: number }> = {
  solo: { factures: 500, users: 1 },
  cabinet: { factures: Infinity, users: 5 },
  entreprise: { factures: Infinity, users: Infinity },
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo
}

export function getUpgradePlan(currentPlan: Plan): Plan | null {
  switch (currentPlan) {
    case 'solo': return 'cabinet'
    case 'cabinet': return 'entreprise'
    case 'entreprise': return null
  }
}

export function getFeatureLabel(feature: Feature): string {
  const labels: Record<Feature, string> = {
    ocr: 'OCR Factures',
    siren: 'Enrichissement SIREN',
    vies: 'Validation TVA UE (VIES)',
    pappers: 'Score risque fournisseurs (Pappers)',
    smart_matching: 'Rapprochement intelligent',
    fec_export: 'Export FEC',
    alerts: 'Alertes & notifications',
    custom_api: 'API personnalisée',
    unlimited_users: 'Utilisateurs illimités',
  }
  return labels[feature]
}

export function getPlanLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    solo: 'Solo',
    cabinet: 'Cabinet',
    entreprise: 'Entreprise',
  }
  return labels[plan]
}

export function getRequiredPlan(feature: Feature): Plan {
  if (PLAN_FEATURES.solo.includes(feature)) return 'solo'
  if (PLAN_FEATURES.cabinet.includes(feature)) return 'cabinet'
  return 'entreprise'
}
