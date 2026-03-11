import type { Page } from '@playwright/test'

export const START_RETURN_BUTTON = /^(Start your return|Let's Get Started)$/i
export const NEXT_BUTTON = /^Next(\s*→)?$/i

export function startReturnButton(page: Page) {
  return page.getByRole('button', { name: START_RETURN_BUTTON }).first()
}

export function nextButton(page: Page) {
  return page.getByRole('button', { name: NEXT_BUTTON })
}
