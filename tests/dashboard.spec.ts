import { test, expect } from '@playwright/test'
import { waitForDashboard } from './fixtures/helpers'

test.describe('Dashboard — structure', () => {
  test('accès sans redirection /pricing', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL(/\/pricing/, { timeout: 15_000 })
    await waitForDashboard(page)
  })

  test('KPIs affichés', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(
      page.getByText(/dossiers actifs|encours clients|alertes actives|factures en retard/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('widget Import fichier visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/importer un fichier/i)).toBeVisible({ timeout: 10_000 })
  })

  test('zone drag & drop avec fond clair', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    const zone = page.getByText(/glissez ou cliquez/i)
    await expect(zone).toBeVisible({ timeout: 10_000 })
    const dropZone = zone.locator('xpath=ancestor::div[contains(@class,"border-dashed")][1]')
    const classes = await dropZone.getAttribute('class')
    expect(classes).not.toMatch(/slate-800|bg-black/)
  })

  test('bouton Export FEC visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByRole('button', { name: 'Export FEC' })).toBeVisible({ timeout: 10_000 })
  })

  test('bandeau e-invoicing affiché', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/e-invoicing|factur-x/i)).toBeVisible({ timeout: 10_000 })
  })

  test('balance âgée widget visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/balance âgée/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('widget rapprochements présent', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/rapprochements/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('KPI TVA du mois affiché', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/tva du mois/i)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Dashboard — mode Cabinet', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/onboarding/complete', { data: { profile_type: 'cabinet' } })
  })

  test('KPI Dossiers actifs visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/dossiers actifs/i)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Dashboard — mode Entreprise', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/onboarding/complete', { data: { profile_type: 'entreprise' } })
  })

  test.afterAll(async ({ request }) => {
    await request.post('/api/onboarding/complete', { data: { profile_type: 'cabinet' } })
  })

  test('graphique PCG visible avec fond clair', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/dépenses par catégorie pcg/i)).toBeVisible({ timeout: 20_000 })
    const chartContainer = page.locator('.recharts-wrapper')
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    const bgClass = await chartContainer.getAttribute('class')
    expect(bgClass).toContain('bg-white')
  })

  test('Indicateurs entreprise visibles', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await expect(page.getByText(/indicateurs entreprise/i)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Dashboard — navigation', () => {
  test('modal Export FEC s\'ouvre', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    await page.getByRole('button', { name: 'Export FEC' }).click()
    // Modal shows h2 "Export FEC"
    await expect(page.getByRole('heading', { name: 'Export FEC' })).toBeVisible({ timeout: 10_000 })
  })

  test('lien "Toutes" transactions → /transactions', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForDashboard(page)
    const link = page.getByRole('link', { name: /toutes/i }).first()
    expect(await link.getAttribute('href')).toContain('/transactions')
  })
})
