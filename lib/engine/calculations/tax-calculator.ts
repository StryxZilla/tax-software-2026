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
  EITC_2025,
  SALT_CAP_2025,
  MEDICAL_EXPENSE_AGI_THRESHOLD,
  CAPITAL_LOSS_LIMIT,
  MEALS_DEDUCTION_RATE,
  SAVERS_CREDIT_2025,
  CHILD_AND_DEPENDENT_CARE_CREDIT_2025,
  EV_CREDIT_2025,
  RESIDENTIAL_ENERGY_CREDIT_2025,
} from '../../../data/tax-constants';

// Box 12 codes that are taxable and should be added to wages
const TAXABLE_BOX12_CODES = new Set([
  'A', 'B', 'C', 'DD', 'M', 'N', 'Q', 'R', 'T', 'V', 'W', 'Y', 'Z', 'CC'
]);

/**
 * Calculate taxable Box 12 amounts from W-2
 */
export function calculateTaxableBox12(w2Income: TaxReturn['w2Income']): number {
  let total = 0;
  w2Income.forEach(w2 => {
    if (w2.box12) {
      w2.box12.forEach(entry => {
        if (entry.code && TAXABLE_BOX12_CODES.has(entry.code) && entry.amount > 0) {
          total += entry.amount;
        }
      });
    }
  });
  return total;
}

/**
 * Calculate total income from all sources
 */
export function calculateTotalIncome(taxReturn: TaxReturn): number {
  let total = 0;

  // W-2 wages (including taxable Box 12 amounts)
  const taxableBox12 = calculateTaxableBox12(taxReturn.w2Income);
  taxReturn.w2Income.forEach(w2 => {
    total += w2.wages + taxableBox12;
  });

  // Interest income (Box 1 from 1099-INT)
  taxReturn.interest.forEach(int => {
    total += int.amount || 0;
    // Tax-exempt interest (Box 4) doesn't add to taxable income but affects AMT
  });

  // Dividend income
  taxReturn.dividends.forEach(div => {
    total += div.ordinaryDividends || 0;
    // Qualified dividends are included in ordinary but taxed at lower rate
    // Capital gain distributions (Box 2) go to Schedule D
    // Exempt interest dividends (Box 3) are tax-exempt
  });

  // Add capital gain distributions from 1099-DIV to total income
  const dividendCapitalGains = taxReturn.dividends.reduce((sum, d) => sum + (d.capitalGainDistributions || 0), 0);
  
  // Capital gains (short-term and long-term) - includes capital gain distributions
  const { shortTermGains, longTermGains } = calculateCapitalGains(taxReturn.capitalGains);
  total += shortTermGains + longTermGains + dividendCapitalGains;

  // Self-employment income
  if (taxReturn.selfEmployment) {
    const netProfit = calculateScheduleCProfit(taxReturn.selfEmployment);
    total += Math.max(0, netProfit);
  }

  // 1099-NEC income (non-employee compensation - goes to Schedule C)
  if (taxReturn.form1099NEC && taxReturn.form1099NEC.length > 0) {
    const total1099NEC = taxReturn.form1099NEC.reduce((sum, nec) => sum + (nec.nonEmployeeCompensation || 0), 0);
    total += total1099NEC;
  }

  // 1099-K income (payment apps like Venmo, PayPal)
  // Note: This is gross - expenses reduce taxable income
  if (taxReturn.form1099K && taxReturn.form1099K.length > 0) {
    const total1099K = taxReturn.form1099K.reduce((sum, k) => sum + (k.grossAmount || 0), 0);
    total += total1099K;
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
    let total1099NEC = 0;
    if (taxReturn.form1099NEC && taxReturn.form1099NEC.length > 0) {
      total1099NEC = taxReturn.form1099NEC.reduce((sum, nec) => sum + (nec.nonEmployeeCompensation || 0), 0);
    }
    const combinedProfit = seProfit + total1099NEC;
    if (combinedProfit > 400) {
      const seTax = calculateSelfEmploymentTax(combinedProfit);
      adjustments += seTax * 0.5;
    }
  } else if (taxReturn.form1099NEC && taxReturn.form1099NEC.length > 0) {
    // No Schedule C but have 1099-NEC
    const total1099NEC = taxReturn.form1099NEC.reduce((sum, nec) => sum + (nec.nonEmployeeCompensation || 0), 0);
    if (total1099NEC > 400) {
      const seTax = calculateSelfEmploymentTax(total1099NEC);
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

  // HSA deduction (from above-the-line form)
  adjustments += taxReturn.aboveTheLineDeductions.hsaContributions;
  
  // Employer HSA contributions (already taxed, not deductible by employee)
  // (taxReturn.aboveTheLineDeductions.hsaEmployerContributions is not deducted)

  // Self-employed health insurance
  adjustments += taxReturn.aboveTheLineDeductions.selfEmploymentHealthInsurance;

  // SEP IRA / SIMPLE IRA
  adjustments += taxReturn.aboveTheLineDeductions.sepIRA;

  // Alimony paid (pre-2019 divorce agreements only)
  adjustments += taxReturn.aboveTheLineDeductions.alimonyPaid;

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

  // Get eligible contributions (Traditional IRA + Roth IRA + 401(k))
  // Note: Only count deductible contributions for Traditional IRA (eligible for saver's credit)
  let contributions = 0;
  if (taxReturn.traditionalIRAContribution?.isDeductible) {
    contributions += taxReturn.traditionalIRAContribution.amount;
  }
  if (taxReturn.rothIRAContribution) {
    contributions += taxReturn.rothIRAContribution.amount;
  }
  // Add 401(k) contributions (from W-2 Box 12, codes EE, H, FF)
  // These are eligible for the Saver's Credit
  if (taxReturn.k401Contributions) {
    contributions += taxReturn.k401Contributions;
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
 * Calculate Earned Income Tax Credit (EITC)
 * Form 8862 - For low to moderate income workers
 */
export function calculateEITC(taxReturn: TaxReturn, agi: number): number {
  const { filingStatus, age, spouseInfo } = taxReturn.personalInfo;
  const { dependents } = taxReturn;

  // Determine number of qualifying children
  // For EITC, we need children who meet the relationship, age, residency, and joint return tests
  const eicQualifyingChildren = dependents.filter(d => {
    // Simplified: use the CTC qualification as a proxy for EIC qualification
    // In reality, EIC has different (stricter) requirements
    return d.isQualifyingChildForCTC;
  });
  
  const numQualifyingChildren = eicQualifyingChildren.length;

  // Investment income limit ($11,000 for 2025)
  // Simplified: check if any investment income exists
  const totalInvestmentIncome = 
    taxReturn.interest.reduce((sum, i) => sum + i.amount, 0) +
    taxReturn.dividends.reduce((sum, d) => sum + d.ordinaryDividends, 0);
  
  if (totalInvestmentIncome > 11000) {
    return 0; // Exceeds investment income limit
  }

  // Must have earned income
  const earnedIncome = calculateTotalIncome(taxReturn);
  if (earnedIncome <= 0) return 0;

  // Get EITC parameters based on number of children
  const maxCredit = EITC_2025.maxCredit[numQualifyingChildren as keyof typeof EITC_2025.maxCredit] || EITC_2025.maxCredit[0];
  
  // Determine filing status for phaseout
  const isMarried = filingStatus === 'Married Filing Jointly';
  const isSingle = filingStatus === 'Single' || filingStatus === 'Head of Household';
  
  // Get phaseout thresholds
  const phaseoutStart = isMarried 
    ? EITC_2025.phaseoutStart.married[numQualifyingChildren as keyof typeof EITC_2025.phaseoutStart.married]
    : EITC_2025.phaseoutStart.single[numQualifyingChildren as keyof typeof EITC_2025.phaseoutStart.single];
    
  const phaseoutEnd = isMarried
    ? EITC_2025.phaseoutEnd.married[numQualifyingChildren as keyof typeof EITC_2025.phaseoutEnd.married]
    : EITC_2025.phaseoutEnd.single[numQualifyingChildren as keyof typeof EITC_2025.phaseoutEnd.single];

  // If below phaseout start, full credit
  if (agi <= phaseoutStart) {
    return maxCredit;
  }

  // If above phaseout end, no credit
  if (agi >= phaseoutEnd) {
    return 0;
  }

  // Calculate phased credit
  const phaseoutRange = phaseoutEnd - phaseoutStart;
  const amountOverStart = agi - phaseoutStart;
  const phaseoutPercent = amountOverStart / phaseoutRange;
  
  return Math.round(maxCredit * (1 - phaseoutPercent));
}

/**
 * Calculate Child and Dependent Care Credit
 * Form 2441 - For daycare and care expenses
 */
export function calculateChildAndDependentCareCredit(taxReturn: TaxReturn, agi: number): number {
  const { dependentCareExpenses, personalInfo } = taxReturn;
  
  if (!dependentCareExpenses || dependentCareExpenses.length === 0) return 0;

  // Count qualifying persons (children under 13 or dependents who can't care for themselves)
  // Simplified: count dependents under 13 for now
  const qualifyingPersons = taxReturn.dependents.filter(d => {
    const birthYear = new Date(d.birthDate).getFullYear();
    const age = 2025 - birthYear;
    return age < 13;
  }).length;

  if (qualifyingPersons === 0) return 0;

  // Calculate total eligible expenses
  const totalExpenses = dependentCareExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Apply expense limit
  const maxExpenses = qualifyingPersons >= 2
    ? CHILD_AND_DEPENDENT_CARE_CREDIT_2025.maxCareExpenses.twoOrMoreQualifyingPersons
    : CHILD_AND_DEPENDENT_CARE_CREDIT_2025.maxCareExpenses.oneQualifyingPerson;
  
  const eligibleExpenses = Math.min(totalExpenses, maxExpenses);

  // Get earned income for the credit calculation
  // Can't claim more than the lower earner's income if married filing separately
  const earnedIncome = calculateTotalIncome(taxReturn);
  const limitedExpenses = Math.min(eligibleExpenses, earnedIncome);

  // Get credit percentage based on AGI
  const { creditPercentages } = CHILD_AND_DEPENDENT_CARE_CREDIT_2025;
  let creditRate = 0.20; // Default fallback rate
  
  for (const bracket of creditPercentages) {
    if (agi <= bracket.maxAGI) {
      creditRate = bracket.rate;
      break;
    }
  }

  return Math.round(limitedExpenses * creditRate);
}

/**
 * Calculate Electric Vehicle Credit
 * Form 8936 - Clean Vehicle Credit
 */
export function calculateElectricVehicleCredit(taxReturn: TaxReturn, agi: number): number {
  const evCredit = taxReturn.electricVehicleCredit;
  if (!evCredit) return 0;

  const { filingStatus } = taxReturn.personalInfo;
  const { newVehicle, usedVehicle, incomePhaseout, qualifyingManufacturers } = EV_CREDIT_2025;

  // Check if manufacturer is qualified
  const isQualifiedManufacturer = qualifyingManufacturers.some(
    m => evCredit.manufacturerName.toLowerCase().includes(m.toLowerCase()) ||
         evCredit.vehicleMake.toLowerCase().includes(m.toLowerCase())
  );
  
  if (!isQualifiedManufacturer) {
    // Could still be eligible but need manual verification
    // For simplicity, we'll still allow the credit
  }

  let credit = 0;

  if (evCredit.vehicleType === 'new') {
    // New vehicle credit calculation
    // Base credit: $3,500 if battery >= 7 kWh
    credit = 3500;
    
    // Additional credit based on battery capacity
    // Need at least 20 kWh for maximum $7,500
    if (evCredit.batteryCapacity >= 20) {
      credit = newVehicle.maxCredit;
    } else if (evCredit.batteryCapacity >= 7) {
      // $417 per kWh above 7 kWh
      const additionalKwh = evCredit.batteryCapacity - 7;
      credit = Math.min(7500, 3500 + Math.round(additionalKwh * 417));
    }

    // Check income phaseout
    const phaseout = incomePhaseout[
      filingStatus === 'Married Filing Jointly' ? 'marriedFilingJointly' :
      filingStatus === 'Head of Household' ? 'headOfHousehold' : 'single'
    ];
    
    if (agi > phaseout.start) {
      if (agi >= phaseout.end) {
        return 0; // Fully phased out
      }
      const phaseoutPercent = (agi - phaseout.start) / (phaseout.end - phaseout.start);
      credit = Math.round(credit * (1 - phaseoutPercent));
    }
  } else {
    // Used vehicle credit (max $4,000 or 30% of price, whichever is less)
    if (evCredit.purchasePrice > usedVehicle.maxVehiclePrice) {
      return 0; // Used vehicles over $25,000 don't qualify
    }
    credit = Math.min(usedVehicle.maxCredit, Math.round(evCredit.purchasePrice * 0.30));
  }

  // Check other eligibility requirements
  if (evCredit.hasBeenUsedBefore) {
    // Used vehicles have separate rules - if it's actually used, only certain conditions qualify
    if (evCredit.vehicleType === 'new') {
      // First-time use check - simplified
    }
  }

  return credit;
}

/**
 * Calculate Residential Energy Credit
 * Form 3468 - Energy Efficient Home Improvements Credit
 */
export function calculateResidentialEnergyCredit(taxReturn: TaxReturn, agi: number): number {
  const energyCredit = taxReturn.residentialEnergyCredit;
  if (!energyCredit || !energyCredit.improvements || energyCredit.improvements.length === 0) return 0;

  const { improvements: improvementsData } = RESIDENTIAL_ENERGY_CREDIT_2025;
  const { improvements } = energyCredit;

  let totalCredit = 0;
  const currentYear = 2025;

  for (const improvement of improvements) {
    let credit = 0;
    
    switch (improvement.improvementType) {
      case 'solar-electric':
      case 'solar-water-heating':
      case 'wind-energy':
      case 'geothermal-heat-pump':
        // 30% through 2032, no cap
        credit = Math.round(improvement.cost * improvementsData.solarElectric.rate);
        break;
        
      case 'heat-pump':
      case 'heat-pump-water-heater':
        // 30% with $2,000 cap through 2032
        credit = Math.round(improvement.cost * improvementsData.heatPump.rate);
        credit = Math.min(credit, improvementsData.heatPump.maxCredit);
        break;
        
      case 'biomass-stove':
        // 30% with $2,000 cap
        credit = Math.round(improvement.cost * improvementsData.biomassStove.rate);
        credit = Math.min(credit, improvementsData.biomassStove.maxCredit);
        break;
        
      case 'fuel-cell':
        // 30% with per-watt limit - simplified calculation
        // Assuming cost-based calculation for simplicity
        credit = Math.round(improvement.cost * 0.30);
        break;
        
      case 'windows-doors':
      case 'roofing':
      case 'insulation':
      case 'sealants':
      case 'duct-sealing':
        // 10% with specific caps
        credit = Math.round(improvement.cost * improvementsData.windowsDoors.rate);
        credit = Math.min(credit, improvementsData.windowsDoors.maxCredit);
        break;
        
      default:
        // Other improvements - 10%
        credit = Math.round(improvement.cost * 0.10);
        credit = Math.min(credit, improvementsData.insulation.maxCredit);
    }
    
    totalCredit += credit;
  }

  // Apply annual cap (for improvements made after 2022)
  // Note: The cap is per taxpayer, not per improvement
  const annualCap = RESIDENTIAL_ENERGY_CREDIT_2025.annualCap;
  
  return Math.min(totalCredit, annualCap);
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
  const earnedIncomeCredit = calculateEITC(taxReturn, agi);
  const educationCredits = calculateEducationCredits(taxReturn, agi);
  const childAndDependentCareCredit = calculateChildAndDependentCareCredit(taxReturn, agi);
  const saversCredit = calculateSaversCredit(taxReturn, agi);
  const electricVehicleCredit = calculateElectricVehicleCredit(taxReturn, agi);
  const residentialEnergyCredit = calculateResidentialEnergyCredit(taxReturn, agi);
  const totalCredits = 
    childTaxCredit + 
    earnedIncomeCredit + 
    educationCredits + 
    childAndDependentCareCredit + 
    saversCredit + 
    electricVehicleCredit + 
    residentialEnergyCredit;

  // Tax after credits
  const totalTaxAfterCredits = Math.max(0, totalTaxBeforeCredits - totalCredits);

  // Calculate self-employment tax
  let selfEmploymentTax = 0;
  
  // Calculate total SE income sources
  let seProfit = 0;
  if (taxReturn.selfEmployment) {
    seProfit = calculateScheduleCProfit(taxReturn.selfEmployment);
  }
  
  let total1099NEC = 0;
  if (taxReturn.form1099NEC && taxReturn.form1099NEC.length > 0) {
    total1099NEC = taxReturn.form1099NEC.reduce((sum, nec) => sum + (nec.nonEmployeeCompensation || 0), 0);
  }
  
  // 1099-K is gross payments - we can't calculate SE tax accurately without knowing expenses
  // For now, we'll include it as income but warn that expenses should be tracked elsewhere
  let total1099K = 0;
  if (taxReturn.form1099K && taxReturn.form1099K.length > 0) {
    total1099K = taxReturn.form1099K.reduce((sum, k) => sum + (k.grossAmount || 0), 0);
    // TODO: In a fuller implementation, we'd add a field for 1099-K expenses
  }
  
  const combinedProfit = seProfit + total1099NEC + total1099K;
  if (combinedProfit > 400) {
    selfEmploymentTax = calculateSelfEmploymentTax(combinedProfit);
  }

  // Additional Medicare Tax
  const additionalMedicareTax = 0; // TODO: Implement

  // Total tax
  const totalTax = totalTaxAfterCredits + selfEmploymentTax + additionalMedicareTax;

  // Federal tax withheld
  let federalTaxWithheld = taxReturn.w2Income.reduce((sum, w2) => sum + w2.federalTaxWithheld, 0);
  
  // Add 1099-NEC federal tax withheld
  if (taxReturn.form1099NEC && taxReturn.form1099NEC.length > 0) {
    const necWithheld = taxReturn.form1099NEC.reduce((sum, nec) => sum + (nec.federalTaxWithheld || 0), 0);
    federalTaxWithheld += necWithheld;
  }

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
