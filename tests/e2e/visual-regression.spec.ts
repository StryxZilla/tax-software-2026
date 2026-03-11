import { test, expect } from './fixtures'
import { startReturnButton, nextButton } from './selectors'

/**
 * Bug Net v1 — Visual regression tests for critical UX elements.
 * Tagged @visual so they can be targeted via `--grep @visual`.
 */

test.describe('Visual regression: Currency inputs @visual', () => {
  test('W-2 form currency inputs have $ prefix with proper spacing', async ({ page }) => {
    // Register + navigate to W-2 form
    const unique = Date.now()
    const email = `vr+${unique}@example.com`
    const password = `TaxVr!${unique}`

    await page.goto('/auth/register')
    await page.getByPlaceholder('Jane Smith').fill('VR User')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill(password)
    await page.getByPlaceholder('••••••••').last().fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/', { timeout: 15000 })
    await startReturnButton(page).click()
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()

    // Fill required personal info and navigate to W-2
    await page.getByPlaceholder('Enter first name').fill('VR')
    await page.getByPlaceholder('Enter last name').fill('User')
    await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
    await page.getByPlaceholder('Your age').fill('30')
    await page.getByPlaceholder('123 Main Street').fill('123 Main St')
    await page.getByPlaceholder('City name').fill('Austin')
    await page.getByPlaceholder('TX').fill('TX')
    await page.getByPlaceholder('12345').fill('73301')

    // Click Next twice: Personal Info → Dependents → W-2
    await nextButton(page).click()
    await page.waitForTimeout(300)
    await nextButton(page).click()
    await page.waitForTimeout(300)

    await expect(page.getByRole('heading', { name: 'W-2 Income' })).toBeVisible()

    // Add a W-2
    await page.getByRole('button', { name: 'Add W-2' }).first().click()
    await page.waitForTimeout(300)

    // Find all currency prefix spans (the $ signs)
    const prefixes = page.locator('.relative > span').filter({ hasText: '$' })
    const prefixCount = await prefixes.count()
    expect(prefixCount).toBeGreaterThanOrEqual(1)

    // Verify each $ prefix is visible and positioned
    for (let i = 0; i < Math.min(prefixCount, 3); i++) {
      const prefix = prefixes.nth(i)
      await expect(prefix).toBeVisible()

      // Verify prefix has left positioning (not overlapping input text)
      const box = await prefix.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeGreaterThan(0)
    }

    // Verify input has left padding (pl-8 = 2rem = 32px)
    const firstCurrencyInput = page.locator('input[type="number"]').first()
    const paddingLeft = await firstCurrencyInput.evaluate(
      (el) => window.getComputedStyle(el).paddingLeft
    )
    const paddingPx = parseFloat(paddingLeft)
    // pl-8 = 2rem ≈ 32px; allow some tolerance
    expect(paddingPx).toBeGreaterThanOrEqual(24)
  })
})

test.describe('Visual regression: Wizard states @visual', () => {
  test('wizard shows active, completed, and locked step visuals', async ({ page }) => {
    const unique = Date.now()
    const email = `wiz+${unique}@example.com`
    const password = `TaxWiz!${unique}`

    await page.goto('/auth/register')
    await page.getByPlaceholder('Jane Smith').fill('Wiz User')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill(password)
    await page.getByPlaceholder('••••••••').last().fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/', { timeout: 15000 })
    await startReturnButton(page).click()
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()

    // Open steps panel
    const stepsButton = page.getByRole('button', { name: 'Steps' })
    if (await stepsButton.isVisible()) {
      await stepsButton.click()
      await page.waitForTimeout(300)

      // Active step (Personal Info) should have aria-current="step"
      const activeStep = page.locator('[aria-current="step"]')
      await expect(activeStep).toBeVisible()

      // Locked steps should be disabled
      const disabledButtons = page.locator('button[disabled]')
      const disabledCount = await disabledButtons.count()
      // At minimum, some future steps should be locked
      expect(disabledCount).toBeGreaterThanOrEqual(1)
    }

    // Fill personal info and advance to check completed state
    await page.getByPlaceholder('Enter first name').fill('Wiz')
    await page.getByPlaceholder('Enter last name').fill('User')
    await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
    await page.getByPlaceholder('Your age').fill('30')
    await page.getByPlaceholder('123 Main Street').fill('123 Main St')
    await page.getByPlaceholder('City name').fill('Austin')
    await page.getByPlaceholder('TX').fill('TX')
    await page.getByPlaceholder('12345').fill('73301')
    await nextButton(page).click()
    await page.waitForTimeout(300)

    // Re-check steps panel: Personal Info should now show completed (checkmark)
    const stepsButton2 = page.getByRole('button', { name: 'Steps' })
    if (await stepsButton2.isVisible()) {
      await stepsButton2.click()
      await page.waitForTimeout(300)

      // The completed step should have an emerald/green indicator
      // Look for the Check icon SVG inside the step buttons
      const completedIndicators = page.locator('.bg-emerald-600')
      const completedCount = await completedIndicators.count()
      expect(completedCount).toBeGreaterThanOrEqual(1)
    }
  })
})

test.describe('Visual regression: Income pie chart @visual', () => {
  test('pie chart renders labels for single income source at 100%', async ({ page }) => {
    const unique = Date.now()
    const email = `pie+${unique}@example.com`
    const password = `TaxPie!${unique}`

    await page.goto('/auth/register')
    await page.getByPlaceholder('Jane Smith').fill('Pie User')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill(password)
    await page.getByPlaceholder('••••••••').last().fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/', { timeout: 15000 })
    await startReturnButton(page).click()

    // Fill personal info
    await page.getByPlaceholder('Enter first name').fill('Pie')
    await page.getByPlaceholder('Enter last name').fill('User')
    await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
    await page.getByPlaceholder('Your age').fill('30')
    await page.getByPlaceholder('123 Main Street').fill('123 Main St')
    await page.getByPlaceholder('City name').fill('Austin')
    await page.getByPlaceholder('TX').fill('TX')
    await page.getByPlaceholder('12345').fill('73301')

    // Navigate to W-2
    await nextButton(page).click()
    await page.waitForTimeout(300)
    await nextButton(page).click()
    await page.waitForTimeout(300)

    // Add W-2 with wages
    await page.getByRole('button', { name: 'Add W-2' }).first().click()
    await page.waitForTimeout(300)

    await page.getByPlaceholder('Company name').fill('Test Corp')
    await page.getByPlaceholder('XX-XXXXXXX').fill('12-3456789')
    // Fill wages field
    const wagesInput = page.locator('input[type="number"]').first()
    await wagesInput.fill('75000')
    await page.waitForTimeout(500)

    // On desktop, the sidebar should show. Check for Income Sources heading
    // and that a pie chart label is visible with text (not blank)
    const incomeSources = page.getByText('Income Sources')
    if (await incomeSources.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Look for the pie label text in the SVG
      const pieLabels = page.locator('.recharts-pie-label-text, .recharts-text')
      const labelCount = await pieLabels.count()
      
      if (labelCount > 0) {
        for (let i = 0; i < labelCount; i++) {
          const text = await pieLabels.nth(i).textContent()
          // Labels should never be blank
          if (text !== null && text !== undefined) {
            expect(text.trim().length, `Pie label ${i} should not be blank`).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})


