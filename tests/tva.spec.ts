import { test, expect } from '@playwright/test'

test.describe('TVA — déclarations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tva')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    // Wait for loading spinner to disappear (TVA page fetches data)
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
  })

  test('page TVA accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre TVA visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /tva|déclaration/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('bouton Nouvelle déclaration ou état vide visible', async ({ page }) => {
    const cta = page
      .getByRole('button', { name: /nouvelle déclaration/i }).first()
      .or(page.getByRole('link', { name: /nouvelle déclaration/i }).first())
      .or(page.getByText(/aucune déclaration|commencer|créer/i).first())
    await expect(cta.first()).toBeVisible({ timeout: 15_000 })
  })

  test('liste déclarations ou état vide', async ({ page }) => {
    const content = page
      .getByText(/aucune déclaration|pas de déclaration|déclaration/i).first()
      .or(page.getByRole('table').first())
    await expect(content.first()).toBeVisible({ timeout: 20_000 })
  })

  test('KPI CA collecté ou encadré résumé visible', async ({ page }) => {
    // Expect some financial summary — either a KPI card or a summary text
    const kpi = page
      .getByText(/ca collecté|tva collectée|tva déductible|solde tva|montant/i).first()
      .or(page.getByText(/\d+[,.]?\d*\s*€/).first())
    // This is a soft check — if no data exists, state vide is fine
    const isEmpty = await page.getByText(/aucune déclaration/i).isVisible().catch(() => false)
    if (!isEmpty) {
      await expect(kpi.first()).toBeVisible({ timeout: 15_000 })
    }
  })
})
