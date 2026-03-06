import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stripe/subscription-status
 * Returns { active: boolean } — used by /checkout/success polling page.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ active: false, error: 'Non authentifié' }, { status: 401 })
  }

  // Check user_profiles first (fast path)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  const profileActive =
    profile?.subscription_status === 'active' ||
    profile?.subscription_status === 'trial'

  if (profileActive) {
    return NextResponse.json({ active: true })
  }

  // Fallback: check subscriptions table (webhook may have fired but profile not yet synced)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (sub) {
    // Auto-sync profile (fire-and-forget)
    const syncStatus = sub.status === 'trialing' ? 'trial' : 'active'
    void supabase
      .from('user_profiles')
      .update({ subscription_status: syncStatus })
      .eq('id', user.id)
      .then(() => { /* fire-and-forget */ })

    return NextResponse.json({ active: true })
  }

  return NextResponse.json({ active: false })
}
