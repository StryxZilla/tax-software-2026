// Form 8606: Nondeductible IRAs (Mega Backdoor Roth Calculations)

import { Form8606Data } from '../../../types/tax-types';

export interface Form8606Calculation {
  // Part I: Nondeductible Contributions to Traditional IRAs
  line1_nondeductibleContributions: number;
  line2_totalBasisPriorYears: number;
  line3_totalBasis: number;
  line4_conversions: number;
  line5_distributions: number;
  line6_totalConversionsAndDistributions: number;
  line7_endOfYearIRABalance: number;
  line8_totalIRABalancePlusDistributions: number;
  line9_basisPercentage: number;

  // Part II: Conversions from Traditional to Roth IRA
  line16_amountConverted: number;
  line17_nontaxablePortion: number;
  line18_taxablePortion: number;

  // Basis tracking for next year
  remainingBasis: number;
}

/**
 * Calculate Form 8606 (Nondeductible IRA Contributions and Roth Conversions)
 * 
 * This is critical for mega backdoor Roth strategies where:
 * 1. Make after-tax 401(k) contributions
 * 2. Convert to Roth 401(k) or roll to Roth IRA
 * 3. Track basis to avoid double taxation
 */
export function calculateForm8606(data: Form8606Data): Form8606Calculation {
  const asNonNegativeFinite = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    return Math.max(0, value);
  };

  // Normalize potentially partial/legacy persisted data so calculations never produce NaN.
  const normalized = {
    nondeductibleContributions: asNonNegativeFinite(data.nondeductibleContributions),
    priorYearBasis: asNonNegativeFinite(data.priorYearBasis),
    conversionsToRoth: asNonNegativeFinite(data.conversionsToRoth),
    distributionsFromTraditionalIRA: asNonNegativeFinite((data as Partial<Form8606Data>).distributionsFromTraditionalIRA),
    endOfYearTraditionalIRABalance: asNonNegativeFinite(data.endOfYearTraditionalIRABalance),
  };

  // Line 1: Nondeductible contributions for current year
  const line1 = normalized.nondeductibleContributions;

  // Line 2: Total basis in traditional IRAs from prior years
  const line2 = normalized.priorYearBasis;

  // Line 3: Add lines 1 and 2
  const line3 = line1 + line2;

  // Line 4: Enter conversions to Roth IRA
  const line4 = normalized.conversionsToRoth;

  // Line 5: Enter distributions from traditional IRAs (excluding conversions)
  const line5 = normalized.distributionsFromTraditionalIRA;

  // Line 6: Add lines 4 and 5
  const line6 = line4 + line5;

  // Line 7: Enter value of all traditional IRAs as of December 31 of current year
  const line7 = normalized.endOfYearTraditionalIRABalance;

  // Line 8: Add lines 6 and 7 (IRS Form 8606 instruction: "Add lines 6 and 7")
  // Do NOT add line1 here — the current-year contribution is already reflected in
  // either line7 (if still held at year-end) or line4/5 (if converted/distributed).
  // Adding it again would double-count and produce an artificially low basis %.
  const line8 = line6 + line7;

  // Line 9: Divide line 3 by line 8 (basis percentage using pro-rata rule)
  // This is the percentage of your IRA that is after-tax (nontaxable)
  const line9 = line8 > 0 ? Math.min(1, line3 / line8) : 0;

  // Part II: Conversions from Traditional to Roth IRA

  // Line 16: Amount converted to Roth IRA (same as line 4)
  const line16 = line4;

  // Line 17: Nontaxable portion of conversion
  // Apply pro-rata rule: conversion amount × basis percentage
  const line17 = Math.round(line16 * line9);

  // Line 18: Taxable portion of conversion
  // This is the amount that will be added to taxable income
  const line18 = line16 - line17;

  // Calculate remaining basis for next year
  // This is the basis that wasn't used up in conversions/distributions
  const basisUsed = line6 * line9;
  const remainingBasis = Math.max(0, line3 - basisUsed);

  return {
    line1_nondeductibleContributions: line1,
    line2_totalBasisPriorYears: line2,
    line3_totalBasis: line3,
    line4_conversions: line4,
    line5_distributions: line5,
    line6_totalConversionsAndDistributions: line6,
    line7_endOfYearIRABalance: line7,
    line8_totalIRABalancePlusDistributions: line8,
    line9_basisPercentage: line9,
    line16_amountConverted: line16,
    line17_nontaxablePortion: line17,
    line18_taxablePortion: line18,
    remainingBasis: Math.round(remainingBasis),
  };
}

/**
 * Mega Backdoor Roth scenario helper
 * 
 * Example scenario:
 * - You have $100,000 in a traditional IRA (all from rollover of pre-tax contributions)
 * - You make $7,000 after-tax contribution to traditional IRA
 * - You immediately convert $7,000 to Roth IRA
 * - Pro-rata rule applies: taxable portion = $7,000 × ($100,000 / $107,000) = $6,542
 * - Only $458 is nontaxable
 * 
 * To avoid this, you'd want to have $0 in traditional IRAs before doing the conversion
 * (move all pre-tax money to 401(k) first if employer allows)
 */
export function validateMegaBackdoorRoth(data: Form8606Data): {
  isClean: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check if there's existing traditional IRA balance
  if (data.endOfYearTraditionalIRABalance > 0 && data.conversionsToRoth > 0) {
    warnings.push(
      `You have $${data.endOfYearTraditionalIRABalance.toLocaleString()} in traditional IRAs. ` +
      `Due to the pro-rata rule, only part of your Roth conversion will be tax-free.`
    );
    
    recommendations.push(
      'Consider rolling your traditional IRA into your 401(k) (if your employer allows) ' +
      'before doing Roth conversions to avoid pro-rata taxation.'
    );
  }

  // Check if conversion happened immediately after contribution
  const calculation = calculateForm8606(data);
  if (calculation.line18_taxablePortion > 0 && data.conversionsToRoth === data.nondeductibleContributions) {
    warnings.push(
      `Even though you converted immediately after contributing, ` +
      `$${calculation.line18_taxablePortion.toLocaleString()} of your conversion is taxable ` +
      `due to existing traditional IRA balances.`
    );
  }

  // Perfect scenario: $0 traditional IRA balance, immediate conversion
  const isClean = data.endOfYearTraditionalIRABalance === 0 && 
                  calculation.line18_taxablePortion === 0;

  if (isClean) {
    recommendations.push(
      'Perfect execution! Your entire Roth conversion is tax-free because you had ' +
      'no existing traditional IRA balance.'
    );
  }

  return {
    isClean,
    warnings,
    recommendations,
  };
}

/**
 * Calculate optimal conversion strategy
 * 
 * Given a goal conversion amount and existing IRA balances,
 * determine how much will be taxable
 */
export function calculateConversionStrategy(
  goalConversionAmount: number,
  existingTraditionalIRABalance: number,
  existingBasis: number,
  newContribution: number
): {
  taxableAmount: number;
  nontaxableAmount: number;
  effectiveTaxRate: number;
  recommendation: string;
} {
  const data: Form8606Data = {
    nondeductibleContributions: newContribution,
    priorYearBasis: existingBasis,
    conversionsToRoth: goalConversionAmount,
    endOfYearTraditionalIRABalance: existingTraditionalIRABalance,
    distributionsFromTraditionalIRA: 0,
  };

  const calc = calculateForm8606(data);
  const effectiveTaxRate = goalConversionAmount > 0 
    ? calc.line18_taxablePortion / goalConversionAmount 
    : 0;

  let recommendation = '';
  if (effectiveTaxRate === 0) {
    recommendation = '✅ Optimal! Entire conversion is tax-free.';
  } else if (effectiveTaxRate < 0.1) {
    recommendation = '✅ Good! Less than 10% of conversion is taxable.';
  } else if (effectiveTaxRate < 0.5) {
    recommendation = '⚠️ Moderate. Consider reducing traditional IRA balance first.';
  } else {
    recommendation = '❌ Not optimal. Most of conversion is taxable due to pro-rata rule. ' +
                    'Strongly consider rolling traditional IRA to 401(k) first.';
  }

  return {
    taxableAmount: calc.line18_taxablePortion,
    nontaxableAmount: calc.line17_nontaxablePortion,
    effectiveTaxRate,
    recommendation,
  };
}
