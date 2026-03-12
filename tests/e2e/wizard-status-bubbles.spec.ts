import { test, expect } from './fixtures'
import path from 'node:path'
import fs from 'node:fs'

function artifactsDir(testTitle: string) {
  const safe = testTitle.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()
  return path.join('test-results', safe)
}

test('wizard/status bubbles visual + state + refresh + resume @critical-smoke', async ({ page }, testInfo) => {
  test.setTimeout(90_000)

  const dir = artifactsDir(testInfo.title)
  fs.mkdirSync(dir, { recursive: true })

  const unique = Date.now()
  const email = `bubbles+${unique}@example.com`
  const password = `TaxBubbles!${unique}`

  await page.goto('/auth/register')
  await page.getByPlaceholder('Jane Smith').fill('Bubble User')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('Min. 8 characters').fill(password)
  await page.getByPlaceholder('••••••••').last().fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('/', { timeout: 15000 })
  await page.getByRole('button', { name: /Start your return/i }).first().click()
  await expect(page.getByRole('heading', { name: 'Personal Information', exact: true })).toBeVisible()

  await expect(page.getByText(/Step 1 of 11/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /1\s+Personal/i })).toBeVisible()
  await page.screenshot({ path: path.join(dir, '01-personal-active.png'), fullPage: true })

  await page.getByPlaceholder('Enter first name').fill('Bubble')
  await page.getByPlaceholder('Enter last name').fill('User')
  await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
  await page.getByPlaceholder('Your age').fill('30')
  await page.getByPlaceholder('123 Main Street').fill('123 Main St')
  await page.getByPlaceholder('City name').fill('Austin')
  await page.getByPlaceholder('TX').fill('TX')
  await page.getByPlaceholder('12345').fill('73301')

  await page.getByRole('button', { name: /^Next/i }).click()
  await expect(page.getByRole('heading', { name: 'Dependents', exact: true })).toBeVisible()
  await expect(page.getByText(/Step 2 of 11/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /2\s+Depend/i })).toBeVisible()
  await expect(page.locator('.bg-emerald-600').first()).toBeVisible()
  await page.screenshot({ path: path.join(dir, '02-dependents-active-personal-complete.png'), fullPage: true })

  await page.getByRole('button', { name: /Previous/i }).click()
  await expect(page.getByRole('heading', { name: 'Personal Information', exact: true })).toBeVisible()
  await expect(page.getByText(/Step 1 of 11/i)).toBeVisible()
  await page.screenshot({ path: path.join(dir, '03-back-to-personal.png'), fullPage: true })

  await page.getByRole('button', { name: /^Next/i }).click()
  await expect(page.getByRole('heading', { name: 'Dependents', exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dependents', exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Step 2 of 11/i)).toBeVisible()
  await page.screenshot({ path: path.join(dir, '04-after-refresh-still-dependents.png'), fullPage: true })

  // Simulate leaving and resuming an in-progress return.
  await page.getByRole('button', { name: /Back to Overview/i }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByTestId('draft-info')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /Resume where you left off/i })).toBeVisible()
  await page.getByRole('button', { name: /Resume where you left off/i }).click()

  await expect(page.getByRole('heading', { name: 'Dependents', exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Step 2 of 11/i)).toBeVisible()
  await page.screenshot({ path: path.join(dir, '05-resume-to-dependents.png'), fullPage: true })
})
