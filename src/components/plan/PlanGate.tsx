'use client'

import { useUserPlan } from '@/hooks/useUserPlan'
import { getPlanLabel, getRequiredPlan, getFeatureLabel } from '@/lib/auth/check-plan'
import type { Feature } from '@/lib/auth/check-plan'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface PlanGateProps {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on user's plan.
 * Shows an upgrade prompt if feature is locked.
 */
export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { can, loading } = useUserPlan()

  if (loading) return null

  if (can(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const required = getRequiredPlan(feature)

  return (
    <div className="relative rounded-2xl border border-navy-200 bg-navy-50/50 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-200 flex items-center justify-center">
          <Lock className="w-5 h-5 text-navy-500" />
        </div>
        <p className="text-sm font-medium text-navy-700">
          {getFeatureLabel(feature)}
        </p>
        <p className="text-xs text-navy-500">
          Disponible avec le plan {getPlanLabel(required)}
        </p>
        <Link
          href="/#tarifs"
          className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          Voir les tarifs
        </Link>
      </div>
    </div>
  )
}

/**
 * Small badge showing current plan.
 */
export function PlanBadge() {
  const { plan, loading } = useUserPlan()

  if (loading) return null

  const colors = {
    solo: 'bg-navy-100 text-navy-600',
    cabinet: 'bg-emerald-100 text-emerald-700',
    entreprise: 'bg-purple-100 text-purple-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[plan]}`}>
      {getPlanLabel(plan)}
    </span>
  )
}
