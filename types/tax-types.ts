// Comprehensive Tax Software Type Definitions
// 2025 Tax Year

// Filing Status
export type FilingStatus = 
  | 'Single'
  | 'Married Filing Jointly'
  | 'Married Filing Separately'
  | 'Head of Household'
  | 'Qualifying Surviving Spouse';

// Personal Information
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  filingStatus: FilingStatus;
  age: number;
  isBlind: boolean;
  spouseInfo?: {
    firstName: string;
    lastName: string;
    ssn: string;
    age: number;
    isBlind: boolean;
  };
}

// Dependents
export interface Dependent {
  firstName: string;
  lastName: string;
  ssn: string;
  relationshipToTaxpayer: string;
  birthDate: string;
  isQualifyingChildForCTC: boolean;
  monthsLivedWithTaxpayer: number;
}

// Income Types
export interface W2IncomeBox12 {
  code: string;  // e.g., "DD", "G", "L", "R", "W", etc.
  amount: number;
}

export interface W2Income {
  employer: string;
  ein: string;
  wages: number;
  federalTaxWithheld: number;
  socialSecurityWages: number;
  socialSecurityTaxWithheld: number;
  medicareWages: number;
  medicareTaxWithheld: number;
  box12?: W2IncomeBox12[];  // Other compensation (codes DD, G, L, R, W, etc.)
}

export interface Interest1099INT {
  payer: string;
  accountNumber?: string;        // Box (if applicable)
  // Boxes 1-6
  amount: number;                    // Box 1: Interest income
  earlyWithdrawalPenalty: number;   // Box 2: Early withdrawal penalty
  usSavingsBondInterest: number;    // Box 3: US Savings Bonds/Treasury interest
  backupWithholding: number;         // Box 4: Backup withholding
  investmentExpenses: number;        // Box 5: Investment expenses (REMIC only)
  foreignTaxPaid: number;            // Box 6: Foreign tax paid
  // Box 7-8
  foreignCountry?: string;           // Box 7: Foreign country or US possession
  taxExemptInterest: number;        // Box 8: Tax-exempt interest (OID)
  // Boxes 9-14 (rarely used)
  privateActivityBondInterest?: number; // Box 9: Interest on specified private activity bond
  marketDiscount?: number;              // Box 10: Market discount
  bondPremium?: number;                // Box 11: Bond premium
  bondPremiumTreasury?: number;        // Box 12: Bond premium on US Treasury obligations
  bondPremiumTaxExempt?: number;       // Box 13: Bond premium on tax-exempt bonds
  cusipNumber?: string;                // Box 14: CUSIP number
}

export interface Dividend1099DIV {
  payer: string;
  ordinaryDividends: number;        // Box 1a: Ordinary dividends
  qualifiedDividends: number;       // Box 1b: Qualified dividends (taxed at lower rate)
  capitalGainDistributions: number; // Box 2: Capital gain distributions
  exemptInterestDividends: number;  // Box 3: Exempt-interest dividends (municipal bonds)
  foreignTaxPaid: number;           // Box 6: Foreign tax paid (can deduct or credit)
  foreignCountry: string;          // Box 7: Foreign country or US possession
}

export interface CapitalGainTransaction {
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  isLongTerm: boolean;
}

export interface SelfEmploymentIncome {
  businessName: string;
  ein?: string;
  businessCode: string;
  grossReceipts: number;
  returns: number;
  costOfGoodsSold: number;
  expenses: ScheduleCExpenses;
}

export interface Form1099NEC {
  id: string;
  payer: string;
  recipient: string;
  tin: string;
  nonEmployeeCompensation: number;
  federalTaxWithheld: number;
}

export interface Form1099R {
  id: string;
  payer: string;
  grossDistribution: number;      // Box 1
  taxableAmount: number;          // Box 2a
  federalTaxWithheld: number;    // Box 4
  employeeContributions: number;   // Box 5
  distributionCode: string;        // Box 7
}

export interface SocialSecurityBenefits {
  id: string;
  benefitsReceived: number;       // Box 1
  taxableBenefits: number;        // Box 2 (calculated)
  federalTaxWithheld: number;    // Box 4
}

export interface Form1099K {
  id: string;
  payer: string;
  ein: string;
  grossAmount: number;
  transactionCount: number;
  merchantCategoryCode: string;
}

export interface Form1099MISC {
  id: string;
  payer: string;
  recipient: string;
  amount: number;                    // Box 1: Miscellaneous income
  federalTaxWithheld: number;       // Box 4: Federal tax withheld
}

export interface Form1099OID {
  id: string;
  payer: string;
  amount: number;                    // Box 1: Original issue discount
  taxableAmount: number;             // Box 2: Taxable amount
  federalTaxWithheld: number;        // Box 4: Federal tax withheld
}

export interface Form1099B {
  id: string;
  payer: string;
  proceeds: number;                 // Box 1a: Proceeds
  costBasis: number;                 // Box 2: Cost basis
  gainLoss: number;                  // Box 3: Gain or (loss)
}

export interface Form1099S {
  id: string;
  payer: string;
  propertyAddress: string;
  amount: number;                    // Gross amount
  realEstateTaxWithheld: number;     // Box 5: Real estate tax withheld
}

export interface Form1099C {
  id: string;
  payer: string;
  amount: number;                    // Box 2: Amount of debt canceled
  debtType: string;                   // Type of debt canceled
  dateCanceled: string;               // Box 3: Date debt was canceled
}

export interface ScheduleCExpenses {
  advertising: number;
  carAndTruck: number;
  commissions: number;
  contractLabor: number;
  depletion: number;
  depreciation: number;
  employeeBenefitPrograms: number;
  insurance: number;
  interest: number;
  legal: number;
  officeExpense: number;
  pension: number;
  rentLease: number;
  repairs: number;
  supplies: number;
  taxes: number;
  travel: number;
  mealsAndEntertainment: number;
  utilities: number;
  wages: number;
  other: number;
}

export interface RentalProperty {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'single-family' | 'multi-family' | 'vacation' | 'commercial';
  daysRented: number;
  daysPersonalUse: number;
  rentalIncome: number;
  expenses: RentalExpenses;
}

export interface RentalExpenses {
  advertising: number;
  auto: number;
  cleaning: number;
  commissions: number;
  insurance: number;
  legal: number;
  management: number;
  mortgage: number;
  repairs: number;
  supplies: number;
  taxes: number;
  utilities: number;
  depreciation: number;
  other: number;
}

// Retirement Accounts
export interface TraditionalIRAContribution {
  amount: number;
  isDeductible: boolean;
}

export interface RothIRAContribution {
  amount: number;
}

export interface Form8606Data {
  nondeductibleContributions: number;
  priorYearBasis: number;
  conversionsToRoth: number;
  endOfYearTraditionalIRABalance: number;
  distributionsFromTraditionalIRA: number;
}

export interface HSAData {
  contributions: number;
  employerContributions: number;
  distributions: number;
  isFamily: boolean;
}

// Deductions
export interface ItemizedDeductions {
  medicalExpenses: number;
  stateTaxesPaid: number;
  localTaxesPaid: number;
  realEstateTaxes: number;
  personalPropertyTaxes: number;
  homeMortgageInterest: number;
  investmentInterest: number;
  charitableCash: number;
  charitableNonCash: number;
  casualtyLosses: number;
  otherDeductions: number;
}

export interface AboveTheLineDeductionsData {
  educatorExpenses: number;
  studentLoanInterest: number;
  hsaContributions: number;
  hsaEmployerContributions: number;
  movingExpenses: number;
  selfEmploymentHealthInsurance: number;
  sepIRA: number;
  alimonyPaid: number;
}

export interface AboveTheLineDeductions {
  educatorExpenses: number;
  studentLoanInterest: number;
  hsaContributions: number;
  hsaEmployerContributions: number;
  movingExpenses: number;
  selfEmploymentTaxDeduction: number;
  selfEmployedHealthInsurance: number;
  sepIRA: number;
  alimonyPaid: number;
}

// Schedule 1-A Deductions (2025-2028) - "One Big Beautiful Bill"
export interface Schedule1ADeductions {
  tipIncome: number;
  tipExpenses: number;
  isTipDeductionEligible: boolean;
  overtimeHours: number;
  overtimePay: number;
  carLoanInterest: number;
  isSeniorDeductionEligible: boolean;
}

// Credits
export interface TaxCredits {
  childTaxCredit: number;
  earnedIncomeCredit: number;
  americanOpportunityCredit: number;
  lifetimeLearningCredit: number;
  retirementSavingsCredit: number;
  childAndDependentCareCredit: number;
  electricVehicleCredit: number;
  residentialEnergyCredit: number;
  foreignTaxCredit: number;
}

// Child and Dependent Care Credit
export interface DependentCareExpenses {
  dependentName: string;
  ssn: string;
  careProvider: string;
  ein?: string;
  amount: number;
}

// Electric Vehicle Credit (Clean Vehicle Credit - Form 8936)
export interface ElectricVehicleCredit {
  vehicleType: 'new' | 'used';
  vin: string;
  vehicleMake: string;
  vehicleModel: string;
  purchaseDate: string;
  purchasePrice: number;
  batteryCapacity: number; // kWh
  isQualifiedManufacturer: boolean;
  manufacturerName: string;
  hasBeenUsedBefore: boolean;
  modifiedForDisabled: boolean;
  PlacedInServiceInGreenhouseGasEmissionTestState: boolean;
}

// Residential Energy Credit (Form 3468)
export interface ResidentialEnergyImprovement {
  improvementType: 'solar-electric' | 'solar-water-heating' | 'wind-energy' | 'geothermal-heat-pump' | 'fuel-cell' | 'heat-pump' | 'heat-pump-water-heater' | 'biomass-stove' | 'windows-doors' | 'roofing' | 'insulation' | 'sealants' | 'duct-sealing' | 'other';
  description: string;
  installationDate: string;
  cost: number;
  isMainHome: boolean;
}

export interface ResidentialEnergyCredit {
  improvements: ResidentialEnergyImprovement[];
  totalQualifiedExpenditures: number;
}

export interface EducationExpenses {
  studentName: string;
  ssn: string;
  institution: string;
  tuitionAndFees: number;
  isFirstFourYears: boolean;
}

// Calculated Values
export interface TaxCalculation {
  totalIncome: number;
  adjustments: number;
  agi: number;
  standardOrItemizedDeduction: number;
  qbiDeduction: number;
  taxableIncome: number;
  regularTax: number;
  amt: number;
  totalTaxBeforeCredits: number;
  totalCredits: number;
  totalTaxAfterCredits: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  niitTax: number;
  totalTax: number;
  federalTaxWithheld: number;
  estimatedTaxPayments: number;
  refundOrAmountOwed: number;
}

// Complete Tax Return
export interface TaxReturn {
  personalInfo: PersonalInfo;
  dependents: Dependent[];
  w2Income: W2Income[];
  interest: Interest1099INT[];
  dividends: Dividend1099DIV[];
  capitalGains: CapitalGainTransaction[];
  selfEmployment?: SelfEmploymentIncome;
  form1099NEC: Form1099NEC[];
  form1099K: Form1099K[];
  form1099MISC: Form1099MISC[];
  form1099OID: Form1099OID[];
  form1099B: Form1099B[];
  form1099S: Form1099S[];
  form1099C: Form1099C[];
  form1099R: Form1099R[];
  socialSecurity: SocialSecurityBenefits[];
  rentalProperties: RentalProperty[];
  traditionalIRAContribution?: TraditionalIRAContribution;
  rothIRAContribution?: RothIRAContribution;
  form8606?: Form8606Data;
  hsaData?: HSAData;
  itemizedDeductions?: ItemizedDeductions;
  aboveTheLineDeductions: AboveTheLineDeductionsData;
  schedule1A?: Schedule1ADeductions;
  educationExpenses: EducationExpenses[];
  dependentCareExpenses?: DependentCareExpenses[];
  electricVehicleCredit?: ElectricVehicleCredit;
  residentialEnergyCredit?: ResidentialEnergyCredit;
  estimatedTaxPayments: number;
  taxCalculation?: TaxCalculation;
  // 401(k) contributions - extracted from W-2 Box 12 codes EE and H
  k401Contributions?: number;
}

// Step optionality metadata
export type StepRequirement = 'required' | 'optional';

export interface StepMeta {
  id: WizardStep;
  requirement: StepRequirement;
}

/** Steps that the user MUST complete before filing. All others are optional/skippable. */
export const STEP_META: StepMeta[] = [
  { id: 'personal-info',          requirement: 'required' },
  { id: 'dependents',             requirement: 'optional' },
  { id: 'income-w2',              requirement: 'optional' },
  { id: 'income-interest',        requirement: 'optional' },
  { id: 'income-dividends',      requirement: 'optional' },
  { id: 'income-capital-gains',   requirement: 'optional' },
  { id: 'income-self-employment', requirement: 'optional' },
  { id: 'income-1099-nec',       requirement: 'optional' },
  { id: 'income-1099-k',         requirement: 'optional' },
  { id: 'income-1099-r',         requirement: 'optional' },
  { id: 'income-social-security', requirement: 'optional' },
  { id: 'income-rental',          requirement: 'optional' },
  { id: 'retirement-accounts',    requirement: 'optional' },
  { id: 'above-the-line',        requirement: 'optional' },
  { id: 'deductions',             requirement: 'optional' },
  { id: 'deductions-schedule-1a', requirement: 'optional' },
  { id: 'credits',                requirement: 'optional' },
  { id: 'review',                 requirement: 'required' },
];

export function isStepOptional(step: WizardStep): boolean {
  const meta = STEP_META.find(m => m.id === step);
  return meta?.requirement === 'optional';
}

// Wizard Steps
export type WizardStep =
  | 'welcome'
  | 'personal-info'
  | 'dependents'
  | 'income-w2'
  | 'income-interest'
  | 'income-dividends'
  | 'income-capital-gains'
  | 'income-self-employment'
  | 'income-1099-nec'
  | 'income-1099-k'
  | 'income-1099-r'
  | 'income-social-security'
  | 'income-rental'
  | 'retirement-accounts'
  | 'above-the-line'
  | 'deductions'
  | 'deductions-schedule-1a'
  | 'credits'
  | 'review'
  | 'pdf-generation';
