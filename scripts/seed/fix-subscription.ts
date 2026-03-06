/**
 * Fix subscription for harounchikh71@gmail.com
 * - Clean old subscriptions
 * - Apply plan 'cabinet_premium' (max) with correct column values
 * Run: npx tsx scripts/seed/fix-subscription.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://jwaqsszcaicikhgmfcwc.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USER_ID = 'ea81a899-f85b-4b61-b931-6f45cb532094'

async function main() {
  console.log('\n=== Step 1: Current state ===')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', USER_ID)
    .single()
  console.log('user_profiles:', JSON.stringify(profile, null, 2))

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', USER_ID)
  console.log('subscriptions:', JSON.stringify(subs, null, 2))

  console.log('\n=== Step 2: Delete old subscriptions ===')
  const { error: delErr } = await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', USER_ID)
  console.log(delErr ? `  Error: ${delErr.message}` : '  Deleted all subscriptions rows')

  console.log('\n=== Step 3: Update user_profiles ===')
  const tenYears = new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString()

  const { error: upErr } = await supabase
    .from('user_profiles')
    .upsert({
      id: USER_ID,
      plan: 'cabinet_premium',
      profile_type: 'cabinet',
      onboarding_completed: true,
      subscription_status: 'active',
      subscription_end_date: tenYears,
      stripe_customer_id: 'cus_admin_harounchikh',
      factures_limit: 999999,
      max_users: 999,
    }, { onConflict: 'id' })
  console.log(upErr ? `  Error: ${upErr.message}` : '  user_profiles updated: plan=pro, status=active, 10yr')

  console.log('\n=== Step 4: Insert fresh subscription ===')
  const { error: insErr } = await supabase
    .from('subscriptions')
    .insert({
      user_id: USER_ID,
      stripe_customer_id: 'cus_admin_harounchikh',
      stripe_subscription_id: 'sub_admin_harounchikh',
      plan: 'cabinet_premium',
      status: 'active',
      current_period_end: tenYears,
    })
  console.log(insErr ? `  Error: ${insErr.message}` : '  subscriptions row inserted: plan=pro, active, 10yr')

  console.log('\n=== Step 5: Verification ===')
  const { data: finalProfile } = await supabase
    .from('user_profiles')
    .select('plan, subscription_status, subscription_end_date, factures_limit, max_users, profile_type, onboarding_completed')
    .eq('id', USER_ID)
    .single()
  console.log('user_profiles:', JSON.stringify(finalProfile, null, 2))

  const { data: finalSub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_subscription_id')
    .eq('user_id', USER_ID)
  console.log('subscriptions:', JSON.stringify(finalSub, null, 2))

  console.log('\nDone.')
}

main()
