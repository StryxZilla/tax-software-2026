import { describe, expect, it } from 'vitest'
import {
  validatePersonalInfo,
  validateDependent,
  validateTaxReturn,
  validateW2,
  validateCapitalGain,
  validateInterest,
  validateEducationExpense,
  validateScheduleC,
  validateRentalProperty,
  validateEIN,
  validateZipCode,
  validateRetirement,
  validateItemizedDeductions,
} from '../../lib/validation/form-validation'
import type { Dependent, EducationExpenses, PersonalInfo, TaxReturn, W2Income } from '../../types/tax-types'

function createBasePersonalInfo(): PersonalInfo {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    ssn: '123-45-6789',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    filingStatus: 'Single',
    age: 35,
    isBlind: false,
  }
}

function createBaseW2(): W2Income {
  return {
    employer: 'Acme Inc',
    ein: '12-3456789',
    wages: 50000,
    federalTaxWithheld: 5000,
    socialSecurityWages: 50000,
    socialSecurityTaxWithheld: 3100,
    medicareWages: 50000,
    medicareTaxWithheld: 725,
  }
}

function createBaseTaxReturn(): TaxReturn {
  return {
    personalInfo: createBasePersonalInfo(),
    dependents: [],
    w2Income: [createBaseW2()],
    interest: [],
    dividends: [],
    capitalGains: [],
    rentalProperties: [],
    aboveTheLineDeductions: {
      educatorExpenses: 0,
      studentLoanInterest: 0,
      hsaDeduction: 0,
      movingExpenses: 0,
      selfEmploymentTaxDeduction: 0,
      selfEmployedHealthInsurance: 0,
      sepIRA: 0,
      alimonyPaid: 0,
    },
    educationExpenses: [],
    estimatedTaxPayments: 0,
  }
}

describe('form validation hardening', () => {
  it('rejects invalid US state abbreviations in personal info', () => {
    const errors = validatePersonalInfo({ ...createBasePersonalInfo(), state: 'XX' })
    expect(errors.some((e) => e.field === 'state')).toBe(true)
  })

  it('rejects impossible SSNs that match pattern but are IRS-invalid', () => {
    const errors = validatePersonalInfo({ ...createBasePersonalInfo(), ssn: '000-12-3456' })
    expect(errors.some((e) => e.field === 'ssn')).toBe(true)
  })

  it('accepts valid SSN values with surrounding whitespace', () => {
    const errors = validatePersonalInfo({ ...createBasePersonalInfo(), ssn: ' 123-45-6789 ' })
    expect(errors.some((e) => e.field === 'ssn')).toBe(false)
  })

  it('accepts EIN and ZIP values with surrounding whitespace after normalization', () => {
    expect(validateEIN(' 12-3456789 ')).toBe(true)
    expect(validateZipCode(' 78701-1234 ')).toBe(true)
  })

  it('rejects invalid dependent birth date values', () => {
    const dependent: Dependent = {
      firstName: 'Kid',
      lastName: 'Doe',
      ssn: '234-56-7890',
      relationshipToTaxpayer: 'Daughter',
      birthDate: 'not-a-date',
      isQualifyingChildForCTC: false,
      monthsLivedWithTaxpayer: 12,
    }

    const errors = validateDependent(dependent, 0)
    expect(errors.some((e) => e.field === 'dependent-0-birthDate')).toBe(true)
  })

  it('rejects impossible calendar dates for dependent birth date', () => {
    const dependent: Dependent = {
      firstName: 'Kid',
      lastName: 'Doe',
      ssn: '234-56-7890',
      relationshipToTaxpayer: 'Daughter',
      birthDate: '2025-02-30',
      isQualifyingChildForCTC: false,
      monthsLivedWithTaxpayer: 12,
    }

    const errors = validateDependent(dependent, 0)
    expect(errors.some((e) => e.field === 'dependent-0-birthDate')).toBe(true)
  })

  it('rejects W-2 withholding greater than wages', () => {
    const w2 = { ...createBaseW2(), federalTaxWithheld: 51000 }
    const errors = validateW2(w2, 0)
    expect(errors.some((e) => e.field === 'w2-0-federalTax')).toBe(true)
  })

  it('rejects non-finite 1099-INT amounts (NaN/Infinity)', () => {
    const nanErrors = validateInterest({ payer: 'Bank', amount: Number.NaN }, 0)
    const infinityErrors = validateInterest({ payer: 'Bank', amount: Number.POSITIVE_INFINITY }, 0)

    expect(nanErrors.some((e) => e.field === 'interest-0-amount')).toBe(true)
    expect(infinityErrors.some((e) => e.field === 'interest-0-amount')).toBe(true)
  })

  it('rejects non-finite education tuition amounts (NaN/Infinity)', () => {
    const baseExpense: EducationExpenses = {
      studentName: 'Student Doe',
      ssn: '234-56-7890',
      institution: 'State University',
      tuitionAndFees: 1000,
      isFirstFourYears: true,
    }

    const nanErrors = validateEducationExpense({ ...baseExpense, tuitionAndFees: Number.NaN }, 0)
    const infinityErrors = validateEducationExpense({ ...baseExpense, tuitionAndFees: Number.POSITIVE_INFINITY }, 0)

    expect(nanErrors.some((e) => e.field === 'education-0-tuition')).toBe(true)
    expect(infinityErrors.some((e) => e.field === 'education-0-tuition')).toBe(true)
    expect(nanErrors.some((e) => e.message.includes('cannot be negative'))).toBe(false)
  })

  it('rejects non-finite W-2 numeric values (NaN/Infinity)', () => {
    const w2 = {
      ...createBaseW2(),
      wages: Number.NaN,
      federalTaxWithheld: Number.POSITIVE_INFINITY,
    }

    const errors = validateW2(w2, 0)

    expect(errors.some((e) => e.field === 'w2-0-wages')).toBe(true)
    expect(errors.some((e) => e.field === 'w2-0-federalTax')).toBe(true)
  })

  it('rejects non-finite Schedule C numeric values', () => {
    const errors = validateScheduleC({
      businessName: 'Side Gig LLC',
      ein: '12-3456789',
      grossReceipts: Number.NaN,
      returns: Number.POSITIVE_INFINITY,
      costOfGoodsSold: Number.NaN,
    })

    expect(errors.some((e) => e.field === 'scheduleC-grossReceipts')).toBe(true)
    expect(errors.some((e) => e.field === 'scheduleC-returns')).toBe(true)
    expect(errors.some((e) => e.field === 'scheduleC-cogs')).toBe(true)
  })

  it('rejects non-finite rental property day and income fields', () => {
    const errors = validateRentalProperty(
      {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        daysRented: Number.NaN,
        daysPersonalUse: Number.POSITIVE_INFINITY,
        rentalIncome: Number.NaN,
        expenses: {},
      },
      0,
    )

    expect(errors.some((e) => e.field === 'rental-0-daysRented')).toBe(true)
    expect(errors.some((e) => e.field === 'rental-0-daysPersonalUse')).toBe(true)
    expect(errors.some((e) => e.field === 'rental-0-rentalIncome')).toBe(true)
  })

  it('rejects non-finite age in personal info', () => {
    const info = { ...createBasePersonalInfo(), age: Number.NaN }
    const errors = validatePersonalInfo(info)
    expect(errors.some((e) => e.field === 'age' && e.message.includes('valid number'))).toBe(true)

    const infErrors = validatePersonalInfo({ ...createBasePersonalInfo(), age: Number.POSITIVE_INFINITY })
    expect(infErrors.some((e) => e.field === 'age' && e.message.includes('valid number'))).toBe(true)
  })

  it('rejects non-finite spouse age when filing jointly', () => {
    const info: PersonalInfo = {
      ...createBasePersonalInfo(),
      filingStatus: 'Married Filing Jointly',
      spouseInfo: { firstName: 'John', lastName: 'Doe', ssn: '987-65-4321', age: Number.NaN, isBlind: false },
    }
    const errors = validatePersonalInfo(info)
    expect(errors.some((e) => e.field === 'spouseAge' && e.message.includes('valid number'))).toBe(true)
  })

  it('rejects non-finite dependent monthsLivedWithTaxpayer', () => {
    const dep: Dependent = {
      firstName: 'Kid',
      lastName: 'Doe',
      ssn: '234-56-7890',
      relationshipToTaxpayer: 'Son',
      birthDate: '2020-01-01',
      isQualifyingChildForCTC: true,
      monthsLivedWithTaxpayer: Number.NaN,
    }
    const errors = validateDependent(dep, 0)
    expect(errors.some((e) => e.field === 'dependent-0-months' && e.message.includes('valid number'))).toBe(true)

    const infDep = { ...dep, monthsLivedWithTaxpayer: Number.POSITIVE_INFINITY }
    const infErrors = validateDependent(infDep, 0)
    expect(infErrors.some((e) => e.field === 'dependent-0-months' && e.message.includes('valid number'))).toBe(true)
  })

  it('does not report withholding exceeds wages when wages is invalid', () => {
    const w2 = {
      ...createBaseW2(),
      wages: Number.NaN,
      federalTaxWithheld: 999,
    }

    const errors = validateW2(w2, 0)

    expect(errors.some((e) => e.message.includes('cannot exceed wages'))).toBe(false)
  })

  it('rejects duplicate SSNs across taxpayer and dependents', () => {
    const taxReturn = createBaseTaxReturn()
    taxReturn.dependents = [
      {
        firstName: 'Kid',
        lastName: 'Doe',
        ssn: '123-45-6789',
        relationshipToTaxpayer: 'Son',
        birthDate: '2018-05-01',
        isQualifyingChildForCTC: true,
        monthsLivedWithTaxpayer: 12,
      },
    ]

    const errors = validateTaxReturn(taxReturn)
    expect(errors.some((e) => e.field === 'dependent-0-ssn')).toBe(true)
  })

  it('rejects duplicate SSNs even when one side has surrounding whitespace', () => {
    const taxReturn = createBaseTaxReturn()
    taxReturn.personalInfo.ssn = '123-45-6789'
    taxReturn.dependents = [
      {
        firstName: 'Kid',
        lastName: 'Doe',
        ssn: ' 123-45-6789 ',
        relationshipToTaxpayer: 'Son',
        birthDate: '2018-05-01',
        isQualifyingChildForCTC: true,
        monthsLivedWithTaxpayer: 12,
      },
    ]

    const errors = validateTaxReturn(taxReturn)
    expect(errors.some((e) => e.field === 'dependent-0-ssn')).toBe(true)
  })

  it('rejects spouse SSN matching taxpayer SSN after trimming whitespace', () => {
    const info: PersonalInfo = {
      ...createBasePersonalInfo(),
      filingStatus: 'Married Filing Jointly',
      spouseInfo: {
        firstName: 'John',
        lastName: 'Doe',
        ssn: ' 123-45-6789 ',
        age: 34,
        isBlind: false,
      },
    }

    const errors = validatePersonalInfo(info)
    expect(errors.some((e) => e.field === 'spouseSSN' && e.message.includes('different'))).toBe(true)
  })

  it('rejects impossible capital gains dates', () => {
    const errors = validateCapitalGain(
      {
        description: 'Stock sale',
        dateAcquired: '2025-02-30',
        dateSold: '2025-03-15',
        proceeds: 1000,
        costBasis: 500,
      },
      0,
    )

    expect(errors.some((e) => e.field === 'capital-0-dateAcquired')).toBe(true)
  })

  it('rejects capital gains sale dates in the future', () => {
    const nextYear = new Date().getUTCFullYear() + 1
    const errors = validateCapitalGain(
      {
        description: 'Stock sale',
        dateAcquired: '2024-01-01',
        dateSold: `${nextYear}-01-01`,
        proceeds: 1000,
        costBasis: 500,
      },
      0,
    )

    expect(errors.some((e) => e.field === 'capital-0-dateSold')).toBe(true)
  })

  it('rejects non-finite IRA contribution amounts', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const tradErrors = validateRetirement({ amount: bad as number, isDeductible: true }, undefined, undefined)
      expect(tradErrors.some((e) => e.field === 'retirement-traditional-amount' && e.message.includes('valid number'))).toBe(true)

      const rothErrors = validateRetirement(undefined, { amount: bad as number }, undefined)
      expect(rothErrors.some((e) => e.field === 'retirement-roth-amount' && e.message.includes('valid number'))).toBe(true)
    }
  })

  it('skips combined IRA limit check when amounts are non-finite', () => {
    const errors = validateRetirement({ amount: NaN, isDeductible: true }, { amount: NaN }, undefined)
    expect(errors.some((e) => e.field === 'retirement-combined-limit')).toBe(false)
  })

  it('rejects non-finite Form 8606 fields', () => {
    const errors = validateRetirement(undefined, undefined, {
      nondeductibleContributions: NaN,
      priorYearBasis: Infinity,
      conversionsToRoth: -Infinity,
      endOfYearTraditionalIRABalance: NaN,
      distributionsFromTraditionalIRA: 0,
    })
    expect(errors.some((e) => e.field === 'retirement-8606-nondeductible' && e.message.includes('valid number'))).toBe(true)
    expect(errors.some((e) => e.field === 'retirement-8606-priorBasis' && e.message.includes('valid number'))).toBe(true)
    expect(errors.some((e) => e.field === 'retirement-8606-conversions' && e.message.includes('valid number'))).toBe(true)
    expect(errors.some((e) => e.field === 'retirement-8606-balance' && e.message.includes('valid number'))).toBe(true)
  })

  it('still validates valid IRA contributions normally', () => {
    const errors = validateRetirement({ amount: 5000, isDeductible: true }, { amount: 2000 }, undefined)
    expect(errors).toHaveLength(0)
  })

  it('rejects non-finite itemized deduction values (NaN, Infinity)', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const errors = validateItemizedDeductions({ medicalExpenses: bad } as any)
      expect(errors.some((e) => e.field === 'itemized-medicalExpenses' && e.message.includes('valid number'))).toBe(true)
    }
  })

  it('accepts valid itemized deductions with no errors', () => {
    const errors = validateItemizedDeductions({
      medicalExpenses: 5000,
      stateTaxesPaid: 3000,
      localTaxesPaid: 1000,
      realEstateTaxes: 2000,
      personalPropertyTaxes: 500,
      homeMortgageInterest: 8000,
      investmentInterest: 0,
      charitableCash: 1000,
      charitableNonCash: 200,
      casualtyLosses: 0,
      otherDeductions: 0,
    })
    expect(errors).toHaveLength(0)
  })

  it('warns when SALT deductions exceed $10,000 cap', () => {
    const errors = validateItemizedDeductions({
      medicalExpenses: 0,
      stateTaxesPaid: 5000,
      localTaxesPaid: 3000,
      realEstateTaxes: 4000,
      personalPropertyTaxes: 1000,
      homeMortgageInterest: 0,
      investmentInterest: 0,
      charitableCash: 0,
      charitableNonCash: 0,
      casualtyLosses: 0,
      otherDeductions: 0,
    })
    expect(errors.some((e) => e.field === 'itemized-saltCap')).toBe(true)
    expect(errors.some((e) => e.message.includes('$10,000'))).toBe(true)
  })

  it('does not warn when SALT deductions are at exactly $10,000', () => {
    const errors = validateItemizedDeductions({
      medicalExpenses: 0,
      stateTaxesPaid: 5000,
      localTaxesPaid: 2000,
      realEstateTaxes: 3000,
      personalPropertyTaxes: 0,
      homeMortgageInterest: 0,
      investmentInterest: 0,
      charitableCash: 0,
      charitableNonCash: 0,
      casualtyLosses: 0,
      otherDeductions: 0,
    })
    expect(errors.some((e) => e.field === 'itemized-saltCap')).toBe(false)
  })

  it('rejects non-finite proceeds and costBasis (NaN, undefined, Infinity)', () => {
    const base = {
      description: 'Stock sale',
      dateAcquired: '2024-01-01',
      dateSold: '2024-06-01',
    }

    for (const bad of [NaN, undefined, Infinity, -Infinity]) {
      const errors = validateCapitalGain({ ...base, proceeds: bad, costBasis: 500 }, 0)
      expect(errors.some((e) => e.field === 'capital-0-proceeds' && e.message.includes('valid number'))).toBe(true)

      const errors2 = validateCapitalGain({ ...base, proceeds: 1000, costBasis: bad }, 0)
      expect(errors2.some((e) => e.field === 'capital-0-costBasis' && e.message.includes('valid number'))).toBe(true)
    }
  })

  it('rejects W-2 Social Security wages exceeding the annual wage base', () => {
    const w2 = { ...createBaseW2(), socialSecurityWages: 200000, socialSecurityTaxWithheld: 10912 }
    const errors = validateW2(w2, 0)
    expect(errors.some((e) => e.field === 'w2-0-socialSecurityWages' && e.message.includes('wage base'))).toBe(true)
    expect(errors.some((e) => e.field === 'w2-0-socialSecurityWages' && e.message.includes('2025 wage base'))).toBe(true)
  })

  it('accepts W-2 Social Security wages at the wage base limit', () => {
    const w2 = { ...createBaseW2(), socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918.20 }
    const errors = validateW2(w2, 0)
    expect(errors.some((e) => e.field === 'w2-0-socialSecurityWages')).toBe(false)
  })

  it('rejects W-2 SS tax withheld exceeding expected maximum', () => {
    // 6.2% of 50000 = 3100; reporting 5000 is too high
    const w2 = { ...createBaseW2(), socialSecurityTaxWithheld: 5000 }
    const errors = validateW2(w2, 0)
    expect(errors.some((e) => e.field === 'w2-0-socialSecurityTaxWithheld' && e.message.includes('exceeds expected'))).toBe(true)
  })

  it('accepts W-2 SS tax withheld at exactly the expected rate', () => {
    // 6.2% of 50000 = 3100
    const w2 = { ...createBaseW2(), socialSecurityTaxWithheld: 3100 }
    const errors = validateW2(w2, 0)
    expect(errors.some((e) => e.field === 'w2-0-socialSecurityTaxWithheld')).toBe(false)
  })
})
