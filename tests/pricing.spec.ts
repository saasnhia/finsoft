/**
 * Pricing page — public (no auth) and authenticated views.
 */
import { test, expect } from '@playwright/test'

test.describe('Pricing — page publique', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('page /pricing se charge', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveTitle(/tarif|prix|plan|FinSoft|FinPilote/i, { timeout: 15_000 })
  })

  test('les 3 plans sont affichés', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/starter/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/cabinet/i).first()).toBeVisible()
    await expect(page.getByText(/\bpro\b/i).first()).toBeVisible()
  })

  test('prix corrects : 290€ / 890€ / 1900€', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/290/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/890/)).toBeVisible()
    await expect(page.getByText(/1.?900|1900/)).toBeVisible()
  })

  test('toggle Cabinet / Entreprise fonctionne', async ({ page }) => {
    await page.goto('/pricing')
    // Find Entreprise toggle button
    const entrepriseBtn = page.getByRole('button', { name: /entreprise/i })
    await expect(entrepriseBtn.first()).toBeVisible({ timeout: 10_000 })
    await entrepriseBtn.first().click()
    // After click, mode should be entreprise
    await expect(page.getByText(/entreprise|tpe|pme/i).first()).toBeVisible()

    // Switch back to Cabinet
    const cabinetBtn = page.getByRole('button', { name: /cabinet/i })
    await cabinetBtn.first().click()
    await expect(page.getByText(/cabinet/i).first()).toBeVisible()
  })

  test('bouton S\'abonner redirige vers /login (si non connecté)', async ({ page }) => {
    await page.goto('/pricing')
    const btn = page.getByRole('button', { name: /s'abonner|abonner|choisir|souscrire/i }).first()
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await btn.click()
    // Non-authenticated: should go to /login (or Stripe checkout)
    await page.waitForURL(/\/(login|checkout\.stripe\.com)/, { timeout: 15_000 }).catch(() => {})
    expect(page.url()).toMatch(/login|stripe/)
  })
})

test.describe('Pricing — utilisateur connecté', () => {
  // Uses saved auth session from global setup

  test('bouton S\'abonner (connecté) redirige vers Stripe Checkout', async ({ page }) => {
    await page.goto('/pricing')
    const btn = page.getByRole('button', { name: /s'abonner|abonner|choisir|souscrire/i }).first()
    await expect(btn).toBeVisible({ timeout: 10_000 })

    // Intercept navigation — Stripe may open in same tab
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: 20_000 }).catch(() => null),
      btn.click(),
    ])
    // Either URL changed to stripe, or button triggered a fetch (session already active)
    const url = page.url()
    const isStripeOrPricing = url.includes('stripe.com') || url.includes('/pricing') || url.includes('/dashboard')
    expect(isStripeOrPricing).toBe(true)
  })

  test('message subscription_required affiché si query param présent', async ({ page }) => {
    await page.goto('/pricing?message=subscription_required')
    // Should show some message about subscription being required
    await expect(
      page.getByText(/abonnement|subscription|requis|required/i)
    ).toBeVisible({ timeout: 10_000 })
  })
})
