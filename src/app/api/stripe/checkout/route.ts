import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe, priceIdFromPlan } from '@/lib/stripe/client'
import type { StripePlan } from '@/lib/stripe/client'

/**
 * POST /api/stripe/checkout
 * Body: { plan: 'starter' | 'cabinet' | 'pro' }
 * Returns: { url: string }  — Stripe Checkout Session URL
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as { plan?: string }
    const plan = body.plan as StripePlan | undefined

    if (!plan || !['starter', 'cabinet', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const priceId = priceIdFromPlan(plan)
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID introuvable pour ce plan' }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    // Build origin for redirect URLs
    const origin = req.headers.get('origin') ?? 'https://finpilote.vercel.app'

    const customerField: Pick<Stripe.Checkout.SessionCreateParams, 'customer' | 'customer_email'> =
      existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?stripe=success`,
      cancel_url:  `${origin}/pricing?stripe=canceled`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'fr',
      ...customerField,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
