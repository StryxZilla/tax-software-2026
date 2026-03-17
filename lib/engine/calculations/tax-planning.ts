// Tax Planning Analysis Module
// Provides retirement optimization and tax rate analysis insights

import { TaxReturn, FilingStatus, Form8606Data } from '../../../types/tax-types';
import { TAX_BRACKETS_2025 } from '../../../data/tax-constants';

// 401(k) Box 12 codes that represent employee elective deferrals
const K401_BOX12_CODES = new Set(['EE', 'H']);

/**
 * Retirement Analysis Interface
 */
export interface RetirementAnalysis {
  '401kOptimization': {
    currentContributions: number;
    annualLimit: number;
    percentUsed: number;
    leftOnTable: number;
    recommendation: string;
  };
  backdoorRoth: {
    eligible: boolean;
    reason: string;
    recommendation: string;
    didBackdoor: boolean;
  };
}

/**
 * Tax Rate Analysis Interface
 */
export interface TaxRateAnalysis {
  effectiveRate: number;
  effectiveRatePercent: number;
  marginalRate: number;
  marginalRatePercent: number;
  breakdown: string;
}

/**
 * Extract 401(k) contributions from W-2 Box 12 codes
 * EE = 401(k) employee contributions
 * H = SIMPLE 401(k) employee contributions
 */
export function extract401kContributions(taxReturn: TaxReturn): number {
  // If explicitly set, use that value
  if (taxReturn.k401Contributions !== undefined) {
    return taxReturn.k401Contributions;
  }

  // Otherwise extract from W-2 Box 12
  let total401k = 0;
  taxReturn.w2Income.forEach(w2 => {
    if (w2.box12) {
      w2.box12.forEach(entry => {
        if (entry.code && K401_BOX12_CODES.has(entry.code) && entry.amount > 0) {
          total401k += entry.amount;
        }
      });
    }
  });

  return total401k;
}

/**
 * Get 401(k) annual contribution limit based on age
 * 2025 limits: $23,500 under 50, $31,000 for 50+
 */
export function get401kLimit(age: number): number {
  return age >= 50 ? 31000 : 23500;
}

/**
 * Determine if filer is married for tax purposes
 */
function isMarried(filingStatus: FilingStatus): boolean {
  return filingStatus === 'Married Filing Jointly' || 
         filingStatus === 'Married Filing Separately';
}

/**
 * Calculate Backdoor Roth eligibility
 * Phase-out starts at $150k (single) / $236k (married)
 * Complete phase-out at $165k (single) / $246k (married)
 */
export function calculateBackdoorRothEligibility(
  agi: number, 
  filingStatus: FilingStatus,
  form8606?: Form8606Data
): {
  eligible: boolean;
  reason: string;
  recommendation: string;
  didBackdoor: boolean;
} {
  const singlePhaseoutStart = 150000;
  const singlePhaseoutEnd = 165000;
  const marriedPhaseoutStart = 236000;
  const marriedPhaseoutEnd = 246000;

  const isSingle = !isMarried(filingStatus);
  const phaseoutStart = isSingle ? singlePhaseoutStart : marriedPhaseoutStart;
  const phaseoutEnd = isSingle ? singlePhaseoutEnd : marriedPhaseoutEnd;

  // Check if user actually did a backdoor Roth (nondeductible contribution + conversion)
  const didBackdoor = !!(form8606 && (
    (form8606.nondeductibleContributions > 0 && form8606.conversionsToRoth > 0) ||
    form8606.conversionsToRoth > 0
  ));

  // If they did a backdoor, acknowledge it
  if (didBackdoor) {
    return {
      eligible: false,
      reason: `You completed a backdoor Roth conversion of $${form8606!.conversionsToRoth.toLocaleString()} this year.`,
      recommendation: "Your conversion has been processed. Remember: the taxable portion is calculated using the pro-rata rule based on your total IRA balances.",
      didBackdoor: true
    };
  }

  // Already eligible (below phase-out)
  if (agi < phaseoutStart) {
    return {
      eligible: true,
      reason: `Your AGI ($${agi.toLocaleString()}) is below the Roth IRA income limit ($${phaseoutStart.toLocaleString()}).`,
      recommendation: "You can make a direct Roth IRA contribution up to $7,000 ($8,000 if age 50+).",
      didBackdoor: false
    };
  }

  // In phase-out range
  if (agi < phaseoutEnd) {
    const phaseoutPercent = ((agi - phaseoutStart) / (phaseoutEnd - phaseoutStart)) * 100;
    const reducedLimit = Math.round(7000 * (1 - phaseoutPercent / 100));
    
    return {
      eligible: true,
      reason: `Your AGI ($${agi.toLocaleString()}) is in the partial phase-out range (${
        isSingle ? '$150,000-$165,000' : '$236,000-$246,000'
      }). Your maximum contribution is approximately $${reducedLimit.toLocaleString()}.`,
      recommendation: `Consider the backdoor Roth IRA strategy to contribute the full $7,000. You'll need to make a non-deductible Traditional IRA contribution and convert to Roth.`,
      didBackdoor: false
    };
  }

  // Above phase-out - not eligible for direct contribution
  return {
    eligible: false,
    reason: `Your AGI ($${agi.toLocaleString()}) exceeds the Roth IRA income limit (${
      isSingle ? '$165,000 (single)' : '$246,000 (married)'
    }).`,
    recommendation: "Use the backdoor Roth IRA strategy: contribute to a non-deductible Traditional IRA and convert to Roth. Be aware of the pro-rata rule if you have other pre-tax IRA balances. Consider rolling existing Traditional IRA funds into a 401(k) to optimize this strategy.",
    didBackdoor: false
  };
}

/**
 * Calculate complete retirement analysis
 * Includes 401(k) optimization and Backdoor Roth eligibility
 */
export function calculateRetirementAnalysis(taxReturn: TaxReturn, agi: number): RetirementAnalysis {
  const { personalInfo } = taxReturn;
  const filingStatus = personalInfo.filingStatus;
  const age = personalInfo.age;
  const currentContributions = extract401kContributions(taxReturn);
  const annualLimit = get401kLimit(age);
  const percentUsed = annualLimit > 0 ? (currentContributions / annualLimit) * 100 : 0;
  const leftOnTable = Math.max(0, annualLimit - currentContributions);

  // 401k recommendation
  let recommendation401k: string;
  if (percentUsed >= 100) {
    recommendation401k = "You're maxing out your 401(k)! Consider adding HSA contributions if eligible.";
  } else if (percentUsed >= 75) {
    recommendation401k = `You're contributing well. Consider increasing to get $${Math.min(500, leftOnTable).toLocaleString()} more in before-tax savings.`;
  } else if (percentUsed >= 50) {
    recommendation401k = `You're halfway there. Increasing contributions could save approximately $${Math.round(leftOnTable * 0.22).toLocaleString()} in taxes at your marginal rate.`;
  } else if (percentUsed > 0) {
    recommendation401k = `Consider increasing 401(k) contributions to at least get the full employer match. You're leaving $${leftOnTable.toLocaleString()} of pre-tax savings on the table.`;
  } else {
    recommendation401k = "You're not contributing to a 401(k). If your employer offers a match, prioritize getting at least that much to maximize free money.";
  }

  // Backdoor Roth analysis
  const backdoorRoth = calculateBackdoorRothEligibility(agi, filingStatus, taxReturn.form8606);

  return {
    '401kOptimization': {
      currentContributions,
      annualLimit,
      percentUsed: Math.round(percentUsed * 10) / 10,
      leftOnTable,
      recommendation: recommendation401k,
    },
    backdoorRoth,
  };
}

/**
 * Get the top marginal tax bracket for a filing status
 */
export function getMarginalBracket(filingStatus: FilingStatus): { rate: number; ratePercent: number } {
  const brackets = TAX_BRACKETS_2025[filingStatus];
  // The last bracket has rate 0.37 (37%)
  const topBracket = brackets[brackets.length - 1];
  return {
    rate: topBracket.rate,
    ratePercent: Math.round(topBracket.rate * 100),
  };
}

/**
 * Calculate effective vs marginal tax rate analysis
 */
export function calculateTaxRateAnalysis(taxCalculation: {
  totalIncome: number;
  totalTax: number;
  taxableIncome: number;
}, filingStatus: FilingStatus): TaxRateAnalysis {
  const { totalIncome, totalTax, taxableIncome } = taxCalculation;

  // Effective rate = total tax / total income
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;
  const effectiveRatePercent = Math.round(effectiveRate * 1000) / 10; // Round to 1 decimal

  // Marginal rate = top bracket rate
  const marginalBracket = getMarginalBracket(filingStatus);
  const marginalRatePercent = marginalBracket.ratePercent;

  // Build breakdown string
  const breakdown = `Your effective tax rate (${effectiveRatePercent}%) is the actual percentage of your total income that goes to federal taxes. Your marginal rate (${marginalRatePercent}%) is the rate on your next dollar of income. The difference is significant because deductions and progressive brackets lower your effective rate.`;

  return {
    effectiveRate,
    effectiveRatePercent,
    marginalRate: marginalBracket.rate,
    marginalRatePercent,
    breakdown,
  };
}

/**
 * Main function to calculate all tax planning insights
 */
export interface TaxPlanningInsights {
  retirement: RetirementAnalysis;
  taxRates: TaxRateAnalysis;
  underwithholding?: {
    hasUnderwithholding: boolean;
    totalWithholding: number;
    nonW2Income: number;
    message: string;
  };
}

export function calculateTaxPlanningInsights(taxReturn: TaxReturn, taxCalculation: {
  agi: number;
  totalIncome: number;
  totalTax: number;
  taxableIncome: number;
}): TaxPlanningInsights | null {
  if (!taxReturn || !taxCalculation) {
    return null;
  }

  // Get personal info - handle both direct and nested structure
  const personalInfo = taxReturn.personalInfo;
  if (!personalInfo) {
    return null;
  }

  const filingStatus = personalInfo.filingStatus;
  const age = personalInfo.age;
  const agi = taxCalculation.agi;

  // Calculate retirement analysis
  // We need to pass a properly structured object with personalInfo
  const retirementData = {
    personalInfo: { filingStatus, age },
    w2Income: taxReturn.w2Income,
    k401Contributions: taxReturn.k401Contributions,
  } as TaxReturn;
  
  // Create a simple personalInfo object for the function
  const simplePersonalInfo = { 
    personalInfo: taxReturn.personalInfo,
    filingStatus: taxReturn.personalInfo.filingStatus
  };

  // Fix: pass correct parameters
  const retirement = calculateRetirementAnalysisInternal(
    taxReturn,
    agi
  );

  // Calculate tax rate analysis
  const taxRates = calculateTaxRateAnalysis(
    {
      totalIncome: taxCalculation.totalIncome,
      totalTax: taxCalculation.totalTax,
      taxableIncome: taxCalculation.taxableIncome,
    },
    filingStatus
  );

  return {
    retirement,
    taxRates,
    underwithholding: calculateUnderwithholding(taxReturn, taxCalculation),
  };
}

/**
 * Calculate underwithholding insight
 * Identifies if user has income without automatic withholding
 */
function calculateUnderwithholding(taxReturn: TaxReturn, taxCalculation: { agi: number; totalTax: number; }): { hasUnderwithholding: boolean; totalWithholding: number; nonW2Income: number; message: string } {
  // Calculate W-2 withholding
  const w2Withholding = (taxReturn.w2Income || []).reduce((sum, w2) => sum + (w2.federalTaxWithheld || 0), 0);
  
  // Calculate non-W-2 income (income that typically doesn't have withholding)
  const interestIncome = (taxReturn.interest || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  const dividendIncome = (taxReturn.dividends || []).reduce((sum, d) => sum + (d.ordinaryDividends || 0), 0);
  const capitalGains = (taxReturn.capitalGains || []).reduce((sum, cg) => sum + ((cg.proceeds || 0) - (cg.costBasis || 0)), 0);
  const selfEmploymentIncome = taxReturn.selfEmployment ? 
    ((taxReturn.selfEmployment.grossReceipts || 0) - (taxReturn.selfEmployment.returns || 0)) : 0;
  const necIncome = (taxReturn.form1099NEC || []).reduce((sum, n) => sum + (n.nonEmployeeCompensation || 0), 0);
  
  const nonW2Income = Math.max(0, interestIncome + dividendIncome + capitalGains + selfEmploymentIncome + necIncome);
  
  // If user has significant non-W-2 income but little withholding
  const hasUnderwithholding = nonW2Income > 10000 && w2Withholding < (taxCalculation.totalTax * 0.8);
  
  let message = '';
  if (hasUnderwithholding) {
    message = `You have $${nonW2Income.toLocaleString()} in non-W-2 income (interest, dividends, self-employment) but only $${w2Withholding.toLocaleString()} in withholding. Consider making quarterly estimated tax payments to avoid penalties.`;
  }
  
  return {
    hasUnderwithholding,
    totalWithholding: w2Withholding,
    nonW2Income,
    message,
  };
}

/**
 * Internal function to calculate retirement analysis with correct types
 */
function calculateRetirementAnalysisInternal(taxReturn: TaxReturn, agi: number): RetirementAnalysis {
  const { personalInfo } = taxReturn;
  const filingStatus = personalInfo.filingStatus;
  const age = personalInfo.age;
  
  const currentContributions = extract401kContributions(taxReturn);
  const annualLimit = get401kLimit(age);
  const percentUsed = annualLimit > 0 ? (currentContributions / annualLimit) * 100 : 0;
  const leftOnTable = Math.max(0, annualLimit - currentContributions);

  // 401k recommendation
  let recommendation401k: string;
  if (percentUsed >= 100) {
    recommendation401k = "You're maxing out your 401(k)! Consider adding HSA contributions if eligible.";
  } else if (percentUsed >= 75) {
    recommendation401k = `You're contributing well. Consider increasing to get $${Math.min(500, leftOnTable).toLocaleString()} more in before-tax savings.`;
  } else if (percentUsed >= 50) {
    recommendation401k = `You're halfway there. Increasing contributions could save approximately $${Math.round(leftOnTable * 0.22).toLocaleString()} in taxes at your marginal rate.`;
  } else if (percentUsed > 0) {
    recommendation401k = `Consider increasing 401(k) contributions to at least get the full employer match. You're leaving $${leftOnTable.toLocaleString()} of pre-tax savings on the table.`;
  } else {
    recommendation401k = "You're not contributing to a 401(k). If your employer offers a match, prioritize getting at least that much to maximize free money.";
  }

  // Backdoor Roth analysis
  const backdoorRoth = calculateBackdoorRothEligibility(agi, filingStatus, taxReturn.form8606);

  return {
    '401kOptimization': {
      currentContributions,
      annualLimit,
      percentUsed: Math.round(percentUsed * 10) / 10,
      leftOnTable,
      recommendation: recommendation401k,
    },
    backdoorRoth,
  };
}
