import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('page accessible sans auth', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('titre principal visible', async ({ page }) => {
    await page.goto('/')
    // The hero h1 should be visible
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('lien vers /pricing visible', async ({ page }) => {
    await page.goto('/')
    // Look for pricing link or CTA
    const pricingLink = page.getByRole('link', { name: /tarif|pricing|commencer|essai/i }).first()
    await expect(pricingLink).toBeVisible({ timeout: 10_000 })
  })

  test('lien vers /login visible', async ({ page }) => {
    await page.goto('/')
    const loginLink = page.getByRole('link', { name: /connexion|se connecter|login/i }).first()
    await expect(loginLink).toBeVisible({ timeout: 10_000 })
  })

  test('navigation vers /pricing', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
    await expect(page.locator('body')).toBeVisible()
  })
})
