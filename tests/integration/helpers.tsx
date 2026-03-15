/**
 * Shared test helpers for integration tests.
 * Provides wrapper components, fixtures, and utility functions.
 */
import './setup'
import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { TaxReturnProvider } from '../../lib/context/TaxReturnContext'
import type { TaxReturn, WizardStep } from '../../types/tax-types'

// ──────────────────────── Fixtures ────────────────────────

export const VALID_PERSONAL_INFO = {
  firstName: 'Jane',
  lastName: 'Doe',
  ssn: '123-45-6789',
  address: '456 Oak Ave',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
  filingStatus: 'Single' as const,
  age: 35,
  isBlind: false,
}

export const VALID_W2 = {
  employer: 'Acme Corp',
  ein: '12-3456789',
  wages: 75000,
  federalTaxWithheld: 12000,
  socialSecurityWages: 75000,
  socialSecurityTaxWithheld: 4650,
  medicareWages: 75000,
  medicareTaxWithheld: 1087.5,
}

export const VALID_DEPENDENT = {
  firstName: 'Jimmy',
  lastName: 'Doe',
  ssn: '987-65-4321',
  relationshipToTaxpayer: 'Son',
  birthDate: '2015-06-15',
  isQualifyingChildForCTC: true,
  monthsLivedWithTaxpayer: 12,
}

export const EMPTY_TAX_RETURN: TaxReturn = {
  personalInfo: {
    firstName: '',
    lastName: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'Single',
    age: 30,
    isBlind: false,
  },
  dependents: [],
  w2Income: [],
  interest: [],
  dividends: [],
  capitalGains: [],
  rentalProperties: [],
  selfEmployment: {
    businessName: '',
    ein: '',
    businessCode: '',
    grossReceipts: 0,
    returns: 0,
    costOfGoodsSold: 0,
    expenses: {
      advertising: 0, carAndTruck: 0, commissions: 0, contractLabor: 0,
      depletion: 0, depreciation: 0, employeeBenefitPrograms: 0,
      insurance: 0, interest: 0, legal: 0, officeExpense: 0, pension: 0,
      rentLease: 0, repairs: 0, supplies: 0, taxes: 0, travel: 0,
      mealsAndEntertainment: 0, utilities: 0, wages: 0, other: 0,
    },
  },
  aboveTheLineDeductions: {
    educatorExpenses: 0, studentLoanInterest: 0, hsaDeduction: 0,
    movingExpenses: 0, selfEmploymentTaxDeduction: 0,
    selfEmployedHealthInsurance: 0, sepIRA: 0, alimonyPaid: 0,
  },
  educationExpenses: [],
  dependentCareExpenses: [],
  residentialEnergyCredit: undefined,
  estimatedTaxPayments: 0,
}

// ──────────────────────── localStorage seeding ────────────────────────

/** Seed localStorage with a draft state for resume tests */
export function seedLocalStorageDraft(opts: {
  taxReturn?: Partial<TaxReturn>
  currentStep?: WizardStep
  completedSteps?: WizardStep[]
  skippedSteps?: WizardStep[]
} = {}) {
  const tr = { ...EMPTY_TAX_RETURN, ...opts.taxReturn }
  localStorage.setItem('taxReturn2026', JSON.stringify(tr))
  localStorage.setItem('currentStep', opts.currentStep ?? 'personal-info')
  localStorage.setItem('completedSteps', JSON.stringify(opts.completedSteps ?? []))
  localStorage.setItem('skippedSteps', JSON.stringify(opts.skippedSteps ?? []))
}

// ──────────────────────── Render wrapper ────────────────────────

/**
 * Wraps component in TaxReturnProvider (which uses useSession internally).
 * next-auth is mocked in setup.ts so this works without a real session.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <TaxReturnProvider>{children}</TaxReturnProvider>
}

/** render() with all providers pre-wrapped */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options })
}
