import { test, expect } from '@playwright/test'
import { waitForDashboard } from './fixtures/helpers'

test.describe('Comptabilité — pages', () => {
  test('page /transactions accessible', async ({ page }) => {
    await page.goto('/transactions')
    await expect(page).not.toHaveURL(/\/login|\/pricing/, { timeout: 10_000 })
  })

  test('page /audit/balance-agee accessible', async ({ page }) => {
    await page.goto('/audit/balance-agee')
    await expect(page).not.toHaveURL(/\/login|\/pricing/, { timeout: 10_000 })
  })

  test('balance âgée widget sur dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/balance âgée/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('transactions liste ou message vide', async ({ page }) => {
    await page.goto('/transactions')
    await expect(
      page.getByRole('table')
        .or(page.getByText(/aucune transaction|importer|pas de transaction/i))
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Comptabilité — Export FEC', () => {
  test('modal export FEC s\'ouvre', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await page.getByRole('button', { name: 'Export FEC' }).click()
    // Modal shows h2 heading "Export FEC"
    await expect(page.getByRole('heading', { name: 'Export FEC' })).toBeVisible({ timeout: 10_000 })
  })

  test('modal FEC contient bouton .TXT', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await page.getByRole('button', { name: 'Export FEC' }).click()
    await expect(page.getByRole('heading', { name: 'Export FEC' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /\.txt|norme fec/i }).first()).toBeVisible()
  })
})
