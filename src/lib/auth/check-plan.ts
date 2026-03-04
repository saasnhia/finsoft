export type Plan = 'basique' | 'essentiel' | 'premium' | 'cabinet_essentiel' | 'cabinet_premium'

export type Feature =
  // ── Baseline (all plans) ──────────────────────────────────
  | 'ocr'
  | 'siren'
  | 'vies'
  | 'fec_export'
  | 'import_universel'
  | 'balance_agee'
  // ── Essentiel+ ─────────────────────────────────────────
  | 'categorization_rules'
  | 'rapprochement_auto'
  | 'smart_matching'          // alias → rapprochement_auto
  | 'dashboard_automatisation'
  | 'sage_sync'
  | 'score_risque_fournisseur'
  | 'pappers'                 // alias → score_risque_fournisseur
  | 'alertes_kpi'
  | 'alerts'                  // alias → alertes_kpi
  | 'audit_ia'
  | 'cegid_loop'
  // ── Premium only ─────────────────────────────────────────
  | 'api_dedicee'
  | 'custom_api'              // alias → api_dedicee
  | 'erp_custom'
  | 'support_dedie'
  | 'sla'
  | 'unlimited_users'

const BASIQUE_FEATURES: Feature[] = [
  'ocr', 'siren', 'vies', 'fec_export', 'import_universel', 'balance_agee',
]

const ESSENTIEL_FEATURES: Feature[] = [
  ...BASIQUE_FEATURES,
  'categorization_rules',
  'rapprochement_auto', 'smart_matching',
  'dashboard_automatisation',
  'sage_sync',
  'score_risque_fournisseur', 'pappers',
  'alertes_kpi', 'alerts',
  'audit_ia',
  'cegid_loop',
]

const PREMIUM_FEATURES: Feature[] = [
  ...ESSENTIEL_FEATURES,
  'api_dedicee', 'custom_api',
  'erp_custom',
  'support_dedie',
  'sla',
  'unlimited_users',
]

// Cabinet plans include same features as their tier equivalent
const CABINET_ESSENTIEL_FEATURES: Feature[] = [...ESSENTIEL_FEATURES]
const CABINET_PREMIUM_FEATURES: Feature[] = [...PREMIUM_FEATURES]

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  basique:           BASIQUE_FEATURES,
  essentiel:         ESSENTIEL_FEATURES,
  premium:           PREMIUM_FEATURES,
  cabinet_essentiel: CABINET_ESSENTIEL_FEATURES,
  cabinet_premium:   CABINET_PREMIUM_FEATURES,
}

const PLAN_LIMITS: Record<Plan, { factures: number; users: number }> = {
  basique:           { factures: 300,      users: 1 },
  essentiel:         { factures: Infinity, users: 5 },
  premium:           { factures: Infinity, users: 15 },
  cabinet_essentiel: { factures: Infinity, users: 10 },
  cabinet_premium:   { factures: Infinity, users: 10 },
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.basique
}

/** Numeric rank for tier comparisons (0=basique, 1=essentiel, 2=premium) */
export function planRank(plan: Plan): number {
  switch (plan) {
    case 'basique':           return 0
    case 'essentiel':
    case 'cabinet_essentiel': return 1
    case 'premium':
    case 'cabinet_premium':   return 2
  }
}

/** True if plan is at least the given tier (ignoring cabinet/non-cabinet distinction) */
export function isAtLeast(plan: Plan, level: 'essentiel' | 'premium'): boolean {
  return planRank(plan) >= planRank(level)
}

/** True if this is a cabinet plan (multi-dossiers, portail client) */
export function isCabinetPlan(plan: Plan): boolean {
  return plan === 'cabinet_essentiel' || plan === 'cabinet_premium'
}

export function getUpgradePlan(currentPlan: Plan): Plan | null {
  switch (currentPlan) {
    case 'basique':           return 'essentiel'
    case 'essentiel':         return 'premium'
    case 'premium':           return null
    case 'cabinet_essentiel': return 'cabinet_premium'
    case 'cabinet_premium':   return null
  }
}

export function getFeatureLabel(feature: Feature): string {
  const labels: Record<Feature, string> = {
    ocr:                    'OCR Factures',
    siren:                  'Enrichissement SIREN',
    vies:                   'Validation TVA UE (VIES)',
    fec_export:             'Export FEC',
    import_universel:       'Import universel',
    balance_agee:           'Balance âgée',
    categorization_rules:   'Règles automatiques de catégorisation',
    rapprochement_auto:     'Rapprochement bancaire automatique',
    smart_matching:         'Rapprochement bancaire automatique',
    dashboard_automatisation:'Dashboard automatisation & rollback',
    sage_sync:              'Synchronisation Sage (Chift)',
    score_risque_fournisseur:'Score risque fournisseur (Pappers)',
    pappers:                'Score risque fournisseur (Pappers)',
    alertes_kpi:            'Alertes KPI automatiques',
    alerts:                 'Alertes & notifications',
    audit_ia:               'Audit IA',
    cegid_loop:             'Cegid Loop',
    api_dedicee:            'API dédiée Worthifast',
    custom_api:             'API personnalisée',
    erp_custom:             'Intégration ERP sur-mesure',
    support_dedie:          'Support dédié 6h/jour',
    sla:                    'SLA garanti',
    unlimited_users:        'Utilisateurs illimités',
  }
  return labels[feature] ?? feature
}

export function getPlanLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    basique:           'Basique',
    essentiel:         'Essentiel',
    premium:           'Premium',
    cabinet_essentiel: 'Cabinet Essentiel',
    cabinet_premium:   'Cabinet Premium',
  }
  return labels[plan]
}

export function getRequiredPlan(feature: Feature): Plan {
  if (BASIQUE_FEATURES.includes(feature)) return 'basique'
  if (ESSENTIEL_FEATURES.includes(feature)) return 'essentiel'
  return 'premium'
}
