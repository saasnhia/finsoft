import { test, expect } from '@playwright/test'
import path from 'path'
import { waitForDashboard } from './fixtures/helpers'

const FILES_DIR = path.join(__dirname, 'files')

test.describe('Import — zone drag & drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
  })

  test('zone import visible avec fond clair', async ({ page }) => {
    const zone = page.getByText(/glissez ou cliquez/i)
    await expect(zone).toBeVisible({ timeout: 10_000 })
    const dropZone = zone.locator('xpath=ancestor::div[contains(@class,"border-dashed")][1]')
    const classes = await dropZone.getAttribute('class')
    expect(classes).not.toMatch(/slate-800|bg-black/)
  })

  test('import CSV — état detecting puis detected', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'test.csv'))
    // Detecting state shows "Analyse de <filename>…"
    // Detected state shows type badge + confidence + Annuler button
    await expect(
      page.getByRole('button', { name: /annuler/i })
        .or(page.getByText(/analyse de test\.csv/i))
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('import FEC — badge FEC ou bouton Traiter maintenant', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'test.fec'))
    await expect(
      page.getByRole('button', { name: 'Traiter maintenant' })
        .or(page.getByRole('button', { name: /annuler/i }))
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('annuler après détection remet la zone idle', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'test.csv'))
    await expect(
      page.getByRole('button', { name: /annuler/i })
    ).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /annuler/i }).click()
    await expect(page.getByText(/glissez ou cliquez/i)).toBeVisible({ timeout: 5_000 })
  })

  test('import FEC — bouton Traiter maintenant disponible', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'test.fec'))
    await expect(
      page.getByRole('button', { name: 'Traiter maintenant' })
    ).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Import — page dédiée', () => {
  test('page /import-releve accessible', async ({ page }) => {
    await page.goto('/import-releve')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
