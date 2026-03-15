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
  box12: W2IncomeBox12[];  // Other compensation (codes DD, G, L, R, W, etc.)
}

export interface Interest1099INT {
  payer: string;
  amount: number;
}

export interface Dividend1099DIV {
  payer: string;
  ordinaryDividends: number;
  qualifiedDividends: number;
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

export interface AboveTheLineDeductions {
  educatorExpenses: number;
  studentLoanInterest: number;
  hsaDeduction: number;
  movingExpenses: number;
  selfEmploymentTaxDeduction: number;
  selfEmployedHealthInsurance: number;
  sepIRA: number;
  alimonyPaid: number;
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
  rentalProperties: RentalProperty[];
  traditionalIRAContribution?: TraditionalIRAContribution;
  rothIRAContribution?: RothIRAContribution;
  form8606?: Form8606Data;
  hsaData?: HSAData;
  itemizedDeductions?: ItemizedDeductions;
  aboveTheLineDeductions: AboveTheLineDeductions;
  educationExpenses: EducationExpenses[];
  dependentCareExpenses: DependentCareExpenses[];
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
  { id: 'income-capital-gains',   requirement: 'optional' },
  { id: 'income-self-employment', requirement: 'optional' },
  { id: 'income-rental',          requirement: 'optional' },
  { id: 'retirement-accounts',    requirement: 'optional' },
  { id: 'deductions',             requirement: 'optional' },
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
  | 'income-rental'
  | 'retirement-accounts'
  | 'deductions'
  | 'credits'
  | 'review'
  | 'pdf-generation';
