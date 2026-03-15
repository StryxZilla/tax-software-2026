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

// Child and Dependent Care Credit for 2025 (Form 2441)
export const CHILD_AND_DEPENDENT_CARE_CREDIT_2025 = {
  // Credit percentage based on AGI
  creditPercentages: [
    { maxAGI: 15000, rate: 0.35 },
    { maxAGI: 17000, rate: 0.34 },
    { maxAGI: 19000, rate: 0.33 },
    { maxAGI: 21000, rate: 0.32 },
    { maxAGI: 23000, rate: 0.31 },
    { maxAGI: 25000, rate: 0.30 },
    { maxAGI: 27000, rate: 0.29 },
    { maxAGI: 29000, rate: 0.28 },
    { maxAGI: 31000, rate: 0.27 },
    { maxAGI: 33000, rate: 0.26 },
    { maxAGI: 35000, rate: 0.25 },
    { maxAGI: 37000, rate: 0.24 },
    { maxAGI: 39000, rate: 0.23 },
    { maxAGI: 41000, rate: 0.22 },
    { maxAGI: 43000, rate: 0.21 },
    { maxAGI: 45000, rate: 0.20 },
    { maxAGI: 47000, rate: 0.19 },
    { maxAGI: 49000, rate: 0.18 },
    { maxAGI: 51000, rate: 0.17 },
    { maxAGI: 53000, rate: 0.16 },
    { maxAGI: 55000, rate: 0.15 },
    { maxAGI: 57000, rate: 0.14 },
    { maxAGI: 59000, rate: 0.13 },
    { maxAGI: 61000, rate: 0.12 },
    { maxAGI: 63000, rate: 0.11 },
    { maxAGI: 65000, rate: 0.10 },
    { maxAGI: 67000, rate: 0.09 },
    { maxAGI: 69000, rate: 0.08 },
    { maxAGI: 71000, rate: 0.07 },
    { maxAGI: 73000, rate: 0.06 },
    { maxAGI: 75000, rate: 0.05 },
    { maxAGI: Infinity, rate: 0.05 }, // Floor at 5%
  ],
  // Maximum eligible care expenses
  maxCareExpenses: {
    oneQualifyingPerson: 3000,
    twoOrMoreQualifyingPersons: 6000,
  },
  // Earned income limit (can't claim more than your earned income)
  earnedIncomeLimit: true,
};

// Electric Vehicle Credit for 2025 (Clean Vehicle Credit - Form 8936)
export const EV_CREDIT_2025 = {
  // New clean vehicles
  newVehicle: {
    maxCredit: 7500,
    minBatteryCapacity: 7, // kWh for base credit
    additionalKwhFor7500: 13, // Need at least 7 + 13 = 20 kWh for max credit
    batteryCapacityCredit: 417, // Per kWh above threshold (max $7,500)
  },
  // Used clean vehicles (added by Inflation Reduction Act)
  usedVehicle: {
    maxCredit: 4000,
    maxVehiclePrice: 25000,
    minBatteryCapacity: 7,
  },
  // Income phase-out (starts reducing credit at these levels)
  incomePhaseout: {
    single: {
      start: 150000,
      end: 180000,
    },
    marriedFilingJointly: {
      start: 300000,
      end: 360000,
    },
    headOfHousehold: {
      start: 225000,
      end: 270000,
    },
  },
  // Qualifying manufacturers (must meet IRS requirements)
  // This list changes, but here are major ones as of 2025
  qualifyingManufacturers: [
    'Tesla',
    'Rivian',
    'Ford',
    'Chevrolet',
    'GMC',
    'Cadillac',
    'Jeep',
    'Hyundai',
    'Kia',
    'BMW',
    'Mercedes-Benz',
    'Volkswagen',
    'Audi',
    'Volvo',
    'Porsche',
    'Toyota',
    'Honda',
    'Nissan',
    'Lexus',
    'Acura',
    'Mazda',
    'Subaru',
  ],
};

// Residential Energy Credit for 2025 (Form 3468)
// Note: The energy efficient home improvements credit
export const RESIDENTIAL_ENERGY_CREDIT_2025 = {
  improvements: {
    // Solar electric (30% through 2032, then phases down)
    solarElectric: {
      rate: 0.30,
      maxCredit: Infinity,
      throughYear: 2032,
      description: 'Solar electric property (solar panels)',
    },
    // Solar water heating (30% through 2032)
    solarWaterHeating: {
      rate: 0.30,
      maxCredit: Infinity,
      throughYear: 2032,
      description: 'Solar water heating property',
    },
    // Wind energy (30% through 2032)
    windEnergy: {
      rate: 0.30,
      maxCredit: Infinity,
      throughYear: 2032,
      description: 'Small wind energy property',
    },
    // Geothermal heat pumps (30% through 2032)
    geothermalHeatPump: {
      rate: 0.30,
      maxCredit: Infinity,
      throughYear: 2032,
      description: 'Geothermal heat pump property',
    },
    // Fuel cells (30% through 2032, with per-watt limits)
    fuelCell: {
      rate: 0.30,
      maxCreditPerHalfWatt: 1000, // $1,000 per 0.5 kW
      description: 'Fuel cell property',
    },
    // Heat pumps - NEW category (30% for 2022-2032)
    heatPump: {
      rate: 0.30,
      maxCredit: 2000,
      throughYear: 2032,
      description: 'Air source heat pump or heat pump water heater',
    },
    // Biomass stoves (30% for 2022-2032)
    biomassStove: {
      rate: 0.30,
      maxCredit: 2000,
      throughYear: 2032,
      description: 'Biomass stove',
    },
    // Windows, doors, skylights (10%)
    windowsDoors: {
      rate: 0.10,
      maxCredit: 500, // $500 per window, $250 per door, max $500 total
      description: 'Windows, doors, skylights',
    },
    // Roofing (10%)
    roofing: {
      rate: 0.10,
      maxCredit: 500,
      description: 'Metal and asphalt roofs with appropriate pigmented coatings',
    },
    // Insulation (10%)
    insulation: {
      rate: 0.10,
      maxCredit: 500,
      description: 'Insulation materials',
    },
    // Air sealing and duct sealing (10%)
    sealing: {
      rate: 0.10,
      maxCredit: 500,
      description: 'Air sealing and duct sealing',
    },
  },
  // Annual credit cap (starts 2023)
  annualCap: 12000, // For improvements made after 2022
};
