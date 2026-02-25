import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

export type StripePlan = 'starter' | 'cabinet' | 'pro'

/** Price ID → plan name */
export function planFromPriceId(priceId: string): StripePlan | null {
  const map: Record<string, StripePlan> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_CABINET!]: 'cabinet',
    [process.env.STRIPE_PRICE_PRO!]:     'pro',
  }
  return map[priceId] ?? null
}

/** Plan name → Stripe Price ID */
export function priceIdFromPlan(plan: StripePlan): string {
  const map: Record<StripePlan, string> = {
    starter: process.env.STRIPE_PRICE_STARTER!,
    cabinet: process.env.STRIPE_PRICE_CABINET!,
    pro:     process.env.STRIPE_PRICE_PRO!,
  }
  return map[plan]
}
