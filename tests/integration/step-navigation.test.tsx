/**
 * Integration tests: WizardNavigation — step rendering, click-to-navigate, accessibility.
 * @vitest-environment happy-dom
 */
import './setup'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import WizardNavigation from '../../components/wizard/WizardNavigation'
import FormNavigation from '../../components/common/FormNavigation'
import type { WizardStep } from '../../types/tax-types'

describe('WizardNavigation — step indicators', () => {
  it('shows progress percentage and step number', () => {
    render(
      <WizardNavigation
        currentStep="personal-info"
        onStepChange={() => {}}
        completedSteps={new Set()}
      />,
    )
    expect(screen.getByText(/Step 1 of 18/i)).toBeInTheDocument()
    expect(screen.getByText(/6% Complete/i)).toBeInTheDocument()
  })

  it('updates progress when step changes', () => {
    render(
      <WizardNavigation
        currentStep="income-w2"
        onStepChange={() => {}}
        completedSteps={new Set(['personal-info', 'dependents'])}
      />,
    )
    expect(screen.getByText(/Step 3 of 18/i)).toBeInTheDocument()
    expect(screen.getByText(/17% Complete/i)).toBeInTheDocument()
  })
})

describe('WizardNavigation — step panel', () => {
  it('opens step panel on click and lists all 18 steps', async () => {
    const user = userEvent.setup()
    render(
      <WizardNavigation
        currentStep="personal-info"
        onStepChange={() => {}}
        completedSteps={new Set()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Steps/i }))
    expect(screen.getByText('All Steps')).toBeInTheDocument()
    // Multiple elements may match (desktop stepper + panel), use getAllByText
    expect(screen.getAllByText('Personal Information').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Review & Download').length).toBeGreaterThanOrEqual(1)
  })

  it('allows clicking a completed step', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    render(
      <WizardNavigation
        currentStep="dependents"
        onStepChange={onStepChange}
        completedSteps={new Set<WizardStep>(['personal-info'])}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Steps/i }))
    // Find the Personal Information button in the panel and click it
    const personalInfoBtn = screen.getAllByText('Personal Information')
      .map(el => el.closest('button'))
      .find(btn => btn && !btn.disabled)
    expect(personalInfoBtn).toBeTruthy()
    await user.click(personalInfoBtn!)
    expect(onStepChange).toHaveBeenCalledWith('personal-info')
  })
})

describe('FormNavigation — Next/Previous/Skip', () => {
  it('renders Next button for non-last step', () => {
    render(
      <FormNavigation
        currentStep="personal-info"
        onNext={() => {}}
        onPrevious={() => {}}
      />,
    )
    expect(screen.getByText(/Next/i)).toBeInTheDocument()
  })

  it('does not render Previous on first step', () => {
    render(
      <FormNavigation
        currentStep="personal-info"
        onNext={() => {}}
        onPrevious={() => {}}
      />,
    )
    expect(screen.queryByText(/Previous/i)).not.toBeInTheDocument()
  })

  it('renders Previous on non-first step', () => {
    render(
      <FormNavigation
        currentStep="dependents"
        onNext={() => {}}
        onPrevious={() => {}}
      />,
    )
    expect(screen.getByText(/Previous/i)).toBeInTheDocument()
  })

  it('renders Skip for optional step', () => {
    render(
      <FormNavigation
        currentStep="dependents"
        onNext={() => {}}
        onSkip={() => {}}
      />,
    )
    expect(screen.getByText(/Skip for now/i)).toBeInTheDocument()
  })

  it('does not render Skip for required step (personal-info)', () => {
    render(
      <FormNavigation
        currentStep="personal-info"
        onNext={() => {}}
        onSkip={() => {}}
      />,
    )
    expect(screen.queryByText(/Skip for now/i)).not.toBeInTheDocument()
  })

  it('calls onNext when Next is clicked and canProceed is true', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <FormNavigation
        currentStep="personal-info"
        onNext={onNext}
        canProceed={true}
      />,
    )
    await user.click(screen.getByText(/Next/i))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('does not call onNext when canProceed is false', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    const onBlockedNext = vi.fn()
    render(
      <FormNavigation
        currentStep="personal-info"
        onNext={onNext}
        canProceed={false}
        onBlockedNext={onBlockedNext}
      />,
    )
    await user.click(screen.getByText(/Next/i))
    expect(onNext).not.toHaveBeenCalled()
    expect(onBlockedNext).toHaveBeenCalledOnce()
  })

  it('calls onSkip when Skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(
      <FormNavigation
        currentStep="dependents"
        onSkip={onSkip}
      />,
    )
    await user.click(screen.getByText(/Skip for now/i))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('calls onPrevious when Previous is clicked', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    render(
      <FormNavigation
        currentStep="dependents"
        onPrevious={onPrevious}
      />,
    )
    await user.click(screen.getByText(/Previous/i))
    expect(onPrevious).toHaveBeenCalledOnce()
  })
})
