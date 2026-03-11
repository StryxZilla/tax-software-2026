import { test, expect } from './fixtures'
import { startReturnButton, nextButton } from './selectors'

test.describe('UI debug kit smoke @ui-smoke', () => {
  test('login page is reachable via root redirect', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('register page renders and links back to sign in', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('new user can start wizard and reach Dependents step', async ({ page }) => {
    const unique = Date.now()
    const email = `ui-smoke+${unique}@example.com`
    const password = `TaxUi!${unique}`

    await page.goto('/auth/register')
    await page.getByPlaceholder('Jane Smith').fill('UI Smoke')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill(password)
    await page.getByPlaceholder('••••••••').last().fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/', { timeout: 15000 })
    await startReturnButton(page).click()

    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()

    await page.getByPlaceholder('Enter first name').fill('UI')
    await page.getByPlaceholder('Enter last name').fill('Smoke')
    await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
    await page.getByPlaceholder('Your age').fill('30')
    await page.getByPlaceholder('123 Main Street').fill('123 Main St')
    await page.getByPlaceholder('City name').fill('Austin')
    await page.getByPlaceholder('TX').fill('TX')
    await page.getByPlaceholder('12345').fill('73301')

    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: 'Dependents', exact: true })).toBeVisible()
  })
})
