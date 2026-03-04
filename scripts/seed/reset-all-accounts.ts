/**
 * Reset all accounts to valid plan state
 * - harounchikh (ea81a899...) → plan=pro, active, 10yr
 * - ALL other accounts → plan=starter, inactive, limits reset
 * - Clean orphan subscriptions
 * Run: npx tsx scripts/seed/reset-all-accounts.ts
 */

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

const ADMIN_USER_ID = 'ea81a899-f85b-4b61-b931-6f45cb532094'

async function main() {
  console.log('\n=== Step 1: List all user_profiles ===')

  const { data: allProfiles, error: listErr } = await supabase
    .from('user_profiles')
    .select('id, plan, subscription_status, subscription_end_date, factures_limit, max_users')

  if (listErr) {
    console.error(`Error listing profiles: ${listErr.message}`)
    process.exit(1)
  }

  console.log(`Found ${allProfiles?.length ?? 0} user profiles`)
  for (const p of allProfiles ?? []) {
    const isAdmin = p.id === ADMIN_USER_ID
    console.log(`  ${isAdmin ? '★' : ' '} ${p.id} | plan=${p.plan} | status=${p.subscription_status} | limit=${p.factures_limit} | users=${p.max_users}`)
  }

  // ── Step 2: Apply premium to admin ────────────────────────────────────────
  console.log('\n=== Step 2: Apply pro plan to admin ===')
  const tenYears = new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString()

  // Delete old admin subscriptions first
  await supabase.from('subscriptions').delete().eq('user_id', ADMIN_USER_ID)

  const { error: adminErr } = await supabase
    .from('user_profiles')
    .upsert({
      id: ADMIN_USER_ID,
      plan: 'cabinet_premium',
      profile_type: 'cabinet',
      onboarding_completed: true,
      subscription_status: 'active',
      subscription_end_date: tenYears,
      stripe_customer_id: 'cus_admin_harounchikh',
      factures_limit: 999999,
      max_users: 999,
    }, { onConflict: 'id' })

  if (adminErr) {
    console.error(`  Error updating admin: ${adminErr.message}`)
  } else {
    console.log('  Admin profile updated: plan=pro, active, 10yr')
  }

  // Insert admin subscription
  const { error: adminSubErr } = await supabase
    .from('subscriptions')
    .insert({
      user_id: ADMIN_USER_ID,
      stripe_customer_id: 'cus_admin_harounchikh',
      stripe_subscription_id: 'sub_admin_harounchikh',
      plan: 'cabinet_premium',
      status: 'active',
      current_period_end: tenYears,
    })

  if (adminSubErr) console.log(`  Admin subscription: ${adminSubErr.message}`)
  else console.log('  Admin subscription created: plan=pro, active')

  // ── Step 3: Reset ALL other accounts to starter ───────────────────────────
  console.log('\n=== Step 3: Reset all other accounts to starter ===')

  const otherProfiles = (allProfiles ?? []).filter(p => p.id !== ADMIN_USER_ID)
  console.log(`  ${otherProfiles.length} accounts to reset`)

  let resetCount = 0
  for (const p of otherProfiles) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        plan: 'basique',
        subscription_status: 'inactive',
        subscription_end_date: null,
        factures_limit: 300,
        max_users: 1,
      })
      .eq('id', p.id)

    if (error) {
      console.error(`  Error resetting ${p.id}: ${error.message}`)
    } else {
      resetCount++
    }
  }
  console.log(`  ${resetCount} accounts reset to starter`)

  // Delete their subscriptions too
  if (otherProfiles.length > 0) {
    for (const p of otherProfiles) {
      await supabase.from('subscriptions').delete().eq('user_id', p.id)
    }
    console.log(`  Deleted subscriptions for ${otherProfiles.length} non-admin accounts`)
  }

  // ── Step 4: Final verification ────────────────────────────────────────────
  console.log('\n=== Step 4: Final verification ===')

  const { data: finalProfiles } = await supabase
    .from('user_profiles')
    .select('id, plan, subscription_status, subscription_end_date, factures_limit, max_users')

  console.log('\nAll user_profiles after reset:')
  for (const p of finalProfiles ?? []) {
    const isAdmin = p.id === ADMIN_USER_ID
    const endDate = p.subscription_end_date ? new Date(p.subscription_end_date).toLocaleDateString('fr-FR') : 'null'
    console.log(`  ${isAdmin ? '★ ADMIN' : '  user '} | ${p.id} | plan=${p.plan} | status=${p.subscription_status} | end=${endDate} | limit=${p.factures_limit} | users=${p.max_users}`)
  }

  const { data: finalSubs } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status, current_period_end')

  console.log(`\nAll subscriptions after reset: ${finalSubs?.length ?? 0}`)
  for (const s of finalSubs ?? []) {
    const isAdmin = s.user_id === ADMIN_USER_ID
    console.log(`  ${isAdmin ? '★' : ' '} ${s.user_id} | plan=${s.plan} | status=${s.status}`)
  }

  console.log('\nDone.')
}

main()
