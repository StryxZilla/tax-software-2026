import { describe, it, expect } from 'vitest'
import { calculateDeduction, calculateTaxReturn, calculateCapitalGains } from '../../lib/engine/calculations/tax-calculator'
import type { TaxReturn } from '../../types/tax-types'

function baseTaxReturn(overrides: Partial<TaxReturn> = {}): TaxReturn {
  return {
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      ssn: '123-45-6789',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      filingStatus: 'Single',
      age: 35,
      isBlind: false,
    },
    dependents: [],
    w2Income: [],
    interest: [],
    dividends: [],
    capitalGains: [],
    rentalProperties: [],
    aboveTheLineDeductions: {
      educatorExpenses: 0,
      studentLoanInterest: 0,
      hsaContributions: 0,
      hsaEmployerContributions: 0,
      movingExpenses: 0,
      selfEmploymentTaxDeduction: 0,
      selfEmployedHealthInsurance: 0,
      sepIRA: 0,
      alimonyPaid: 0,
    },
    educationExpenses: [],
    estimatedTaxPayments: 0,
    ...overrides,
  }
}

function emptyScheduleCExpenses() {
  return {
    advertising: 0,
    carAndTruck: 0,
    commissions: 0,
    contractLabor: 0,
    depletion: 0,
    depreciation: 0,
    employeeBenefitPrograms: 0,
    insurance: 0,
    interest: 0,
    legal: 0,
    officeExpense: 0,
    pension: 0,
    rentLease: 0,
    repairs: 0,
    supplies: 0,
    taxes: 0,
    travel: 0,
    mealsAndEntertainment: 0,
    utilities: 0,
    wages: 0,
    other: 0,
  }
}

describe('Tax logic golden-case matrix', () => {
  it('single, W-2 only', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 60000, federalTaxWithheld: 7000, socialSecurityWages: 60000, socialSecurityTaxWithheld: 3720, medicareWages: 60000, medicareTaxWithheld: 870 }],
    })

    const result = calculateTaxReturn(tr)

    expect(result.totalIncome).toBe(60000)
    expect(result.agi).toBe(60000)
    expect(result.standardOrItemizedDeduction).toBe(15000)
    expect(result.taxableIncome).toBe(45000)
    expect(result.regularTax).toBe(5162)
    expect(result.totalCredits).toBe(0)
    expect(result.totalTax).toBe(5162)
    expect(result.refundOrAmountOwed).toBe(1838)
  })

  it('MFJ with kids and standard deduction', () => {
    const tr = baseTaxReturn({
      personalInfo: {
        firstName: 'Alex', lastName: 'Doe', ssn: '111-22-3333',
        address: '1 Family Way', city: 'Austin', state: 'TX', zipCode: '78701',
        filingStatus: 'Married Filing Jointly', age: 40, isBlind: false,
        spouseInfo: { firstName: 'Sam', lastName: 'Doe', ssn: '444-55-6666', age: 39, isBlind: false },
      },
      w2Income: [
        { employer: 'A', ein: '11-1111111', wages: 90000, federalTaxWithheld: 9000, socialSecurityWages: 90000, socialSecurityTaxWithheld: 5580, medicareWages: 90000, medicareTaxWithheld: 1305 },
        { employer: 'B', ein: '22-2222222', wages: 30000, federalTaxWithheld: 3000, socialSecurityWages: 30000, socialSecurityTaxWithheld: 1860, medicareWages: 30000, medicareTaxWithheld: 435 },
      ],
      dependents: [
        { firstName: 'Kid1', lastName: 'Doe', ssn: '123-00-0001', relationshipToTaxpayer: 'Son', birthDate: '2015-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
        { firstName: 'Kid2', lastName: 'Doe', ssn: '123-00-0002', relationshipToTaxpayer: 'Daughter', birthDate: '2018-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })

    const result = calculateTaxReturn(tr)

    expect(result.totalIncome).toBe(120000)
    expect(result.agi).toBe(120000)
    expect(result.standardOrItemizedDeduction).toBe(30000)
    expect(result.taxableIncome).toBe(90000)
    expect(result.regularTax).toBe(10323)
    expect(result.totalCredits).toBe(4000)
    expect(result.totalTax).toBe(6323)
    expect(result.refundOrAmountOwed).toBe(5677)
  })

  it('interest/dividends basics', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 40000, federalTaxWithheld: 5000, socialSecurityWages: 40000, socialSecurityTaxWithheld: 2480, medicareWages: 40000, medicareTaxWithheld: 580 }],
      interest: [{ payer: 'Bank', amount: 1500 }],
      dividends: [{ payer: 'Fund', ordinaryDividends: 2500, qualifiedDividends: 1500 }],
    })

    const result = calculateTaxReturn(tr)

    expect(result.totalIncome).toBe(44000)
    expect(result.agi).toBe(44000)
    expect(result.taxableIncome).toBe(29000)
    expect(result.regularTax).toBe(3242)
    expect(result.totalTax).toBe(3242)
    expect(result.refundOrAmountOwed).toBe(1758)
  })

  it('capital loss cap behavior limits net ordinary loss to $3,000', () => {
    const gains = calculateCapitalGains([
      { description: 'Short-term loss', dateAcquired: '2025-01-01', dateSold: '2025-06-01', proceeds: 1000, costBasis: 3000, isLongTerm: false }, // -2000
      { description: 'Long-term loss', dateAcquired: '2022-01-01', dateSold: '2025-06-01', proceeds: 1000, costBasis: 5000, isLongTerm: true }, // -4000
    ])

    expect(gains.shortTermGains + gains.longTermGains).toBe(-3000)

    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 50000, federalTaxWithheld: 6000, socialSecurityWages: 50000, socialSecurityTaxWithheld: 3100, medicareWages: 50000, medicareTaxWithheld: 725 }],
      capitalGains: [
        { description: 'Short-term loss', dateAcquired: '2025-01-01', dateSold: '2025-06-01', proceeds: 1000, costBasis: 3000, isLongTerm: false },
        { description: 'Long-term loss', dateAcquired: '2022-01-01', dateSold: '2025-06-01', proceeds: 1000, costBasis: 5000, isLongTerm: true },
      ],
    })

    const result = calculateTaxReturn(tr)
    expect(result.totalIncome).toBe(47000)
    expect(result.taxableIncome).toBe(32000)
    expect(result.regularTax).toBe(3602)
  })

  it('Schedule C basic case (including SE tax + half-SE adjustment)', () => {
    const tr = baseTaxReturn({
      selfEmployment: {
        businessName: 'Consulting LLC',
        businessCode: '541611',
        grossReceipts: 80000,
        returns: 0,
        costOfGoodsSold: 5000,
        expenses: {
          ...emptyScheduleCExpenses(),
          officeExpense: 5000,
          mealsAndEntertainment: 4000,
        },
      },
    })

    const result = calculateTaxReturn(tr)

    expect(result.totalIncome).toBe(68000)
    expect(result.adjustments).toBe(4804)
    expect(result.agi).toBe(63196)
    expect(result.taxableIncome).toBe(48196)
    expect(result.regularTax).toBe(5545)
    expect(result.selfEmploymentTax).toBe(9608)
    expect(result.totalTax).toBe(15153)
  })

  it('itemized vs standard deduction comparison picks itemized when larger', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 100000, federalTaxWithheld: 12000, socialSecurityWages: 100000, socialSecurityTaxWithheld: 6200, medicareWages: 100000, medicareTaxWithheld: 1450 }],
      itemizedDeductions: {
        medicalExpenses: 0,
        stateTaxesPaid: 6000,
        localTaxesPaid: 2000,
        realEstateTaxes: 3000,
        personalPropertyTaxes: 0,
        homeMortgageInterest: 12000,
        investmentInterest: 0,
        charitableCash: 5000,
        charitableNonCash: 0,
        casualtyLosses: 0,
        otherDeductions: 0,
      },
    })

    const result = calculateTaxReturn(tr)
    const deductionChoice = calculateDeduction(tr, result.agi)

    expect(deductionChoice.isItemized).toBe(true)
    expect(result.standardOrItemizedDeduction).toBe(27000)
    expect(result.taxableIncome).toBe(73000)
    expect(result.regularTax).toBe(10974)
  })

  it('child tax credit edge case with phaseout', () => {
    const tr = baseTaxReturn({
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 210000, federalTaxWithheld: 30000, socialSecurityWages: 176100, socialSecurityTaxWithheld: 10918.2, medicareWages: 210000, medicareTaxWithheld: 3045 }],
      dependents: [
        { firstName: 'Kid', lastName: 'User', ssn: '999-88-7777', relationshipToTaxpayer: 'Daughter', birthDate: '2014-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
    })

    const result = calculateTaxReturn(tr)

    expect(result.agi).toBe(210000)
    expect(result.taxableIncome).toBe(195000)
    expect(result.regularTax).toBe(39647)
    expect(result.totalCredits).toBe(1500)
    expect(result.totalTax).toBe(38147)
    expect(result.refundOrAmountOwed).toBe(-8147)
  })

  it('mixed-income sanity case (W-2 + interest/dividend + gains + Schedule C + CTC + estimated)', () => {
    const tr = baseTaxReturn({
      personalInfo: {
        firstName: 'Casey', lastName: 'Mix', ssn: '101-10-1001',
        address: '42 Mixed St', city: 'Austin', state: 'TX', zipCode: '78701',
        filingStatus: 'Married Filing Jointly', age: 37, isBlind: false,
        spouseInfo: { firstName: 'Jordan', lastName: 'Mix', ssn: '202-20-2002', age: 36, isBlind: false },
      },
      w2Income: [{ employer: 'Acme', ein: '12-3456789', wages: 70000, federalTaxWithheld: 9000, socialSecurityWages: 70000, socialSecurityTaxWithheld: 4340, medicareWages: 70000, medicareTaxWithheld: 1015 }],
      interest: [{ payer: 'Bank', amount: 1000 }],
      dividends: [{ payer: 'Fund', ordinaryDividends: 2000, qualifiedDividends: 1000 }],
      capitalGains: [{ description: 'Stock gain', dateAcquired: '2020-01-01', dateSold: '2025-06-01', proceeds: 13000, costBasis: 10000, isLongTerm: true }],
      selfEmployment: {
        businessName: 'Side Gig',
        businessCode: '541990',
        grossReceipts: 30000,
        returns: 0,
        costOfGoodsSold: 0,
        expenses: { ...emptyScheduleCExpenses(), officeExpense: 5000 },
      },
      traditionalIRAContribution: { amount: 2000, isDeductible: true },
      dependents: [
        { firstName: 'Kid', lastName: 'Mix', ssn: '303-30-3003', relationshipToTaxpayer: 'Son', birthDate: '2017-01-01', isQualifyingChildForCTC: true, monthsLivedWithTaxpayer: 12 },
      ],
      estimatedTaxPayments: 3000,
    })

    const result = calculateTaxReturn(tr)

    expect(result.totalIncome).toBe(101000)
    expect(result.adjustments).toBe(3766)
    expect(result.agi).toBe(97234)
    expect(result.standardOrItemizedDeduction).toBe(30000)
    expect(result.taxableIncome).toBe(67234)
    expect(result.regularTax).toBe(7591)
    expect(result.totalCredits).toBe(2000)
    expect(result.selfEmploymentTax).toBe(3532)
    expect(result.totalTax).toBe(9123)
    expect(result.refundOrAmountOwed).toBe(2877)
  })
})


