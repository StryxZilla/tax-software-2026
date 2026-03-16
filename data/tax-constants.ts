// 2025 Tax Year Constants

import { FilingStatus } from '../types/tax-types';

// Tax Brackets for 2025
// Source: IRS Revenue Procedure 2024-40 (inflation adjustments for 2025)
export const TAX_BRACKETS_2025: Record<FilingStatus, Array<{ rate: number; min: number; max: number | null }>> = {
  'Single': [
    { rate: 0.10, min: 0,       max: 11925 },
    { rate: 0.12, min: 11926,   max: 48475 },
    { rate: 0.22, min: 48476,   max: 103350 },
    { rate: 0.24, min: 103351,  max: 197300 },
    { rate: 0.32, min: 197301,  max: 250525 },
    { rate: 0.35, min: 250526,  max: 626350 },
    { rate: 0.37, min: 626351,  max: null },
  ],
  'Married Filing Jointly': [
    { rate: 0.10, min: 0,       max: 23850 },
    { rate: 0.12, min: 23851,   max: 96950 },
    { rate: 0.22, min: 96951,   max: 206700 },
    { rate: 0.24, min: 206701,  max: 394600 },
    { rate: 0.32, min: 394601,  max: 501050 },
    { rate: 0.35, min: 501051,  max: 751600 },
    { rate: 0.37, min: 751601,  max: null },
  ],
  'Married Filing Separately': [
    { rate: 0.10, min: 0,       max: 11925 },
    { rate: 0.12, min: 11926,   max: 48475 },
    { rate: 0.22, min: 48476,   max: 103350 },
    { rate: 0.24, min: 103351,  max: 197300 },
    { rate: 0.32, min: 197301,  max: 250525 },
    { rate: 0.35, min: 250526,  max: 375800 },
    { rate: 0.37, min: 375801,  max: null },
  ],
  'Head of Household': [
    { rate: 0.10, min: 0,       max: 17000 },
    { rate: 0.12, min: 17001,   max: 64850 },
    { rate: 0.22, min: 64851,   max: 103350 },
    { rate: 0.24, min: 103351,  max: 197300 },
    { rate: 0.32, min: 197301,  max: 250500 },
    { rate: 0.35, min: 250501,  max: 626350 },
    { rate: 0.37, min: 626351,  max: null },
  ],
  'Qualifying Surviving Spouse': [
    { rate: 0.10, min: 0,       max: 23850 },
    { rate: 0.12, min: 23851,   max: 96950 },
    { rate: 0.22, min: 96951,   max: 206700 },
    { rate: 0.24, min: 206701,  max: 394600 },
    { rate: 0.32, min: 394601,  max: 501050 },
    { rate: 0.35, min: 501051,  max: 751600 },
    { rate: 0.37, min: 751601,  max: null },
  ],
};

// Standard Deductions for 2025
export const STANDARD_DEDUCTION_2025: Record<FilingStatus, number> = {
  'Single': 15000,
  'Married Filing Jointly': 30000,
  'Married Filing Separately': 15000,
  'Head of Household': 22500,
  'Qualifying Surviving Spouse': 30000,
};

// Additional standard deduction for age 65+ or blind (per qualifying condition)
// Single/HOH: $1,550 per condition; Married: $1,250 per condition
export const ADDITIONAL_STANDARD_DEDUCTION_2025 = {
  singleOrHOH: 1550,
  married: 1250,
};

// Capital Gains Tax Rates for 2025
// Source: IRS Revenue Procedure 2024-40
export const CAPITAL_GAINS_BRACKETS_2025: Record<FilingStatus, Array<{ rate: number; max: number | null }>> = {
  'Single': [
    { rate: 0.00, max: 48350 },
    { rate: 0.15, max: 533400 },
    { rate: 0.20, max: null },
  ],
  'Married Filing Jointly': [
    { rate: 0.00, max: 96700 },
    { rate: 0.15, max: 600050 },
    { rate: 0.20, max: null },
  ],
  'Married Filing Separately': [
    { rate: 0.00, max: 48350 },
    { rate: 0.15, max: 300000 },
    { rate: 0.20, max: null },
  ],
  'Head of Household': [
    { rate: 0.00, max: 64750 },
    { rate: 0.15, max: 566700 },
    { rate: 0.20, max: null },
  ],
  'Qualifying Surviving Spouse': [
    { rate: 0.00, max: 96700 },
    { rate: 0.15, max: 600050 },
    { rate: 0.20, max: null },
  ],
};

// Self-Employment Tax for 2025
export const SELF_EMPLOYMENT_TAX_2025 = {
  socialSecurityRate: 0.124,   // 12.4%
  medicareRate: 0.029,         // 2.9%
  socialSecurityWageLimit: 176100, // 2025 SS wage base
  additionalMedicareRate: 0.009,   // 0.9% Net Investment Income Tax threshold
  additionalMedicareThreshold: {
    single: 200000,
    marriedFilingJointly: 250000,
    marriedFilingSeparately: 125000,
  },
};

// Alternative Minimum Tax (AMT) for 2025
// Source: IRS Revenue Procedure 2024-40
export const AMT_2025 = {
  exemption: {
    single: 88100,
    marriedFilingJointly: 137000,
    marriedFilingSeparately: 68500,
  },
  phaseoutThreshold: {
    single: 626350,
    marriedFilingJointly: 1252700,
    marriedFilingSeparately: 626350,
  },
  phaseoutRate: 0.25,
  rate1: 0.26,       // Up to $220,700
  rate2: 0.28,       // Above $220,700
  rate1Threshold: 220700,
};

// Child Tax Credit for 2025
export const CHILD_TAX_CREDIT_2025 = {
  creditPerChild: 2000,
  refundableAmount: 1600,
  phaseoutThreshold: {
    single: 200000,
    marriedFilingJointly: 400000,
    marriedFilingSeparately: 200000,
    headOfHousehold: 200000,
  },
  phaseoutRate: 50, // $50 per $1,000 over threshold
};

// Education Credits for 2025
export const EDUCATION_CREDITS_2025 = {
  americanOpportunity: {
    maxCredit: 2500,
    refundablePercent: 0.40,
    phaseoutStart: {
      single: 80000,
      marriedFilingJointly: 160000,
    },
    phaseoutEnd: {
      single: 90000,
      marriedFilingJointly: 180000,
    },
  },
  lifetimeLearning: {
    maxCredit: 2000,
    phaseoutStart: {
      single: 80000,
      marriedFilingJointly: 160000,
    },
    phaseoutEnd: {
      single: 90000,
      marriedFilingJointly: 180000,
    },
  },
};

// Earned Income Tax Credit for 2025
export const EITC_2025 = {
  maxCredit: {
    0: 632,
    1: 4213,
    2: 6960,
    3: 7830,
  },
  phaseoutStart: {
    single: {
      0: 9800,
      1: 13490,
      2: 19620,
      3: 19620,
    },
    married: {
      0: 16800,
      1: 20490,
      2: 26620,
      3: 26620,
    },
  },
  phaseoutEnd: {
    single: {
      0: 18591,
      1: 47915,
      2: 53865,
      3: 57414,
    },
    married: {
      0: 25591,
      1: 54915,
      2: 60865,
      3: 64414,
    },
  },
};

// HSA Contribution Limits for 2025
export const HSA_LIMITS_2025 = {
  individual: 4300,
  family: 8550,
  catchUp: 1000, // Age 55+
};

// IRA Contribution Limits for 2025
export const IRA_LIMITS_2025 = {
  contributionLimit: 7000,
  catchUpContribution: 1000,   // Age 50+ (total limit becomes $8,000)
  // Traditional IRA deductibility phase-out (if covered by workplace plan)
  deductibilityPhaseout: {
    single: {
      start: 79000,
      end: 89000,
    },
    marriedFilingJointly: {
      start: 126000,
      end: 146000,
    },
  },
  // Roth IRA contribution phase-out (income limits for direct contributions)
  rothPhaseout: {
    single: {
      start: 150000,
      end: 165000,
    },
    marriedFilingJointly: {
      start: 236000,
      end: 246000,
    },
    marriedFilingSeparately: {
      start: 0,
      end: 10000,
    },
  },
};

// SALT (State and Local Tax) Cap
export const SALT_CAP_2025 = 10000;

// Medical Expense AGI Threshold
export const MEDICAL_EXPENSE_AGI_THRESHOLD = 0.075; // 7.5%

// Capital Loss Deduction Limit
export const CAPITAL_LOSS_LIMIT = 3000;

// Meals and Entertainment Deduction Rate
export const MEALS_DEDUCTION_RATE = 0.50; // 50% deductible

// Saver's Credit (Retirement Savings Contributions Credit) for 2025
// Form 8880 — Credit rate depends on AGI and filing status
// Source: IRS Notice 2024-80 (inflation adjustments for 2025)
export const SAVERS_CREDIT_2025 = {
  maxContribution: 2000, // per person ($4000 MFJ)
  brackets: {
    'Single': [
      { rate: 0.50, maxAGI: 23750 },
      { rate: 0.20, maxAGI: 25750 },
      { rate: 0.10, maxAGI: 39500 },
    ],
    'Married Filing Jointly': [
      { rate: 0.50, maxAGI: 47500 },
      { rate: 0.20, maxAGI: 51500 },
      { rate: 0.10, maxAGI: 79000 },
    ],
    'Head of Household': [
      { rate: 0.50, maxAGI: 35625 },
      { rate: 0.20, maxAGI: 38625 },
      { rate: 0.10, maxAGI: 59250 },
    ],
    'Married Filing Separately': [
      { rate: 0.50, maxAGI: 23750 },
      { rate: 0.20, maxAGI: 25750 },
      { rate: 0.10, maxAGI: 39500 },
    ],
    'Qualifying Surviving Spouse': [
      { rate: 0.50, maxAGI: 47500 },
      { rate: 0.20, maxAGI: 51500 },
      { rate: 0.10, maxAGI: 79000 },
    ],
  },
};

// QBI (Qualified Business Income) Deduction for 2025
// 20% of QBI, subject to W-2 wage limits above income thresholds
export const QBI_DEDUCTION_2025 = {
  rate: 0.20,
  wageAndCapitalLimitThreshold: {
    single: 197300,
    marriedFilingJointly: 394600,
  },
  phaseoutRange: {
    single: 50000,         // limit phases in over $50,000 above threshold
    marriedFilingJointly: 100000,
  },
};

// Schedule 1-A Deductions (2025-2028) - "One Big Beautiful Bill"
// Source: IRS Notice and Schedule 1-A Instructions
export const SCHEDULE_1_A_2025 = {
  // Tip Income Deduction (Part II)
  tipDeduction: {
    maxDeduction: 25000,                    // Maximum deduction
    phaseoutStart: {
      single: 150000,
      marriedFilingJointly: 300000,
    },
    phaseoutEnd: {
      single: 165000,
      marriedFilingJointly: 330000,
    },
  },
  // Overtime Pay Deduction (Part III)
  overtimeDeduction: {
    maxDeduction: 12500,                    // Per person ($25,000 married filing jointly)
    maxDeductionMarried: 25000,
    phaseoutStart: {
      single: 150000,
      marriedFilingJointly: 300000,
    },
    phaseoutEnd: {
      single: 165000,
      marriedFilingJointly: 330000,
    },
  },
  // Car Loan Interest Deduction (Part IV)
  carLoanInterest: {
    // No explicit phaseout mentioned in IRS guidance
    // Interest on qualified vehicle loans for personal use
  },
  // Senior Deduction (Part V) - Enhanced deduction for seniors 65+
  seniorDeduction: {
    maxDeduction: 6000,                     // Per person ($12,000 married filing jointly)
    maxDeductionMarried: 12000,
    phaseoutStart: {
      single: 75000,
      marriedFilingJointly: 150000,
    },
    phaseoutEnd: {
      single: 100000,
      marriedFilingJointly: 200000,
    },
    // Born before Jan 2, 1961 to qualify (age 65+ in 2026)
    birthDateThreshold: '1961-01-01',
  },
};
