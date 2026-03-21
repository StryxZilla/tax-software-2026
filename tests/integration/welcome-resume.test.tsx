/**
 * Integration tests: WelcomeScreen — fresh start vs resume flow.
 * @vitest-environment happy-dom
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../components/brand/ZoeyImage', () => ({
  default: (props: { alt?: string; 'data-testid'?: string }) => (
    <span data-testid={props['data-testid'] ?? 'zoey-image-mock'} aria-label={props.alt ?? 'Zoey image mock'} />
  ),
}))

import WelcomeScreen from '../../components/wizard/WelcomeScreen'
import { renderWithProviders, seedLocalStorageDraft, VALID_PERSONAL_INFO, VALID_W2 } from './helpers'

describe('WelcomeScreen — fresh start', () => {
  it('renders the Start button when no draft exists', () => {
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} />,
    )
    expect(screen.getByTestId('start-return-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('resume-draft-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('start-over-btn')).not.toBeInTheDocument()
  })

  it('calls onStart when Start button is clicked', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    renderWithProviders(<WelcomeScreen onStart={onStart} />)

    await user.click(screen.getByTestId('start-return-btn'))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('shows welcome title for new users', () => {
    renderWithProviders(<WelcomeScreen onStart={() => {}} />)
    expect(screen.getByText(/Welcome to Zoey/i)).toBeInTheDocument()
  })

  it('shows the full 18-step flow summary', () => {
    renderWithProviders(<WelcomeScreen onStart={() => {}} />)
    expect(screen.getByText(/18 guided steps from intake to final review/i)).toBeInTheDocument()
    expect(screen.getByText(/Dividend Income/i)).toBeInTheDocument()
    expect(screen.getByText(/Schedule 1 Attachments/i)).toBeInTheDocument()
  })
})

describe('WelcomeScreen — resume flow', () => {
  beforeEach(() => {
    seedLocalStorageDraft({
      taxReturn: { personalInfo: { ...VALID_PERSONAL_INFO } },
      currentStep: 'dependents',
      completedSteps: ['personal-info'],
    })
  })

  it('shows Resume and Start Over buttons when draft exists', () => {
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={() => {}} />,
    )
    expect(screen.getByTestId('resume-draft-btn')).toBeInTheDocument()
    expect(screen.getByTestId('start-over-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('start-return-btn')).not.toBeInTheDocument()
  })

  it('shows welcome back title', () => {
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={() => {}} />,
    )
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })

  it('shows draft info banner with completed step count', () => {
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={() => {}} />,
    )
    const info = screen.getByTestId('draft-info')
    expect(info).toBeInTheDocument()
    expect(info.textContent).toMatch(/1 step completed/i)
  })

  it('calls onResume when Resume button is clicked', async () => {
    const user = userEvent.setup()
    const onResume = vi.fn()
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={onResume} onStartOver={() => {}} />,
    )
    await user.click(screen.getByTestId('resume-draft-btn'))
    expect(onResume).toHaveBeenCalledOnce()
  })

  it('calls onStartOver when Start Over button is clicked', async () => {
    const user = userEvent.setup()
    const onStartOver = vi.fn()
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={onStartOver} />,
    )
    await user.click(screen.getByTestId('start-over-btn'))
    expect(onStartOver).toHaveBeenCalledOnce()
  })
})

describe('WelcomeScreen — resume with multiple completed steps', () => {
  it('shows correct count for 3 completed steps', () => {
    seedLocalStorageDraft({
      taxReturn: {
        personalInfo: { ...VALID_PERSONAL_INFO },
        w2Income: [VALID_W2],
      },
      currentStep: 'income-interest',
      completedSteps: ['personal-info', 'dependents', 'income-w2'],
    })
    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={() => {}} />,
    )
    const info = screen.getByTestId('draft-info')
    expect(info.textContent).toMatch(/3 steps completed/i)
  })

  it('shows resume UI for partial progress without name or W-2', () => {
    seedLocalStorageDraft({
      taxReturn: {
        personalInfo: { ...VALID_PERSONAL_INFO, firstName: '' },
        w2Income: [],
        interest: [{ payer: 'City Credit Union', amount: 42 }],
      },
      currentStep: 'income-capital-gains',
      completedSteps: ['income-interest'],
    })

    renderWithProviders(
      <WelcomeScreen onStart={() => {}} onResume={() => {}} onStartOver={() => {}} />,
    )

    expect(screen.getByTestId('resume-draft-btn')).toBeInTheDocument()
    const info = screen.getByTestId('draft-info')
    expect(info.textContent).toMatch(/1 step completed/i)
  })
})
