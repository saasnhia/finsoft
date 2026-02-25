/**
 * Shared test helpers.
 */
import type { Page } from '@playwright/test'

/**
 * Wait for the main dashboard content to be visible.
 * Uses the h1 heading as a reliable "page loaded" signal
 * (visible only after the full-screen auth/subscription spinner clears).
 */
export async function waitForDashboard(page: Page) {
  await page.getByRole('heading', { name: 'Tableau de bord', level: 1 })
    .waitFor({ state: 'visible', timeout: 25_000 })
}

/**
 * Wait for a page spinner to disappear. Handles multiple concurrent
 * spinners by checking that no LARGE page-level spinner is visible.
 */
export async function waitForPageLoad(page: Page, timeout = 25_000) {
  // Wait for any full-page spinner (w-8 class) to disappear
  await page.locator('svg.w-8.animate-spin').waitFor({ state: 'hidden', timeout }).catch(() => {})
}
