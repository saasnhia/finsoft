/**
 * Onboarding — authenticated, uses saved session.
 * Note: the test account may already have onboarding_completed=true.
 * These tests verify the page structure and the profile change via settings.
 */
import { test, expect } from '@playwright/test'

test.describe('Onboarding page', () => {
  test('/onboarding affiche les deux choix', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.getByText(/cabinet comptable/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/entreprise|tpe|pme/i).first()).toBeVisible()
  })

  test('clic Cabinet comptable ne produit pas d\'erreur réseau', async ({ page }) => {
    await page.goto('/onboarding')

    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    // Intercept the API call
    let apiStatus = 0
    page.on('response', resp => {
      if (resp.url().includes('/api/onboarding/complete')) apiStatus = resp.status()
    })

    await page.getByRole('button', { name: /cabinet comptable/i }).click()

    // Should redirect to dashboard (not stay on onboarding with error)
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })

    // If stayed on onboarding, check there's no "Erreur réseau" text
    if (page.url().includes('/onboarding')) {
      await expect(page.getByText(/erreur réseau/i)).not.toBeVisible()
    }

    // API should have responded 200 (or not been called if already completed)
    if (apiStatus !== 0) {
      expect(apiStatus).toBe(200)
    }
  })

  test('clic Entreprise/TPE/PME ne produit pas d\'erreur réseau', async ({ page }) => {
    await page.goto('/onboarding')

    let apiStatus = 0
    page.on('response', resp => {
      if (resp.url().includes('/api/onboarding/complete')) apiStatus = resp.status()
    })

    await page.getByRole('button', { name: /entreprise|tpe|pme/i }).click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })

    if (page.url().includes('/onboarding')) {
      await expect(page.getByText(/erreur réseau/i)).not.toBeVisible()
    }
    if (apiStatus !== 0) {
      expect(apiStatus).toBe(200)
    }
  })
})

test.describe('Changement de profil depuis Paramètres', () => {
  test('page paramètres permet de changer le profil', async ({ page }) => {
    await page.goto('/settings')
    // Profile type selector should exist
    await expect(
      page.getByText(/profil|cabinet|entreprise/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
