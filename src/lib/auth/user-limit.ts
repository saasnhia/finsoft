import type { Plan } from './check-plan'

/**
 * Returns the maximum number of concurrent sessions allowed for a plan.
 * null = unlimited (Premium / Cabinet Premium).
 */
export function getUserLimit(plan: Plan): number | null {
  switch (plan) {
    case 'basique':           return 1
    case 'essentiel':         return 5
    case 'premium':           return null
    case 'cabinet_essentiel': return 10
    case 'cabinet_premium':   return null
  }
}

/** Human-readable limit string */
export function getUserLimitLabel(plan: Plan): string {
  const limit = getUserLimit(plan)
  return limit === null ? '∞' : String(limit)
}

/** Returns true if adding one more session would exceed the plan limit */
export function isAtLimit(plan: Plan, activeCount: number): boolean {
  const limit = getUserLimit(plan)
  if (limit === null) return false
  return activeCount >= limit
}

/** Upgrade price hint for upsell banners */
export function getUpgradePrice(plan: Plan): string | null {
  switch (plan) {
    case 'basique':           return '22€/mois (Essentiel, rapprochement IA)'
    case 'essentiel':         return '74€/mois (Premium, agents IA illimités)'
    case 'cabinet_essentiel': return '179€/mois (Cabinet Premium, agents IA + liasses)'
    default:                  return null
  }
}
