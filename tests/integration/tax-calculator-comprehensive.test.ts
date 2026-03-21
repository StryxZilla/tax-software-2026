/**
 * Batch 2: Comprehensive tax calculator integration tests.
 * Tests all calculator functions with realistic scenarios covering
 * every income type, deduction, and credit.
 */
import { describe, it, expect } from 'vitest'
import {
  calculateTotalIncome,
  calculateAdjustments,
  calculateAGI,
  calculateStandardDeduction,
  calculateItemizedDeductions,
  calculateDeduction,
  calculateTaxableIncome,
  calculateRegularTax,
  calculateAMT,
  calculateCapitalGains,
  calculateScheduleCProfit,
  calculateSelfEmploymentTax,
  calculateRentalIncome,
  calculateChildTaxCredit,
  calculateEducationCredits,
  calculateTaxReturn,
  calculateSaversCredit,
  calculateNIIT,
  calculateAdditionalMedicareTax,
  calculateQBIDeduction,
} from '../../lib/engine/calculations/tax-calculator'
import type { TaxReturn, FilingStatus } from '../../types/tax-types'

// ─── Fixture factory ───────────────────────────────────────────────

function baseTaxReturn(overrides: Partial<TaxReturn> = {}): TaxReturn {
  return {
    personalInfo: {
      firstName: 'Test', lastName: 'User', ssn: '123-45-6789',
      address: '123 Main St', city: 'Austin', state: 'TX', zipCode: '78701',
      filingStatus: 'Single', age: 35, isBlind: false,
    },
    dependents: [],
    w2Income: [],
    interest: [],
    dividends: [],
    capitalGains: [],
    rentalProperties: [],
    aboveTheLineDeductions: {
      educatorExpenses: 0, studentLoanInterest: 0, hsaContributions: 0, hsaEmployerContributions: 0,
      movingExpenses: 0, selfEmploymentTaxDeduction: 0,
      selfEmployedHealthInsurance: 0, sepIRA: 0, alimonyPaid: 0,
    },
    educationExpenses: [],
    estimatedTaxPayments: 0,
    ...overrides,
  }
}

function emptyExpenses() {
  return {
    advertising: 0, carAndTruck: 0, commissions: 0, contractLabor: 0,
    depletion: 0, depreciation: 0, employeeBenefitPrograms: 0,
    insurance: 0, interest: 0, legal: 0, officeExpense: 0, pension: 0,
    rentLease: 0, repairs: 0, supplies: 0, taxes: 0, travel: 0,
    mealsAndEntertainment: 0, utilities: 0, wages: 0, other: 0,
  }
}

// ─── Total Income ──────────────────────────────────────────────────

describe('calculateTotalIncome', () => {
  it('returns 0 for empty return', () => {
    expect(calculateTotalIncome(baseTaxReturn())).toBe(0)
  })

  it('sums multiple W-2s', () => {
    const tr = baseTaxReturn({
      w2Income: [
        { employer: 'A', ein: '', wages: 50000, federalTaxWithheld: 8000, socialSecurityWages: 50000, socialSecurityTaxWithheld: 3100, medicareWages: 50000, medicareTaxWithheld: 725 },
        { employer: 'B', ein: '', wages: 25000, federalTaxWithheld: 3000, socialSecurityWages: 25000, socialSecurityTaxWithheld: 1550, medicareWages: 25000, medicareTaxWithheld: 362.5 },
      ],
    })
    expect(calculateTotalIncome(tr)).toBe(75000)
  })

  it('includes interest income', () => {
    const tr = baseTaxReturn({
      interest: [{ payer: 'Bank', amount: 1500 }],
    })
    expect(calculateTotalIncome(tr)).toBe(1500)
  })

  it('includes ordinary dividends', () => {
    const tr = baseTaxReturn({
      dividends: [{ payer: 'Vanguard', ordinaryDividends: 3000, qualifiedDividends: 2000 }],
    })
    expect(calculateTotalIncome(tr)).toBe(3000)
  })

  it('includes capital gains (long and short)', () => {
    const tr = baseTaxReturn({
      capitalGains: [
        { description: 'AAPL', dateAcquired: '2020-01-01', dateSold: '2025-06-01', proceeds: 15000, costBasis: 10000, isLongTerm: true },
        { description: 'TSLA', dateAcquired: '2025-01-01', dateSold: '2025-03-01', proceeds: 8000, costBasis: 6000, isLongTerm: false },
      ],
    })
    expect(calculateTotalIncome(tr)).toBe(7000) // 5000 LT + 2000 ST
  })

  it('applies capital loss limit of $3000', () => {
    const tr = baseTaxReturn({
      capitalGains: [
        { description: 'Loser', dateAcquired: '2024-01-01', dateSold: '2025-01-01', proceeds: 1000, costBasis: 20000, isLongTerm: true },
      ],
    })
    // Loss of -19000 capped at -3000
    expect(calculateTotalIncome(tr)).toBe(-3000)
  })

  it('includes Schedule C net profit', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Freelance', businessCode: '541990', ein: '',
        grossReceipts: 80000, returns: 0, costOfGoodsSold: 5000,
        expenses: { ...emptyExpenses(), advertising: 2000, officeExpense: 3000 },
      },
    })
    // 80000 - 5000 - 2000 - 3000 = 70000
    expect(calculateTotalIncome(tr)).toBe(70000)
  })

  it('includes rental income net of expenses', () => {
    const tr = baseTaxReturn({
      rentalProperties: [{
        address: '100 Elm St', city: 'Dallas', state: 'TX', zipCode: '75201',
        propertyType: 'single-family', daysRented: 365, daysPersonalUse: 0,
        rentalIncome: 24000,
        expenses: {
          advertising: 0, auto: 0, cleaning: 500, commissions: 0, insurance: 1200,
          legal: 0, management: 2400, mortgage: 8000, repairs: 1000, supplies: 200,
          taxes: 3000, utilities: 0, depreciation: 5000, other: 0,
        },
      }],
    })
    // 24000 - (500+1200+2400+8000+1000+200+3000+5000) = 24000 - 21300 = 2700
    expect(calculateTotalIncome(tr)).toBe(2700)
  })

  it('combines all income sources', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 60000, federalTaxWithheld: 9000, socialSecurityWages: 60000, socialSecurityTaxWithheld: 3720, medicareWages: 60000, medicareTaxWithheld: 870 }],
      interest: [{ payer: 'Savings', amount: 500 }],
      dividends: [{ payer: 'ETF', ordinaryDividends: 1000, qualifiedDividends: 800 }],
      capitalGains: [{ description: 'Stock', dateAcquired: '2020-01-01', dateSold: '2025-06-01', proceeds: 12000, costBasis: 10000, isLongTerm: true }],
    })
    expect(calculateTotalIncome(tr)).toBe(63500) // 60000 + 500 + 1000 + 2000
  })
})

// ─── Capital Gains ─────────────────────────────────────────────────

describe('calculateCapitalGains', () => {
  it('separates short-term and long-term gains', () => {
    const result = calculateCapitalGains([
      { description: 'A', dateAcquired: '2020-01-01', dateSold: '2025-01-01', proceeds: 10000, costBasis: 5000, isLongTerm: true },
      { description: 'B', dateAcquired: '2025-01-01', dateSold: '2025-06-01', proceeds: 3000, costBasis: 2000, isLongTerm: false },
    ])
    expect(result.longTermGains).toBe(5000)
    expect(result.shortTermGains).toBe(1000)
  })

  it('handles net losses within $3000 limit', () => {
    const result = calculateCapitalGains([
      { description: 'Loss', dateAcquired: '2024-01-01', dateSold: '2025-01-01', proceeds: 2000, costBasis: 4500, isLongTerm: true },
    ])
    expect(result.longTermGains).toBe(-2500) // within limit
  })

  it('caps net losses at $3000', () => {
    const result = calculateCapitalGains([
      { description: 'Big Loss', dateAcquired: '2024-01-01', dateSold: '2025-01-01', proceeds: 1000, costBasis: 50000, isLongTerm: true },
    ])
    expect(result.longTermGains).toBe(-3000)
  })
})

// ─── Schedule C ────────────────────────────────────────────────────

describe('calculateScheduleCProfit', () => {
  it('computes gross income minus expenses', () => {
    const se = {
      businessName: 'Dev', businessCode: '', ein: '',
      grossReceipts: 100000, returns: 5000, costOfGoodsSold: 10000,
      expenses: { ...emptyExpenses(), advertising: 3000, supplies: 2000 },
    }
    // (100000 - 5000 - 10000) - (3000 + 2000) = 80000
    expect(calculateScheduleCProfit(se)).toBe(80000)
  })

  it('applies 50% meals deduction', () => {
    const se = {
      businessName: 'Consulting', businessCode: '', ein: '',
      grossReceipts: 50000, returns: 0, costOfGoodsSold: 0,
      expenses: { ...emptyExpenses(), mealsAndEntertainment: 4000 },
    }
    // 50000 - (4000 - 4000 * 0.5) = 50000 - 2000 = 48000
    expect(calculateScheduleCProfit(se)).toBe(48000)
  })
})

// ─── Self-Employment Tax ───────────────────────────────────────────

describe('calculateSelfEmploymentTax', () => {
  it('returns 0 for profit <= 400', () => {
    expect(calculateSelfEmploymentTax(400)).toBe(0)
    expect(calculateSelfEmploymentTax(0)).toBe(0)
  })

  it('calculates SE tax on moderate income', () => {
    // 50000 * 0.9235 = 46175
    // SS: 46175 * 0.124 = 5725.70
    // Medicare: 46175 * 0.029 = 1339.08
    // Total: 7064.78 → rounded to 7065
    const tax = calculateSelfEmploymentTax(50000)
    expect(tax).toBe(7065)
  })

  it('caps Social Security at wage limit', () => {
    // 200000 * 0.9235 = 184700
    // SS: min(184700, 176100) * 0.124 = 176100 * 0.124 = 21836.40
    // Medicare: 184700 * 0.029 = 5356.30
    // Total: 27192.70 → 27193
    const tax = calculateSelfEmploymentTax(200000)
    expect(tax).toBe(27193)
  })
})

// ─── Adjustments ───────────────────────────────────────────────────

describe('calculateAdjustments', () => {
  it('includes 50% of SE tax as deduction', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Biz', businessCode: '', ein: '',
        grossReceipts: 50000, returns: 0, costOfGoodsSold: 0,
        expenses: emptyExpenses(),
      },
    })
    const adj = calculateAdjustments(tr)
    const seTax = calculateSelfEmploymentTax(50000)
    expect(adj).toBe(Math.round(seTax * 0.5))
  })

  it('includes HSA contributions', () => {
    const tr = baseTaxReturn({
      hsaData: { contributions: 3000, employerContributions: 500, distributions: 200, isFamily: false },
    })
    expect(calculateAdjustments(tr)).toBe(3000)
  })

  it('includes deductible Traditional IRA', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 6500, isDeductible: true },
    })
    expect(calculateAdjustments(tr)).toBe(6500)
  })

  it('excludes non-deductible Traditional IRA', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 6500, isDeductible: false },
    })
    expect(calculateAdjustments(tr)).toBe(0)
  })

  it('includes student loan interest and educator expenses', () => {
    const tr = baseTaxReturn({
      aboveTheLineDeductions: {
        educatorExpenses: 300, studentLoanInterest: 2500, hsaDeduction: 0,
        movingExpenses: 0, selfEmploymentTaxDeduction: 0,
        selfEmployedHealthInsurance: 0, sepIRA: 0, alimonyPaid: 0,
      },
    })
    expect(calculateAdjustments(tr)).toBe(2800)
  })
})

// ─── Standard Deduction ────────────────────────────────────────────

describe('calculateStandardDeduction', () => {
  const statuses: Array<{ status: FilingStatus; expected: number }> = [
    { status: 'Single', expected: 15000 },
    { status: 'Married Filing Jointly', expected: 30000 },
    { status: 'Married Filing Separately', expected: 15000 },
    { status: 'Head of Household', expected: 22500 },
    { status: 'Qualifying Surviving Spouse', expected: 30000 },
  ]

  statuses.forEach(({ status, expected }) => {
    it(`returns $${expected} for ${status}`, () => {
      const tr = baseTaxReturn()
      tr.personalInfo.filingStatus = status
      expect(calculateStandardDeduction(tr)).toBe(expected)
    })
  })

  it('adds $1550 for single age 65+', () => {
    const tr = baseTaxReturn()
    tr.personalInfo.age = 67
    expect(calculateStandardDeduction(tr)).toBe(15000 + 1550)
  })

  it('adds $1550 for single blind', () => {
    const tr = baseTaxReturn()
    tr.personalInfo.isBlind = true
    expect(calculateStandardDeduction(tr)).toBe(15000 + 1550)
  })

  it('adds $1250 per condition for married filers', () => {
    const tr = baseTaxReturn()
    tr.personalInfo.filingStatus = 'Married Filing Jointly'
    tr.personalInfo.age = 67  // +1250
    tr.personalInfo.isBlind = true  // +1250
    tr.personalInfo.spouseInfo = { firstName: 'S', lastName: 'U', ssn: '999-88-7777', age: 70, isBlind: false }  // +1250 for age
    expect(calculateStandardDeduction(tr)).toBe(30000 + 1250 * 3)
  })
})

// ─── Itemized Deductions ──────────────────────────────────────────

describe('calculateItemizedDeductions', () => {
  it('returns 0 when no itemized deductions', () => {
    expect(calculateItemizedDeductions(baseTaxReturn(), 100000)).toBe(0)
  })

  it('applies SALT cap of $10,000', () => {
    const tr = baseTaxReturn({
      itemizedDeductions: {
        medicalExpenses: 0, stateTaxesPaid: 8000, localTaxesPaid: 2000,
        realEstateTaxes: 5000, personalPropertyTaxes: 1000,
        homeMortgageInterest: 0, investmentInterest: 0,
        charitableCash: 0, charitableNonCash: 0, casualtyLosses: 0, otherDeductions: 0,
      },
    })
    const result = calculateItemizedDeductions(tr, 100000)
    expect(result).toBe(10000) // capped
  })

  it('applies 7.5% AGI floor for medical expenses', () => {
    const agi = 100000
    const tr = baseTaxReturn({
      itemizedDeductions: {
        medicalExpenses: 12000, stateTaxesPaid: 0, localTaxesPaid: 0,
        realEstateTaxes: 0, personalPropertyTaxes: 0,
        homeMortgageInterest: 0, investmentInterest: 0,
        charitableCash: 0, charitableNonCash: 0, casualtyLosses: 0, otherDeductions: 0,
      },
    })
    // 12000 - (100000 * 0.075) = 12000 - 7500 = 4500
    expect(calculateItemizedDeductions(tr, agi)).toBe(4500)
  })

  it('sums mortgage interest and charitable contributions', () => {
    const tr = baseTaxReturn({
      itemizedDeductions: {
        medicalExpenses: 0, stateTaxesPaid: 0, localTaxesPaid: 0,
        realEstateTaxes: 0, personalPropertyTaxes: 0,
        homeMortgageInterest: 15000, investmentInterest: 0,
        charitableCash: 5000, charitableNonCash: 2000, casualtyLosses: 0, otherDeductions: 0,
      },
    })
    expect(calculateItemizedDeductions(tr, 100000)).toBe(22000)
  })
})

// ─── Deduction Choice ─────────────────────────────────────────────

describe('calculateDeduction', () => {
  it('chooses standard deduction when higher', () => {
    const tr = baseTaxReturn({
      itemizedDeductions: {
        medicalExpenses: 0, stateTaxesPaid: 3000, localTaxesPaid: 0,
        realEstateTaxes: 0, personalPropertyTaxes: 0,
        homeMortgageInterest: 5000, investmentInterest: 0,
        charitableCash: 1000, charitableNonCash: 0, casualtyLosses: 0, otherDeductions: 0,
      },
    })
    const result = calculateDeduction(tr, 80000)
    expect(result.isItemized).toBe(false)
    expect(result.amount).toBe(15000)
  })

  it('chooses itemized deduction when higher', () => {
    const tr = baseTaxReturn({
      itemizedDeductions: {
        medicalExpenses: 0, stateTaxesPaid: 5000, localTaxesPaid: 2000,
        realEstateTaxes: 3000, personalPropertyTaxes: 0,
        homeMortgageInterest: 12000, investmentInterest: 0,
        charitableCash: 8000, charitableNonCash: 3000, casualtyLosses: 0, otherDeductions: 0,
      },
    })
    const result = calculateDeduction(tr, 80000)
    expect(result.isItemized).toBe(true)
    expect(result.amount).toBe(10000 + 12000 + 11000) // SALT capped + mortgage + charity
  })
})

// ─── Regular Tax (brackets) ───────────────────────────────────────

describe('calculateRegularTax', () => {
  it('returns 0 for 0 taxable income', () => {
    expect(calculateRegularTax(0, 'Single')).toBe(0)
  })

  it('calculates 10% bracket only', () => {
    expect(calculateRegularTax(10000, 'Single')).toBe(1000)
  })

  it('calculates across multiple brackets for Single $50,000', () => {
    // 10% of 11925 = 1192.50
    // 12% of (48475-11925) = 12% of 36550 = 4386
    // 22% of (50000-48475) = 22% of 1525 = 335.50
    // Total = 5914 (rounded)
    expect(calculateRegularTax(50000, 'Single')).toBe(5914)
  })

  it('uses correct brackets for MFJ', () => {
    // MFJ $50,000: 10% of 23850 = 2385, 12% of 26150 = 3138 = 5523
    expect(calculateRegularTax(50000, 'Married Filing Jointly')).toBe(5523)
  })
})

// ─── Child Tax Credit ──────────────────────────────────────────────

describe('calculateChildTaxCredit', () => {
  it('returns 0 with no qualifying children', () => {
    expect(calculateChildTaxCredit(baseTaxReturn(), 80000)).toBe(0)
  })

  it('gives $2000 per qualifying child', () => {
    const tr = baseTaxReturn({
      dependents: [
        { firstName: 'A', lastName: 'U', ssn: '111-11-1111', relationshipToTaxpayer: 'Son', birthDate: '2015-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
        { firstName: 'B', lastName: 'U', ssn: '222-22-2222', relationshipToTaxpayer: 'Daughter', birthDate: '2017-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })
    expect(calculateChildTaxCredit(tr, 80000)).toBe(4000)
  })

  it('phases out above threshold for Single', () => {
    const tr = baseTaxReturn({
      dependents: [
        { firstName: 'A', lastName: 'U', ssn: '111-11-1111', relationshipToTaxpayer: 'Son', birthDate: '2015-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })
    // AGI $210,000 → $10,000 over $200,000 → phaseout = ceil(10000/1000)*50 = 500
    // Credit = 2000 - 500 = 1500
    expect(calculateChildTaxCredit(tr, 210000)).toBe(1500)
  })

  it('fully phases out at high income', () => {
    const tr = baseTaxReturn({
      dependents: [
        { firstName: 'A', lastName: 'U', ssn: '111-11-1111', relationshipToTaxpayer: 'Son', birthDate: '2015-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })
    // $2000 credit, phaseout = ceil(100000/1000)*50 = 5000 > 2000
    expect(calculateChildTaxCredit(tr, 300000)).toBe(0)
  })
})

// ─── Education Credits ─────────────────────────────────────────────

describe('calculateEducationCredits', () => {
  it('returns 0 with no education expenses', () => {
    expect(calculateEducationCredits(baseTaxReturn(), 60000)).toBe(0)
  })

  it('calculates American Opportunity Credit', () => {
    const tr = baseTaxReturn({
      educationExpenses: [{
        studentName: 'Student', ssn: '333-33-3333', institution: 'UT',
        tuitionAndFees: 5000, isFirstFourYears: true,
      }],
    })
    // Max AOC = $2500; AGI 60000 is below phaseout
    const credit = calculateEducationCredits(tr, 60000)
    expect(credit).toBe(2500)
  })

  it('calculates Lifetime Learning Credit', () => {
    const tr = baseTaxReturn({
      educationExpenses: [{
        studentName: 'GradStudent', ssn: '444-44-4444', institution: 'Rice',
        tuitionAndFees: 8000, isFirstFourYears: false,
      }],
    })
    // LLC: min(10000, 8000) * 0.20 = 1600
    const credit = calculateEducationCredits(tr, 60000)
    expect(credit).toBe(1600)
  })

  it('phases out education credits above income threshold', () => {
    const tr = baseTaxReturn({
      educationExpenses: [{
        studentName: 'Student', ssn: '333-33-3333', institution: 'UT',
        tuitionAndFees: 5000, isFirstFourYears: true,
      }],
    })
    // AGI 85000: midway through 80000-90000 phaseout for Single
    // phaseoutPercent = (90000-85000)/(90000-80000) = 0.5
    // Credit = 2500 * 0.5 = 1250
    const credit = calculateEducationCredits(tr, 85000)
    expect(credit).toBe(1250)
  })

  it('returns 0 above phaseout end', () => {
    const tr = baseTaxReturn({
      educationExpenses: [{
        studentName: 'Student', ssn: '333-33-3333', institution: 'UT',
        tuitionAndFees: 5000, isFirstFourYears: true,
      }],
    })
    expect(calculateEducationCredits(tr, 95000)).toBe(0)
  })
})

// ─── Saver's Credit ───────────────────────────────────────────────

describe('calculateSaversCredit', () => {
  it('returns 0 with no retirement contributions', () => {
    expect(calculateSaversCredit(baseTaxReturn(), 30000)).toBe(0)
  })

  it('returns 0 when AGI exceeds all brackets (Single)', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 2000, isDeductible: true },
    })
    expect(calculateSaversCredit(tr, 50000)).toBe(0) // above $39,500 single
  })

  it('gives 50% credit at lowest AGI bracket (Single)', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 2000, isDeductible: true },
    })
    // AGI $20,000 ≤ $23,750 → 50% rate → 2000 * 0.50 = 1000
    expect(calculateSaversCredit(tr, 20000)).toBe(1000)
  })

  it('gives 20% credit at middle bracket (Single)', () => {
    const tr = baseTaxReturn({
      rothIRAContribution: { amount: 2000 },
    })
    // AGI $25,000 ≤ $25,750 → 20% rate → 2000 * 0.20 = 400
    expect(calculateSaversCredit(tr, 25000)).toBe(400)
  })

  it('gives 10% credit at highest eligible bracket (Single)', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 2000, isDeductible: true },
    })
    // AGI $35,000 ≤ $39,500 → 10% rate → 2000 * 0.10 = 200
    expect(calculateSaversCredit(tr, 35000)).toBe(200)
  })

  it('caps eligible contributions at $2000 per person', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 5000, isDeductible: true },
      rothIRAContribution: { amount: 2000 },
    })
    // Total 7000 but capped at 2000 for single → 2000 * 0.50 = 1000
    expect(calculateSaversCredit(tr, 20000)).toBe(1000)
  })

  it('allows $4000 cap for MFJ', () => {
    const tr = baseTaxReturn({
      personalInfo: {
        firstName: 'J', lastName: 'D', ssn: '111-11-1111',
        address: '1 St', city: 'X', state: 'TX', zipCode: '78701',
        filingStatus: 'Married Filing Jointly', age: 35, isBlind: false,
      },
      traditionalIRAContribution: { amount: 5000, isDeductible: true },
      rothIRAContribution: { amount: 3000 },
    })
    // Total 8000 capped at 4000 for MFJ; AGI $40,000 ≤ $47,500 → 50%
    // 4000 * 0.50 = 2000
    expect(calculateSaversCredit(tr, 40000)).toBe(2000)
  })

  it('combines Traditional + Roth contributions', () => {
    const tr = baseTaxReturn({
      traditionalIRAContribution: { amount: 1000, isDeductible: false },
      rothIRAContribution: { amount: 500 },
    })
    // Total 1500, AGI 20000 → 50% → 750
    expect(calculateSaversCredit(tr, 20000)).toBe(750)
  })

  it('uses Head of Household brackets', () => {
    const tr = baseTaxReturn({
      personalInfo: {
        firstName: 'J', lastName: 'D', ssn: '111-11-1111',
        address: '1 St', city: 'X', state: 'TX', zipCode: '78701',
        filingStatus: 'Head of Household', age: 35, isBlind: false,
      },
      rothIRAContribution: { amount: 2000 },
    })
    // HOH: AGI $30,000 ≤ $35,625 → 50% → 1000
    expect(calculateSaversCredit(tr, 30000)).toBe(1000)
  })

  it('returns 0 for age under 18', () => {
    const tr = baseTaxReturn({
      rothIRAContribution: { amount: 2000 },
    })
    tr.personalInfo.age = 17
    expect(calculateSaversCredit(tr, 20000)).toBe(0)
  })
})

// ─── High-income threshold taxes ───────────────────────────────────

describe('high-income threshold taxes', () => {
  it('does not apply NIIT exactly at filing-status threshold', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 200000, federalTaxWithheld: 0, socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918, medicareWages: 200000, medicareTaxWithheld: 2900 }],
      interest: [{ payer: 'Bank', amount: 10000 }],
    })

    expect(calculateNIIT(tr, 200000)).toBe(0)
  })

  it('applies Additional Medicare Tax only above threshold', () => {
    const atThreshold = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 200000, federalTaxWithheld: 0, socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918, medicareWages: 200000, medicareTaxWithheld: 2900 }],
    })
    const aboveThreshold = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 200112, federalTaxWithheld: 0, socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918, medicareWages: 200112, medicareTaxWithheld: 2901.624 }],
    })

    expect(calculateAdditionalMedicareTax(atThreshold)).toBe(0)
    expect(calculateAdditionalMedicareTax(aboveThreshold)).toBe(1) // 112 * 0.9% = 1.008 → rounds to $1
  })
})

// ─── AMT ───────────────────────────────────────────────────────────

describe('calculateAMT', () => {
  it('uses married-filing-separately phaseout threshold (not single fallback)', () => {
    const tr = baseTaxReturn()
    tr.personalInfo.filingStatus = 'Married Filing Separately'

    // At exactly MFS phaseout threshold there should be no exemption phaseout.
    const agi = 626350
    const regularTax = 0
    const amt = calculateAMT(tr, agi, regularTax)

    // AMT taxable income = 626350 - 68500 = 557850
    // AMT = 220700 * 26% + (557850-220700) * 28% = 151784
    expect(amt).toBe(151784)
  })
})

// ─── QBI ───────────────────────────────────────────────────────────

describe('calculateQBIDeduction', () => {
  it('never returns a negative deduction when Schedule C has a loss', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Loss Biz', businessCode: '541990', ein: '',
        grossReceipts: 10000, returns: 0, costOfGoodsSold: 0,
        expenses: { ...emptyExpenses(), officeExpense: 20000 },
      },
    })

    expect(calculateQBIDeduction(tr, 50000)).toBe(0)
  })
})

// ─── Full Tax Return (end-to-end scenarios) ────────────────────────

describe('calculateTaxReturn – end-to-end', () => {
  it('simple Single W-2 filer', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Google', ein: '12-3456789', wages: 85000, federalTaxWithheld: 14000, socialSecurityWages: 85000, socialSecurityTaxWithheld: 5270, medicareWages: 85000, medicareTaxWithheld: 1232.5 }],
    })
    const result = calculateTaxReturn(tr)
    expect(result.totalIncome).toBe(85000)
    expect(result.adjustments).toBe(0)
    expect(result.agi).toBe(85000)
    expect(result.standardOrItemizedDeduction).toBe(15000)
    expect(result.taxableIncome).toBe(70000)
    expect(result.regularTax).toBeGreaterThan(0)
    expect(result.selfEmploymentTax).toBe(0)
    expect(result.federalTaxWithheld).toBe(14000)
    // Should get a refund or owe
    expect(typeof result.refundOrAmountOwed).toBe('number')
  })

  it('MFJ with children, W-2s, and standard deduction', () => {
    const tr = baseTaxReturn({
      personalInfo: {
        firstName: 'John', lastName: 'Smith', ssn: '111-22-3333',
        address: '789 Pine', city: 'Dallas', state: 'TX', zipCode: '75201',
        filingStatus: 'Married Filing Jointly', age: 40, isBlind: false,
        spouseInfo: { firstName: 'Jane', lastName: 'Smith', ssn: '444-55-6666', age: 38, isBlind: false },
      },
      w2Income: [
        { employer: 'A', ein: '', wages: 80000, federalTaxWithheld: 10000, socialSecurityWages: 80000, socialSecurityTaxWithheld: 4960, medicareWages: 80000, medicareTaxWithheld: 1160 },
        { employer: 'B', ein: '', wages: 50000, federalTaxWithheld: 5000, socialSecurityWages: 50000, socialSecurityTaxWithheld: 3100, medicareWages: 50000, medicareTaxWithheld: 725 },
      ],
      dependents: [
        { firstName: 'Kid1', lastName: 'Smith', ssn: '777-88-9999', relationshipToTaxpayer: 'Daughter', birthDate: '2016-03-15', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
        { firstName: 'Kid2', lastName: 'Smith', ssn: '666-77-8888', relationshipToTaxpayer: 'Son', birthDate: '2019-07-20', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })
    const result = calculateTaxReturn(tr)
    expect(result.totalIncome).toBe(130000)
    expect(result.standardOrItemizedDeduction).toBe(30000)
    expect(result.taxableIncome).toBe(100000)
    expect(result.totalCredits).toBe(4000) // 2 kids × $2000
    expect(result.federalTaxWithheld).toBe(15000)
  })

  it('self-employed with Schedule C and SE tax', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Freelance Dev', businessCode: '541511', ein: '',
        grossReceipts: 120000, returns: 0, costOfGoodsSold: 0,
        expenses: { ...emptyExpenses(), officeExpense: 5000, supplies: 3000, utilities: 2000 },
      },
    })
    const result = calculateTaxReturn(tr)
    expect(result.totalIncome).toBe(110000) // 120k - 10k expenses
    expect(result.selfEmploymentTax).toBeGreaterThan(0)
    expect(result.adjustments).toBeGreaterThan(0) // 50% SE tax deduction
    expect(result.totalTax).toBeGreaterThan(result.totalTaxAfterCredits) // includes SE tax
  })

  it('refund when withholding exceeds tax', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 40000, federalTaxWithheld: 8000, socialSecurityWages: 40000, socialSecurityTaxWithheld: 2480, medicareWages: 40000, medicareTaxWithheld: 580 }],
    })
    const result = calculateTaxReturn(tr)
    expect(result.refundOrAmountOwed).toBeGreaterThan(0) // overpaid
  })

  it('amount owed when under-withheld', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Corp', ein: '', wages: 200000, federalTaxWithheld: 10000, socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918, medicareWages: 200000, medicareTaxWithheld: 2900 }],
    })
    const result = calculateTaxReturn(tr)
    expect(result.refundOrAmountOwed).toBeLessThan(0) // owes
  })

  it('includes estimated tax payments in refund calculation', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Biz', businessCode: '541990', ein: '',
        grossReceipts: 80000, returns: 0, costOfGoodsSold: 0,
        expenses: emptyExpenses(),
      },
      estimatedTaxPayments: 20000,
    })
    const result = calculateTaxReturn(tr)
    // Estimated payments should increase refund
    const trNoEst = baseTaxReturn({
      selfEmployment: {
        businessName: 'Biz', businessCode: '541990', ein: '',
        grossReceipts: 80000, returns: 0, costOfGoodsSold: 0,
        expenses: emptyExpenses(),
      },
      estimatedTaxPayments: 0,
    })
    const resultNoEst = calculateTaxReturn(trNoEst)
    expect(result.refundOrAmountOwed - resultNoEst.refundOrAmountOwed).toBe(20000)
  })

  it('low-income filer with Saver\'s Credit gets larger refund', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Shop', ein: '', wages: 22000, federalTaxWithheld: 2000, socialSecurityWages: 22000, socialSecurityTaxWithheld: 1364, medicareWages: 22000, medicareTaxWithheld: 319 }],
      traditionalIRAContribution: { amount: 2000, isDeductible: true },
    })
    const result = calculateTaxReturn(tr)
    // AGI = 22000 - 2000 (IRA) = 20000 → Saver's Credit at 50% = $1000
    expect(result.totalCredits).toBeGreaterThanOrEqual(1000)
    expect(result.agi).toBe(20000)
  })
})
