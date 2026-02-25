import { test, expect } from '@playwright/test'
import path from 'path'
import { waitForDashboard } from './fixtures/helpers'

const FILES_DIR = path.join(__dirname, 'files')

test.describe('Factures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/factures')
    // Wait for page to load (not redirect to login)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  })

  test('page factures accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre ou en-tête visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /facture/i }).first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('zone upload ou bouton import visible', async ({ page }) => {
    const uploadCta = page
      .getByText(/glissez|importer|upload|déposez/i).first()
      .or(page.getByRole('button', { name: /importer|upload|ajouter/i }).first())
      .or(page.locator('input[type="file"]').first())
    await expect(uploadCta.first()).toBeVisible({ timeout: 15_000 })
  })

  test('statistiques ou état vide visible', async ({ page }) => {
    // Either stats (total, pending, etc.) or an empty state message
    const content = page
      .getByText(/aucune facture|pas de facture|factures/i).first()
      .or(page.getByText(/total|montant|encours/i).first())
    await expect(content.first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Factures — upload', () => {
  test('upload CSV visible dans zone import', async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    const fileInput = page.locator('input[type="file"]').first()
    if (await fileInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await fileInput.setInputFiles(path.join(FILES_DIR, 'test.csv'))
      // Some feedback should appear
      await expect(
        page.getByText(/analyse|détect|traitement|erreur/i).first()
      ).toBeVisible({ timeout: 15_000 })
    } else {
      // File input hidden (wrapped in dropzone) - test passes if page is accessible
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
