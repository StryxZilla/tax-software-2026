// Core Tax Calculation Engine for 2025

import { TaxReturn, TaxCalculation, FilingStatus } from '../../../types/tax-types';
import {
  TAX_BRACKETS_2025,
  STANDARD_DEDUCTION_2025,
  ADDITIONAL_STANDARD_DEDUCTION_2025,
  SELF_EMPLOYMENT_TAX_2025,
  AMT_2025,
  CHILD_TAX_CREDIT_2025,
  EDUCATION_CREDITS_2025,
  SALT_CAP_2025,
  MEDICAL_EXPENSE_AGI_THRESHOLD,
  CAPITAL_LOSS_LIMIT,
  MEALS_DEDUCTION_RATE,
  SAVERS_CREDIT_2025,
} from '../../../data/tax-constants';

/**
 * Calculate total income from all sources
 */
export function calculateTotalIncome(taxReturn: TaxReturn): number {
  let total = 0;

  // W-2 wages
  taxReturn.w2Income.forEach(w2 => {
    total += w2.wages;
  });

  // Interest income
  taxReturn.interest.forEach(int => {
    total += int.amount;
  });

  // Dividend income
  taxReturn.dividends.forEach(div => {
    total += div.ordinaryDividends;
  });

  // Capital gains (short-term and long-term)
  const { shortTermGains, longTermGains } = calculateCapitalGains(taxReturn.capitalGains);
  total += shortTermGains + longTermGains;

  // Self-employment income
  if (taxReturn.selfEmployment) {
    const netProfit = calculateScheduleCProfit(taxReturn.selfEmployment);
    total += Math.max(0, netProfit);
  }

  // Rental income
  taxReturn.rentalProperties.forEach(rental => {
    const netRentalIncome = calculateRentalIncome(rental);
    total += netRentalIncome;
  });

  return Math.round(total);
}

/**
 * Calculate above-the-line deductions (adjustments to income)
 */
export function calculateAdjustments(taxReturn: TaxReturn): number {
  let adjustments = 0;

  // Self-employment tax deduction (50% of SE tax)
  if (taxReturn.selfEmployment) {
    const seProfit = calculateScheduleCProfit(taxReturn.selfEmployment);
    if (seProfit > 400) {
      const seTax = calculateSelfEmploymentTax(seProfit);
      adjustments += seTax * 0.5;
    }
  }

  // HSA deduction
  if (taxReturn.hsaData) {
    adjustments += taxReturn.hsaData.contributions;
  }

  // Traditional IRA deduction
  if (taxReturn.traditionalIRAContribution?.isDeductible) {
    adjustments += taxReturn.traditionalIRAContribution.amount;
  }

  // Student loan interest
  adjustments += taxReturn.aboveTheLineDeductions.studentLoanInterest;

  // Educator expenses
  adjustments += taxReturn.aboveTheLineDeductions.educatorExpenses;

  return Math.round(adjustments);
}

/**
 * Calculate AGI (Adjusted Gross Income)
 */
export function calculateAGI(taxReturn: TaxReturn): number {
  const totalIncome = calculateTotalIncome(taxReturn);
  const adjustments = calculateAdjustments(taxReturn);
  return Math.max(0, totalIncome - adjustments);
}

/**
 * Calculate standard deduction
 */
export function calculateStandardDeduction(taxReturn: TaxReturn): number {
  const { filingStatus, age, isBlind, spouseInfo } = taxReturn.personalInfo;
  let deduction = STANDARD_DEDUCTION_2025[filingStatus];

  // Additional deduction for age 65+ or blind
  const isMarried = filingStatus === 'Married Filing Jointly' || filingStatus === 'Married Filing Separately';
  const additionalAmount = isMarried ? ADDITIONAL_STANDARD_DEDUCTION_2025.married : ADDITIONAL_STANDARD_DEDUCTION_2025.singleOrHOH;

  if (age >= 65) deduction += additionalAmount;
  if (isBlind) deduction += additionalAmount;

  if (spouseInfo) {
    if (spouseInfo.age >= 65) deduction += additionalAmount;
    if (spouseInfo.isBlind) deduction += additionalAmount;
  }

  return deduction;
}

/**
 * Calculate itemized deductions
 */
export function calculateItemizedDeductions(taxReturn: TaxReturn, agi: number): number {
  if (!taxReturn.itemizedDeductions) return 0;

  let total = 0;
  const itemized = taxReturn.itemizedDeductions;

  // Medical expenses (only amount over 7.5% of AGI)
  const medicalThreshold = agi * MEDICAL_EXPENSE_AGI_THRESHOLD;
  total += Math.max(0, itemized.medicalExpenses - medicalThreshold);

  // State and local taxes (SALT cap of $10,000)
  const saltTotal = itemized.stateTaxesPaid + itemized.localTaxesPaid + itemized.realEstateTaxes + itemized.personalPropertyTaxes;
  total += Math.min(saltTotal, SALT_CAP_2025);

  // Mortgage interest
  total += itemized.homeMortgageInterest;

  // Charitable contributions
  total += itemized.charitableCash + itemized.charitableNonCash;

  // Other itemized deductions
  total += itemized.otherDeductions;

  return Math.round(total);
}

/**
 * Determine whether to use standard or itemized deduction
 */
export function calculateDeduction(taxReturn: TaxReturn, agi: number): { amount: number; isItemized: boolean } {
  const standardDeduction = calculateStandardDeduction(taxReturn);
  const itemizedDeduction = calculateItemizedDeductions(taxReturn, agi);

  if (itemizedDeduction > standardDeduction) {
    return { amount: itemizedDeduction, isItemized: true };
  } else {
    return { amount: standardDeduction, isItemized: false };
  }
}

/**
 * Calculate taxable income
 */
export function calculateTaxableIncome(taxReturn: TaxReturn): number {
  const agi = calculateAGI(taxReturn);
  const { amount: deduction } = calculateDeduction(taxReturn, agi);
  return Math.max(0, agi - deduction);
}

/**
 * Calculate regular income tax using tax brackets
 */
export function calculateRegularTax(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = TAX_BRACKETS_2025[filingStatus];
  let tax = 0;
  let previousMax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= previousMax) break;

    const bracketMax = bracket.max ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, bracketMax) - previousMax;
    
    if (amountInBracket > 0) {
      tax += amountInBracket * bracket.rate;
    }

    previousMax = bracketMax;
    if (bracket.max === null || taxableIncome <= bracket.max) break;
  }

  return Math.round(tax);
}

/**
 * Calculate Alternative Minimum Tax (AMT)
 */
export function calculateAMT(taxReturn: TaxReturn, agi: number, regularTax: number): number {
  const { filingStatus } = taxReturn.personalInfo;
  
  // AMT income calculation
  let amtIncome = agi;
  
  // Add back certain deductions
  if (taxReturn.itemizedDeductions) {
    const saltTotal = Math.min(
      taxReturn.itemizedDeductions.stateTaxesPaid + 
      taxReturn.itemizedDeductions.localTaxesPaid + 
      taxReturn.itemizedDeductions.realEstateTaxes,
      SALT_CAP_2025
    );
    amtIncome += saltTotal; // Add back SALT deduction for AMT
  }

  // Get AMT exemption
  let exemption = AMT_2025.exemption[
    filingStatus === 'Married Filing Jointly' || filingStatus === 'Qualifying Surviving Spouse' 
      ? 'marriedFilingJointly' 
      : filingStatus === 'Married Filing Separately'
      ? 'marriedFilingSeparately'
      : 'single'
  ];

  // Phase out exemption
  const phaseoutThreshold = AMT_2025.phaseoutThreshold[
    filingStatus === 'Married Filing Jointly' || filingStatus === 'Qualifying Surviving Spouse'
      ? 'marriedFilingJointly'
      : 'single'
  ];

  if (amtIncome > phaseoutThreshold) {
    const phaseoutAmount = (amtIncome - phaseoutThreshold) * AMT_2025.phaseoutRate;
    exemption = Math.max(0, exemption - phaseoutAmount);
  }

  // Calculate AMT taxable income
  const amtTaxableIncome = Math.max(0, amtIncome - exemption);

  // Calculate AMT
  let amt = 0;
  if (amtTaxableIncome <= AMT_2025.rate1Threshold) {
    amt = amtTaxableIncome * AMT_2025.rate1;
  } else {
    amt = AMT_2025.rate1Threshold * AMT_2025.rate1;
    amt += (amtTaxableIncome - AMT_2025.rate1Threshold) * AMT_2025.rate2;
  }

  // AMT is the excess over regular tax
  return Math.max(0, Math.round(amt - regularTax));
}

/**
 * Calculate capital gains and losses
 */
export function calculateCapitalGains(transactions: Array<{
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  isLongTerm: boolean;
}>): { shortTermGains: number; longTermGains: number } {
  let shortTermGains = 0;
  let longTermGains = 0;

  transactions.forEach(txn => {
    const gain = txn.proceeds - txn.costBasis;
    if (txn.isLongTerm) {
      longTermGains += gain;
    } else {
      shortTermGains += gain;
    }
  });

  // Apply capital loss limit (max $3,000 net loss against ordinary income)
  const totalGains = shortTermGains + longTermGains;
  if (totalGains < -CAPITAL_LOSS_LIMIT) {
    // Bring combined net loss up to exactly -$3,000 while preserving existing gain/loss signs.
    // Reduce long-term loss first, then short-term loss if needed.
    let adjustmentNeeded = -CAPITAL_LOSS_LIMIT - totalGains; // positive amount to add back

    if (longTermGains < 0 && adjustmentNeeded > 0) {
      const adjustment = Math.min(adjustmentNeeded, -longTermGains);
      longTermGains += adjustment;
      adjustmentNeeded -= adjustment;
    }

    if (shortTermGains < 0 && adjustmentNeeded > 0) {
      const adjustment = Math.min(adjustmentNeeded, -shortTermGains);
      shortTermGains += adjustment;
      adjustmentNeeded -= adjustment;
    }
  }

  return { shortTermGains, longTermGains };
}

/**
 * Calculate Schedule C profit
 */
export function calculateScheduleCProfit(selfEmployment: any): number {
  const { grossReceipts, returns, costOfGoodsSold, expenses } = selfEmployment;
  const grossIncome = grossReceipts - returns - costOfGoodsSold;
  
  let totalExpenses = 0;
  Object.values(expenses).forEach((expense: any) => {
    totalExpenses += expense;
  });

  // Meals are only 50% deductible
  totalExpenses -= expenses.mealsAndEntertainment * (1 - MEALS_DEDUCTION_RATE);

  return grossIncome - totalExpenses;
}

/**
 * Calculate self-employment tax
 */
export function calculateSelfEmploymentTax(netProfit: number): number {
  if (netProfit <= 400) return 0;

  const { socialSecurityRate, medicareRate, socialSecurityWageLimit } = SELF_EMPLOYMENT_TAX_2025;
  
  // 92.35% of net profit is subject to SE tax
  const seTaxableIncome = netProfit * 0.9235;

  // Social Security tax (capped)
  const ssTax = Math.min(seTaxableIncome, socialSecurityWageLimit) * socialSecurityRate;

  // Medicare tax (no cap)
  const medicareTax = seTaxableIncome * medicareRate;

  return Math.round(ssTax + medicareTax);
}

/**
 * Calculate rental income
 */
export function calculateRentalIncome(rental: any): number {
  const { rentalIncome, expenses } = rental;
  
  let totalExpenses = 0;
  Object.values(expenses).forEach((expense: any) => {
    totalExpenses += expense;
  });

  return rentalIncome - totalExpenses;
}

/**
 * Calculate Child Tax Credit
 */
export function calculateChildTaxCredit(taxReturn: TaxReturn, agi: number): number {
  const qualifyingChildren = taxReturn.dependents.filter(d => d.isQualifyingChildForCTC);
  if (qualifyingChildren.length === 0) return 0;

  const { creditPerChild, phaseoutThreshold, phaseoutRate } = CHILD_TAX_CREDIT_2025;
  const filingStatus = taxReturn.personalInfo.filingStatus;

  const threshold = phaseoutThreshold[
    filingStatus === 'Married Filing Jointly' ? 'marriedFilingJointly' :
    filingStatus === 'Married Filing Separately' ? 'marriedFilingSeparately' :
    filingStatus === 'Head of Household' ? 'headOfHousehold' : 'single'
  ];

  let credit = qualifyingChildren.length * creditPerChild;

  // Apply phaseout
  if (agi > threshold) {
    const phaseoutAmount = Math.ceil((agi - threshold) / 1000) * phaseoutRate;
    credit = Math.max(0, credit - phaseoutAmount);
  }

  return credit;
}

/**
 * Calculate education credits
 */
export function calculateEducationCredits(taxReturn: TaxReturn, agi: number): number {
  const { educationExpenses, personalInfo } = taxReturn;
  if (!educationExpenses || educationExpenses.length === 0) return 0;

  let totalCredit = 0;
  const { americanOpportunity, lifetimeLearning } = EDUCATION_CREDITS_2025;
  const isMarried = personalInfo.filingStatus === 'Married Filing Jointly';

  // American Opportunity Credit (first 4 years of college)
  educationExpenses.filter(e => e.isFirstFourYears).forEach(expense => {
    const baseCredit = Math.min(2000, expense.tuitionAndFees) + Math.min(500, (expense.tuitionAndFees - 2000) * 0.25);
    const phaseoutStart = isMarried ? americanOpportunity.phaseoutStart.marriedFilingJointly : americanOpportunity.phaseoutStart.single;
    const phaseoutEnd = isMarried ? americanOpportunity.phaseoutEnd.marriedFilingJointly : americanOpportunity.phaseoutEnd.single;

    if (agi < phaseoutStart) {
      totalCredit += Math.min(americanOpportunity.maxCredit, baseCredit);
    } else if (agi < phaseoutEnd) {
      const phaseoutPercent = (phaseoutEnd - agi) / (phaseoutEnd - phaseoutStart);
      totalCredit += Math.min(americanOpportunity.maxCredit, baseCredit) * phaseoutPercent;
    }
  });

  // Lifetime Learning Credit (all years of education)
  const lifetimeLearningExpenses = educationExpenses.filter(e => !e.isFirstFourYears);
  if (lifetimeLearningExpenses.length > 0) {
    const totalExpenses = lifetimeLearningExpenses.reduce((sum, e) => sum + e.tuitionAndFees, 0);
    const baseCredit = Math.min(10000, totalExpenses) * 0.20;
    const phaseoutStart = isMarried ? lifetimeLearning.phaseoutStart.marriedFilingJointly : lifetimeLearning.phaseoutStart.single;
    const phaseoutEnd = isMarried ? lifetimeLearning.phaseoutEnd.marriedFilingJointly : lifetimeLearning.phaseoutEnd.single;

    if (agi < phaseoutStart) {
      totalCredit += Math.min(lifetimeLearning.maxCredit, baseCredit);
    } else if (agi < phaseoutEnd) {
      const phaseoutPercent = (phaseoutEnd - agi) / (phaseoutEnd - phaseoutStart);
      totalCredit += Math.min(lifetimeLearning.maxCredit, baseCredit) * phaseoutPercent;
    }
  }

  return Math.round(totalCredit);
}

/**
 * Calculate Saver's Credit (Retirement Savings Contributions Credit)
 * Form 8880 — based on eligible retirement contributions and AGI
 */
export function calculateSaversCredit(taxReturn: TaxReturn, agi: number): number {
  const { filingStatus } = taxReturn.personalInfo;

  // Must be 18+, not a student, not claimed as dependent (simplified: use age >= 18)
  if (taxReturn.personalInfo.age < 18) return 0;

  // Get eligible contributions (Traditional IRA + Roth IRA)
  let contributions = 0;
  if (taxReturn.traditionalIRAContribution) {
    contributions += taxReturn.traditionalIRAContribution.amount;
  }
  if (taxReturn.rothIRAContribution) {
    contributions += taxReturn.rothIRAContribution.amount;
  }

  if (contributions <= 0) return 0;

  // Cap contributions per person
  const isMarried = filingStatus === 'Married Filing Jointly';
  const maxContribution = isMarried
    ? SAVERS_CREDIT_2025.maxContribution * 2
    : SAVERS_CREDIT_2025.maxContribution;
  const eligibleContributions = Math.min(contributions, maxContribution);

  // Find credit rate based on AGI
  const brackets = SAVERS_CREDIT_2025.brackets[filingStatus];
  if (!brackets) return 0;

  let rate = 0;
  for (const bracket of brackets) {
    if (agi <= bracket.maxAGI) {
      rate = bracket.rate;
      break;
    }
  }

  if (rate === 0) return 0;

  return Math.round(eligibleContributions * rate);
}

/**
 * Main function to calculate complete tax return
 */
import { calculationCache } from './calculation-cache';

export function calculateTaxReturn(taxReturn: TaxReturn): TaxCalculation {
  // Try to get cached results
  const cacheKey = calculationCache.getKey(taxReturn);
  const cached = calculationCache.get(cacheKey);

  // Start with cached values or calculate from scratch
  const totalIncome = cached?.totalIncome ?? calculateTotalIncome(taxReturn);
  const adjustments = cached?.adjustments ?? calculateAdjustments(taxReturn);
  const agi = cached?.agi ?? calculateAGI(taxReturn);
  const { amount: deduction } = cached?.standardDeduction ? 
    { amount: cached.standardDeduction } : 
    calculateDeduction(taxReturn, agi);

  // Cache intermediate results
  calculationCache.set(cacheKey, {
    totalIncome,
    adjustments,
    agi,
    standardDeduction: deduction
  });

  // Calculate taxable income
  const taxableIncome = calculateTaxableIncome(taxReturn);

  // Calculate regular tax
  const regularTax = calculateRegularTax(taxableIncome, taxReturn.personalInfo.filingStatus);

  // Calculate AMT
  const amt = calculateAMT(taxReturn, agi, regularTax);

  // Total tax before credits
  const totalTaxBeforeCredits = regularTax + amt;

  // Calculate credits
  const childTaxCredit = calculateChildTaxCredit(taxReturn, agi);
  const educationCredits = calculateEducationCredits(taxReturn, agi);
  const saversCredit = calculateSaversCredit(taxReturn, agi);
  const totalCredits = childTaxCredit + educationCredits + saversCredit;

  // Tax after credits
  const totalTaxAfterCredits = Math.max(0, totalTaxBeforeCredits - totalCredits);

  // Calculate self-employment tax
  let selfEmploymentTax = 0;
  if (taxReturn.selfEmployment) {
    const seProfit = calculateScheduleCProfit(taxReturn.selfEmployment);
    if (seProfit > 400) {
      selfEmploymentTax = calculateSelfEmploymentTax(seProfit);
    }
  }

  // Additional Medicare Tax
  const additionalMedicareTax = 0; // TODO: Implement

  // Total tax
  const totalTax = totalTaxAfterCredits + selfEmploymentTax + additionalMedicareTax;

  // Federal tax withheld
  const federalTaxWithheld = taxReturn.w2Income.reduce((sum, w2) => sum + w2.federalTaxWithheld, 0);

  // Estimated tax payments
  const estimatedTaxPayments = taxReturn.estimatedTaxPayments || 0;

  // Refund or amount owed
  const refundOrAmountOwed = federalTaxWithheld + estimatedTaxPayments - totalTax;

  return {
    totalIncome,
    adjustments,
    agi,
    standardOrItemizedDeduction: deduction,
    qbiDeduction: 0, // TODO: Implement QBI deduction
    taxableIncome,
    regularTax,
    amt,
    totalTaxBeforeCredits,
    totalCredits,
    totalTaxAfterCredits,
    selfEmploymentTax,
    additionalMedicareTax,
    totalTax,
    federalTaxWithheld,
    estimatedTaxPayments,
    refundOrAmountOwed,
  };
}
