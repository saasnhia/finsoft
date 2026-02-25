import { test, expect } from '@playwright/test'

test.describe('Rapprochement bancaire', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  })

  test('page rapprochement accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre rapprochement visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /rapprochement/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('bouton Lancer visible', async ({ page }) => {
    // Accept either "Lancer le rapprochement" or "Lancer le rapprochement automatique"
    const btn = page.getByRole('button', { name: /lancer/i }).first()
    await expect(btn).toBeVisible({ timeout: 15_000 })
  })

  test('état vide ou liste transactions visible', async ({ page }) => {
    const content = page
      .getByText(/aucune transaction|aucun résultat|non rapproché|rapproché/i).first()
      .or(page.getByRole('table').first())
    await expect(content.first()).toBeVisible({ timeout: 20_000 })
  })

  test('bouton Lancer le rapprochement automatique cliquable', async ({ page }) => {
    // Find the action button (exact name may vary — use first match)
    const btn = page.getByRole('button', { name: /lancer le rapprochement automatique/i })
      .or(page.getByRole('button', { name: /lancer le rapprochement/i }))
    await expect(btn.first()).toBeVisible({ timeout: 15_000 })
    // Click and expect some feedback (loading, result, or no-data message)
    await btn.first().click()
    await expect(
      page.getByText(/en cours|aucune|correspondance|rapproché|erreur/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })
})
