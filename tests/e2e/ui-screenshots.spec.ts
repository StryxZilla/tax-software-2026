import { test, expect } from './fixtures'
import { startReturnButton } from './selectors'
import path from 'node:path'
import fs from 'node:fs/promises'

const stamp = new Date().toISOString().replace(/[.:]/g, '-')
const screenshotDir = path.join(process.cwd(), 'artifacts', 'ui-debug', 'screenshots', stamp)

test.describe('UI debug kit screenshots @ui-screenshot', () => {
  test.beforeAll(async () => {
    await fs.mkdir(screenshotDir, { recursive: true })
  })

  test('capture login, register, and wizard-start screens', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true })

    await page.goto('/auth/register')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await page.screenshot({ path: path.join(screenshotDir, '02-register.png'), fullPage: true })

    const unique = Date.now()
    const email = `ui-shot+${unique}@example.com`
    const password = `TaxShot!${unique}`

    await page.getByPlaceholder('Jane Smith').fill('UI Screens')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill(password)
    await page.getByPlaceholder('••••••••').last().fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/', { timeout: 15000 })
    await startReturnButton(page).click()
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
    await page.screenshot({ path: path.join(screenshotDir, '03-personal-information.png'), fullPage: true })

    console.log(`Screenshots saved to: ${screenshotDir}`)
  })
})
