/**
 * Integration tests: Save/Resume — localStorage persistence and draft detection.
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { detectSavedDraft } from '../../components/wizard/WelcomeScreen'
import {
  seedLocalStorageDraft,
  VALID_PERSONAL_INFO,
  VALID_W2,
  VALID_DEPENDENT,
  EMPTY_TAX_RETURN,
} from './helpers'
import { getTaxReturnStorageKeys } from '../../lib/storage/tax-return-storage'

describe('Save/Resume — detectSavedDraft integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null with empty localStorage', () => {
    expect(detectSavedDraft()).toBeNull()
  })

  it('returns null when step is welcome', () => {
    seedLocalStorageDraft({ currentStep: 'welcome' })
    expect(detectSavedDraft()).toBeNull()
  })

  it('returns null when data has no meaningful content', () => {
    seedLocalStorageDraft({
      currentStep: 'dependents',
    })
    // Empty personal info, no W-2 → not a real draft
    expect(detectSavedDraft()).toBeNull()
  })

  it('detects draft with personal info name', () => {
    seedLocalStorageDraft({
      taxReturn: { personalInfo: { ...VALID_PERSONAL_INFO } },
      currentStep: 'dependents',
      completedSteps: ['personal-info'],
    })
    const draft = detectSavedDraft()
    expect(draft).not.toBeNull()
    expect(draft!.currentStep).toBe('dependents')
    expect(draft!.completedCount).toBe(1)
    expect(draft!.hasData).toBe(true)
  })

  it('uses user-scoped keys when a user id is provided', () => {
    const keys = getTaxReturnStorageKeys('user-123')
    localStorage.setItem(keys.taxReturn, JSON.stringify({ personalInfo: { ...VALID_PERSONAL_INFO } }))
    localStorage.setItem(keys.currentStep, 'dependents')
    localStorage.setItem(keys.completedSteps, JSON.stringify(['personal-info']))

    localStorage.setItem('taxReturn2026', JSON.stringify({ personalInfo: { firstName: 'Wrong' } }))
    localStorage.setItem('currentStep', 'review')

    const draft = detectSavedDraft('user-123')
    expect(draft).not.toBeNull()
    expect(draft!.currentStep).toBe('dependents')
    expect(draft!.completedCount).toBe(1)
  })

  it('detects draft with W-2 income even without name', () => {
    seedLocalStorageDraft({
      taxReturn: { w2Income: [VALID_W2] },
      currentStep: 'income-interest',
      completedSteps: ['personal-info', 'dependents', 'income-w2'],
    })
    const draft = detectSavedDraft()
    expect(draft).not.toBeNull()
    expect(draft!.completedCount).toBe(3)
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('taxReturn2026', '{bad json')
    localStorage.setItem('currentStep', 'income-w2')
    expect(detectSavedDraft()).toBeNull()
  })

  it('preserves skipped steps in localStorage roundtrip', () => {
    const skipped = ['dependents', 'income-w2'] as const
    seedLocalStorageDraft({
      taxReturn: { personalInfo: { ...VALID_PERSONAL_INFO } },
      currentStep: 'income-interest',
      completedSteps: ['personal-info'],
      skippedSteps: [...skipped],
    })

    const stored = JSON.parse(localStorage.getItem('skippedSteps')!)
    expect(stored).toEqual([...skipped])
  })

  it('full roundtrip: seed → detect → verify all fields', () => {
    seedLocalStorageDraft({
      taxReturn: {
        personalInfo: { ...VALID_PERSONAL_INFO },
        dependents: [VALID_DEPENDENT],
        w2Income: [VALID_W2],
      },
      currentStep: 'income-interest',
      completedSteps: ['personal-info', 'dependents', 'income-w2'],
      skippedSteps: [],
    })

    // Verify raw localStorage has expected data
    const rawReturn = JSON.parse(localStorage.getItem('taxReturn2026')!)
    expect(rawReturn.personalInfo.firstName).toBe('Jane')
    expect(rawReturn.dependents).toHaveLength(1)
    expect(rawReturn.w2Income).toHaveLength(1)
    expect(rawReturn.w2Income[0].wages).toBe(75000)

    // Verify detectSavedDraft picks it up
    const draft = detectSavedDraft()
    expect(draft).not.toBeNull()
    expect(draft!.currentStep).toBe('income-interest')
    expect(draft!.completedCount).toBe(3)
  })
})

describe('Save/Resume — localStorage key contract', () => {
  it('uses expected key names', () => {
    seedLocalStorageDraft({
      taxReturn: { personalInfo: { ...VALID_PERSONAL_INFO } },
      currentStep: 'dependents',
      completedSteps: ['personal-info'],
      skippedSteps: [],
    })

    expect(localStorage.getItem('taxReturn2026')).toBeTruthy()
    expect(localStorage.getItem('currentStep')).toBe('dependents')
    expect(localStorage.getItem('completedSteps')).toBeTruthy()
    expect(localStorage.getItem('skippedSteps')).toBeTruthy()
  })
})
