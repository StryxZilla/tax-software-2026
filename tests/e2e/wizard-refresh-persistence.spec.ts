import { test, expect } from './fixtures'
import { nextButton } from './selectors'

/**
 * Critical test: Wizard state must survive a browser refresh.
 * The app persists currentStep and form data to localStorage.
 * If this regresses, users lose progress mid-filing — unacceptable.
 */
test('wizard state persists after browser refresh @critical-smoke', async ({ page }) => {
  test.setTimeout(60_000)

  // --- Register a fresh user ---
  const unique = Date.now()
  const email = `qa+${unique}@example.com`
  const password = `TaxQa!${unique}`

  await page.goto('/auth/register')
  await page.getByPlaceholder('Jane Smith').fill('QA User')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('Min. 8 characters').fill(password)
  await page.getByPlaceholder('••••••••').last().fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('/', { timeout: 15000 })
  await expect(page.getByText('Welcome to', { exact: false })).toBeVisible({ timeout: 10000 })

  // --- Enter wizard and fill Personal Information ---
  await page.getByTestId('start-return-btn').click()
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()

  await page.getByPlaceholder('Enter first name').fill('QA')
  await page.getByPlaceholder('Enter last name').fill('User')
  await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
  await page.getByPlaceholder('Your age').fill('30')
  await page.getByPlaceholder('123 Main Street').fill('123 Main St')
  await page.getByPlaceholder('City name').fill('Austin')
  await page.getByPlaceholder('TX').fill('TX')
  await page.getByPlaceholder('12345').fill('73301')

  // Click Next — advance past Personal Information
  const next = nextButton(page)
  await expect(next).toBeEnabled({ timeout: 10000 })
  await next.click()

  // Verify we advanced past Personal Information
  await expect(page.getByRole('heading', { name: 'Personal Information' })).not.toBeVisible({ timeout: 5000 })

  // Capture current wizard step heading (h2 to avoid sub-headings)
  const headingBeforeRefresh = await page.locator('h2').first().textContent()
  expect(headingBeforeRefresh).toBeTruthy()

  // Ensure localStorage has been updated with the new step.
  // Authenticated sessions now use user-scoped keys (e.g. currentStep:user:<id>).
  const savedStep = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('currentStep'))
    return key ? localStorage.getItem(key) : null
  })
  expect(savedStep).toBeTruthy()
  expect(savedStep).not.toBe('welcome')
  expect(savedStep).not.toBe('personal-info')

  // Verify form data is in localStorage (user-scoped key)
  const savedData = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('taxReturn2026'))
    return key ? localStorage.getItem(key) : null
  })
  expect(savedData).toBeTruthy()
  const parsed = JSON.parse(savedData!)
  expect(parsed.personalInfo.firstName).toBe('QA')

  // --- Refresh the page ---
  await page.reload()

  // --- Verify step persistence ---
  // Dismiss the import banner if it appears
  const skipBtn = page.getByRole('button', { name: 'Skip' })
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click()
  }

  // The wizard should restore to the same step (not reset to welcome)
  await expect(page.getByRole('heading', { name: headingBeforeRefresh!, exact: true })).toBeVisible({ timeout: 15000 })

  // Verify localStorage still has the form data after reload
  const postReloadStep = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('currentStep'))
    return key ? localStorage.getItem(key) : null
  })
  expect(postReloadStep).toBe(savedStep)

  const postReloadData = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('taxReturn2026'))
    return key ? localStorage.getItem(key) : null
  })
  expect(postReloadData).toBeTruthy()
  const postParsed = JSON.parse(postReloadData!)
  expect(postParsed.personalInfo.firstName).toBe('QA')
  expect(postParsed.personalInfo.lastName).toBe('User')
  expect(postParsed.personalInfo.address).toBe('123 Main St')
})

