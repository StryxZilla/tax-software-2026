/**
 * Integration test: authenticated storage isolation.
 * Ensures fresh accounts don't inherit another user's local wizard progress.
 * @vitest-environment happy-dom
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useSessionMock } from './setup'
import { TaxReturnProvider, useTaxReturn } from '../../lib/context/TaxReturnContext'
import { getTaxReturnStorageKeys } from '../../lib/storage/tax-return-storage'

function Probe() {
  const { currentStep, completedSteps, taxReturn } = useTaxReturn()
  return (
    <div>
      <div data-testid="step">{currentStep}</div>
      <div data-testid="completed-count">{completedSteps.size}</div>
      <div data-testid="first-name">{taxReturn.personalInfo.firstName || ''}</div>
    </div>
  )
}

describe('TaxReturnProvider auth storage isolation', () => {
  it('does not hydrate a brand-new authenticated user from guest localStorage keys', async () => {
    localStorage.setItem('taxReturn2026', JSON.stringify({
      personalInfo: { firstName: 'Leaked' },
      dependents: [{ firstName: 'Kid' }],
    }))
    localStorage.setItem('currentStep', 'review')
    localStorage.setItem('completedSteps', JSON.stringify(['personal-info', 'dependents', 'income-w2']))

    useSessionMock.mockReturnValue({
      data: {
        user: { id: 'brand-new-user', email: 'new@example.com', name: 'New User', isAdmin: false },
        expires: '2099-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    } as any)

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: null }),
    })) as unknown as typeof fetch)

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('step').textContent).toBe('welcome')
    })

    expect(screen.getByTestId('completed-count').textContent).toBe('0')
    expect(screen.getByTestId('first-name').textContent).toBe('')

    const scopedKeys = getTaxReturnStorageKeys('brand-new-user')
    expect(localStorage.getItem(scopedKeys.currentStep)).not.toBe('review')
  })
})

function renderWithProvider() {
  return render(
    <TaxReturnProvider>
      <Probe />
    </TaxReturnProvider>,
  )
}
