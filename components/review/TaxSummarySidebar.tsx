'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTaxReturn } from '@/lib/context/TaxReturnContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Percent, Loader2, Clock, AlertTriangle, CheckCircle, Info, Briefcase, PiggyBank, Calculator, RefreshCcw, ArrowRight, Sliders } from 'lucide-react';
import { TAX_BRACKETS_2025, IRA_LIMITS_2025 } from '../../data/tax-constants';
import { 
  calculateRetirementAnalysis, 
  calculateTaxRateAnalysis,
  calculateTaxPlanningInsights 
} from '@/lib/engine/calculations/tax-planning';

// 2025 401(k) Contribution Limits
const K401_LIMIT_2025 = 23500;
const K401_CATCHUP_2025 = 31000;

// What-if calculation result types
interface WhatIfResult {
  taxSavings: number;
  newTaxableIncome: number;
  newTotalTax: number;
  newEffectiveRate: number;
  netCost: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

const RADIAN = Math.PI / 180;

/** Format a pie-chart slice label text. Exported for testing. */
export function formatPieLabel({ payload, percent }: { payload?: { name?: string }; percent?: number }): string {
  const label = payload?.name || 'Other';
  return `${label}: ${((percent || 0) * 100).toFixed(0)}%`;
}

/**
 * Custom rendered label for pie slices.
 * Renders percentage INSIDE the slice to avoid clipping/overlap.
 * Full names are shown via the Legend component instead.
 */
export function renderInnerPieLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number; percent?: number;
}) {
  if (!percent || percent < 0.05 || cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function TaxSummarySidebar() {
  const { taxCalculation, taxReturn, isCalculating, lastSaved } = useTaxReturn();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) return JSON.parse(saved);

    // Mobile default: collapsed so primary form actions remain tappable.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return true;

    return false;
  });
  
  // Expandable section states
  const [isTaxBreakdownExpanded, setIsTaxBreakdownExpanded] = useState(false);
  const [isDeductionsExpanded, setIsDeductionsExpanded] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true); // Insights default expanded

  // What-if scenario state
  const [whatIf401k, setWhatIf401k] = useState<number | null>(null);
  const [whatIfIRA, setWhatIfIRA] = useState<number | null>(null);
  const [whatIfEstimatedTax, setWhatIfEstimatedTax] = useState<number | null>(null);

  // Get current 401k contributions from W-2 data
  const current401k = useMemo(() => {
    return preTax401k;
  }, [preTax401k]);

  // Check if self-employed
  const isSelfEmployed = useMemo(() => {
    return taxReturn.selfEmployment && taxReturn.selfEmployment.grossReceipts > 0;
  }, [taxReturn.selfEmployment]);

  // Check for backdoor Roth IRA (if they've done a conversion, traditional IRA deduction may be limited)
  const hasBackdoorRoth = useMemo(() => {
    const form8606 = taxReturn.form8606;
    return form8606 && form8606.conversionsToRoth > 0;
  }, [taxReturn.form8606]);

  // Check if user has traditional IRA with non-deductible contributions (affects backdoor)
  const hasNondeductibleTraditionalIRA = useMemo(() => {
    const form8606 = taxReturn.form8606;
    return form8606 && form8606.nondeductibleContributions > 0;
  }, [taxReturn.form8606]);

  // Calculate total 401k contributions (pre-tax + after-tax + employer match)
  const { preTax401k, afterTax401k, employerMatch, total401k } = useMemo(() => {
    let preTax = 0;
    let afterTax = 0;
    let match = 0;

    // Get pre-tax and after-tax from W-2 Box 12
    taxReturn.w2Income?.forEach(w2 => {
      w2.box12?.forEach(box => {
        // Pre-tax 401k/403b deferrals: D, F, H, E
        if (['D', 'E', 'F', 'H'].includes(box.code)) {
          preTax += box.amount || 0;
        }
        // After-tax contributions: G
        if (box.code === 'G') {
          afterTax += box.amount || 0;
        }
        // Employer match: typically not reported in Box 12, but check for W (Roth match)
        if (box.code === 'W') {
          // This is Roth employer match - counts toward limit but is already taxed
          match += box.amount || 0;
        }
      });
    });

    // Also include k401Contributions if set (may be from manual entry)
    const k401Manual = taxReturn.k401Contributions ?? 0;
    if (k401Manual > 0 && preTax === 0) {
      // Only use if no box12 data found
      preTax = k401Manual;
    }

    return {
      preTax401k: preTax,
      afterTax401k: afterTax,
      employerMatch: match,
      total401k: preTax + afterTax + match
    };
  }, [taxReturn.w2Income, taxReturn.k401Contributions]);

  // 2025 limits
  const K401_TOTAL_LIMIT_2025 = 69500; // Employee + employer combined (after-tax allowed up to this)
  
  // Check if 401k limit exceeded
  const is401kOverLimit = total401k > (taxReturn.personalInfo?.age ?? 35 >= 50 ? K401_CATCHUP_2025 : K401_LIMIT_2025);
  const is401kOverTotalLimit = total401k > K401_TOTAL_LIMIT_2025;

  // Calculate remaining 401k contribution room (employee-only limit)
  const remaining401kRoom = useMemo(() => {
    const age = taxReturn.personalInfo?.age ?? 35;
    const limit = age >= 50 ? K401_CATCHUP_2025 : K401_LIMIT_2025;
    return Math.max(0, limit - preTax401k);
  }, [preTax401k, taxReturn.personalInfo?.age]);

  // Max 401k slider value (current + remaining room)
  const max401kSlider = useMemo(() => {
    const age = taxReturn.personalInfo?.age ?? 35;
    return age >= 50 ? K401_CATCHUP_2025 : K401_LIMIT_2025;
  }, [taxReturn.personalInfo?.age]);

  // Calculate what-if impact for 401k contributions
  const calculate401kImpact = useCallback((additionalContribution: number): WhatIfResult | null => {
    if (!taxCalculation) return null;
    
    const currentTaxable = taxCalculation.taxableIncome;
    const newTaxable = Math.max(0, currentTaxable - additionalContribution);
    
    // Simplified tax calculation - apply marginal rate to the deduction
    const marginalRate = taxCalculation.taxableIncome > 0 
      ? taxCalculation.totalTax / taxCalculation.taxableIncome 
      : 0.22;
    
    const taxSavings = additionalContribution * marginalRate;
    const netCost = additionalContribution - taxSavings;
    
    return {
      taxSavings,
      newTaxableIncome: newTaxable,
      newTotalTax: taxCalculation.totalTax - taxSavings,
      newEffectiveRate: newTaxable > 0 ? ((taxCalculation.totalTax - taxSavings) / newTaxable) * 100 : 0,
      netCost,
    };
  }, [taxCalculation]);

  // Calculate what-if impact for IRA contributions (Traditional vs Roth comparison)
  const calculateIRAImpact = useCallback((contribution: number): WhatIfResult | null => {
    if (!taxCalculation) return null;
    
    const currentTaxable = taxCalculation.taxableIncome;
    const newTaxable = Math.max(0, currentTaxable - contribution);
    
    // For Traditional: reduces taxable income
    // For Roth: no deduction but tax-free growth
    // Show the tax savings from Traditional deduction
    const marginalRate = taxCalculation.taxableIncome > 0 
      ? taxCalculation.totalTax / taxCalculation.taxableIncome 
      : 0.22;
    
    const taxSavings = contribution * marginalRate;
    const netCost = contribution - taxSavings;
    
    return {
      taxSavings,
      newTaxableIncome: newTaxable,
      newTotalTax: taxCalculation.totalTax - taxSavings,
      newEffectiveRate: newTaxable > 0 ? ((taxCalculation.totalTax - taxSavings) / newTaxable) * 100 : 0,
      netCost,
    };
  }, [taxCalculation]);

  // Calculate what-if impact for estimated tax payments
  const calculateEstimatedTaxImpact = useCallback((additionalPayment: number): WhatIfResult | null => {
    if (!taxCalculation) return null;
    
    // Additional estimated tax payments directly reduce amount owed / increase refund
    const currentOwed = taxCalculation.refundOrAmountOwed;
    const newOwed = currentOwed - additionalPayment; // Negative = more refund
    
    return {
      taxSavings: 0, // Not a deduction, just a payment
      newTaxableIncome: taxCalculation.taxableIncome,
      newTotalTax: taxCalculation.totalTax,
      newEffectiveRate: taxCalculation.taxableIncome > 0 ? (taxCalculation.totalTax / taxCalculation.taxableIncome) * 100 : 0,
      netCost: additionalPayment, // What you actually pay
    };
  }, [taxCalculation]);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000); // seconds
    
    if (diff < 10) return 'Saved just now';
    if (diff < 60) return `Saved ${diff}s ago`;
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    return `Saved ${Math.floor(diff / 3600)}h ago`;
  };

  const filingStatus = taxReturn.personalInfo.filingStatus;

  const applicableBrackets = useMemo(() => {
    return TAX_BRACKETS_2025[filingStatus];
  }, [filingStatus]);

  const taxableIncome = taxCalculation?.taxableIncome ?? 0;

  const bracketBreakdown = useMemo(() => {
    if (!taxCalculation) return [];

    return applicableBrackets.map(bracket => {
      const bracketMax = bracket.max ?? Infinity;
      const incomeInBracket = Math.max(
        0,
        Math.min(taxableIncome, bracketMax) - bracket.min
      );
      const taxInBracket = incomeInBracket * bracket.rate;

      return {
        bracket: `${Math.round(bracket.rate * 100)}%`,
        income: incomeInBracket,
        tax: taxInBracket,
      };
    }).filter(b => b.income > 0);
  }, [applicableBrackets, taxableIncome, taxCalculation]);

  const effectiveRate = useMemo(() => {
    if (!taxCalculation || taxableIncome <= 0) return 0;
    return (taxCalculation.regularTax / taxableIncome) * 100;
  }, [taxCalculation, taxableIncome]);

  const marginalRate = useMemo(() => {
    if (!taxCalculation) return 37;

    const marginalBracket = applicableBrackets.find(b => {
      const bracketMax = b.max ?? Infinity;
      return taxableIncome >= b.min && taxableIncome < bracketMax;
    });

    return marginalBracket ? Math.round(marginalBracket.rate * 100) : 37;
  }, [applicableBrackets, taxCalculation, taxableIncome]);

  const incomeSources = useMemo(() => {
    const sources: Array<{ name: string; value: number }> = [];

    const totalW2 = taxReturn.w2Income.reduce((sum, w2) => sum + w2.wages, 0);
    const totalInterest = taxReturn.interest.reduce((sum, int) => sum + int.amount, 0);
    const totalDividends = taxReturn.dividends.reduce((sum, div) => sum + div.ordinaryDividends, 0);
    const totalCapitalGains = taxReturn.capitalGains.reduce((sum, cg) => sum + (cg.proceeds - cg.costBasis), 0);
    const selfEmploymentIncome = taxReturn.selfEmployment ? (
      taxReturn.selfEmployment.grossReceipts -
      taxReturn.selfEmployment.returns -
      taxReturn.selfEmployment.costOfGoodsSold
    ) : 0;

    if (totalW2 > 0) sources.push({ name: 'W-2 Wages', value: totalW2 });
    if (totalInterest > 0) sources.push({ name: 'Interest', value: totalInterest });
    if (totalDividends > 0) sources.push({ name: 'Dividends', value: totalDividends });
    if (totalCapitalGains > 0) sources.push({ name: 'Capital Gains', value: totalCapitalGains });
    if (selfEmploymentIncome > 0) sources.push({ name: 'Self-Employment', value: selfEmploymentIncome });

    return sources;
  }, [taxReturn]);

  const isRefund = (taxCalculation?.refundOrAmountOwed ?? 0) > 0;

  // Calculate completion percentage based on filled sections
  const completionPercentage = useMemo(() => {
    if (!taxReturn) return 0;
    
    let filled = 0;
    let total = 0;

    // Personal Info (4 fields)
    total += 4;
    if (taxReturn.personalInfo.firstName) filled++;
    if (taxReturn.personalInfo.lastName) filled++;
    if (taxReturn.personalInfo.ssn) filled++;
    if (taxReturn.personalInfo.filingStatus) filled++;

    // W-2 Income
    total += 1;
    if (taxReturn.w2Income.length > 0 && taxReturn.w2Income.some(w2 => w2.wages > 0)) filled++;

    // Filing Status determines additional requirements
    if (taxReturn.personalInfo.filingStatus === 'Married Filing Jointly' || 
        taxReturn.personalInfo.filingStatus === 'Married Filing Separately') {
      total += 1; // Spouse info
      if (taxReturn.personalInfo.spouseInfo?.firstName) filled++;
    }

    return Math.round((filled / total) * 100);
  }, [taxReturn]);

  // Tax Planning Insights
  const taxPlanningInsights = useMemo(() => {
    if (!taxReturn || !taxCalculation) return null;
    return calculateTaxPlanningInsights(taxReturn, {
      agi: taxCalculation.agi,
      totalIncome: taxCalculation.totalIncome,
      totalTax: taxCalculation.totalTax,
      taxableIncome: taxCalculation.taxableIncome,
    });
  }, [taxReturn, taxCalculation]);

  // Deductions data
  const deductionsData = useMemo(() => {
    if (!taxCalculation) return null;
    
    const standardDeduction = taxCalculation.standardOrItemizedDeduction || 0;
    const itemizedDeductions = taxCalculation.itemizedDeductions || 0;
    const isStandard = standardDeduction > itemizedDeductions;
    
    // Above-the-line deductions
    const aboveTheLine = Math.max(0, 
      (taxCalculation.traditionalIraDeduction || 0) +
      (taxCalculation.studentLoanInterest || 0) +
      (taxCalculation.hsaDeduction || 0) +
      (taxCalculation.selfEmploymentDeduction || 0)
    );

    return {
      standardDeduction,
      itemizedDeductions,
      isStandard,
      aboveTheLine,
      totalDeduction: isStandard ? standardDeduction : itemizedDeductions,
    };
  }, [taxCalculation]);

  // Credits data
  const creditsData = useMemo(() => {
    if (!taxCalculation || !taxReturn) return null;
    
    const credits: Array<{ name: string; amount: number }> = [];
    
    // Child Tax Credit (simplified - would need dependent data)
    if ((taxReturn.dependents?.length || 0) > 0) {
      const childTaxCredit = taxCalculation.childTaxCredit || 0;
      if (childTaxCredit > 0) {
        credits.push({ name: 'Child Tax Credit', amount: childTaxCredit });
      }
    }
    
    // EITC
    if ((taxCalculation.earnedIncomeCredit || 0) > 0) {
      credits.push({ name: 'Earned Income Tax Credit', amount: taxCalculation.earnedIncomeCredit });
    }
    
    // Education credits
    if ((taxCalculation.educationCredits || 0) > 0) {
      credits.push({ name: 'Education Credits', amount: taxCalculation.educationCredits });
    }
    
    // Other common credits (simplified)
    if ((taxCalculation.otherCredits || 0) > 0) {
      credits.push({ name: 'Other Credits', amount: taxCalculation.otherCredits });
    }

    return {
      credits,
      totalCredits: credits.reduce((sum, c) => sum + c.amount, 0),
    };
  }, [taxCalculation, taxReturn]);

  // Check AMT status
  const hasAMT = (taxCalculation?.amt ?? 0) > 0;

  // Check EITC eligibility (simplified check - AGI within range, has dependents, no EITC in credits)
  const eitcEligible = useMemo(() => {
    if (!taxCalculation) return false;
    const agi = taxCalculation.agi;
    const hasDependents = (taxReturn.dependents?.length ?? 0) > 0;
    // Simplified EITC range check - actual EITC calculation is complex
    // Based on 2025 EITC thresholds: $17,730 - $64,430 for 1-3+ children
    const maxAgi = hasDependents ? 64430 : 22000;
    const minAgi = hasDependents ? 1000 : 1;
    
    // Only show if they have dependents and income in range (crude proxy for potential eligibility)
    // In production, this would use a proper EITC calculator
    return hasDependents && agi >= minAgi && agi <= maxAgi;
  }, [taxCalculation, taxReturn]);

  // Warning messages
  const warnings = useMemo(() => {
    const msgs: Array<{ type: 'amt' | 'eitc' | 'medicare'; message: string; details: string }> = [];
    
    if (hasAMT) {
      msgs.push({
        type: 'amt',
        message: 'Alternative Minimum Tax (AMT) may apply',
        details: `You have $${taxCalculation?.amt?.toLocaleString() ?? 0} in AMT calculations. This is a parallel tax system that limits some deductions.`
      });
    }

    if ((taxCalculation?.additionalMedicareTax ?? 0) > 0) {
      msgs.push({
        type: 'medicare',
        message: 'Additional Medicare Tax applies',
        details: `You owe $${taxCalculation?.additionalMedicareTax?.toLocaleString() ?? 0} in Additional Medicare Tax on income above $200,000.`
      });
    }

    if (eitcEligible) {
      msgs.push({
        type: 'eitc',
        message: 'You may qualify for EITC',
        details: 'Based on your income and dependents, you may be eligible for the Earned Income Tax Credit. Consider reviewing your eligibility.'
      });
    }

    return msgs;
  }, [hasAMT, taxCalculation, eitcEligible]);

  if (isCalculating) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-xl rounded-2xl p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Tax Summary</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Calculating...</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded-md w-3/4 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-slate-200 rounded-md"></div>
              <div className="h-12 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-40 bg-slate-200 rounded-md"></div>
          </div>
          <p className="text-center text-slate-500 text-sm mt-4">
            Please wait while we process your tax information...
          </p>
        </div>
      </div>
    );
  }

  if (!taxCalculation) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-xl rounded-2xl p-8 border border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <DollarSign className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Tax Summary</h2>
        </div>
        <div className="bg-white rounded-lg p-6 text-center">
          <p className="text-slate-500">Fill out your tax information to see live calculations.</p>
        </div>
        {lastSaved && (
          <div className="mt-3 flex items-center justify-center text-xs text-slate-500">
            <Clock className="w-3 h-3 mr-1" />
            {getLastSavedText()}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar - Sticky */}
      <div className="hidden lg:block sticky top-4 h-fit">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-7 h-7" />
              <h2 className="text-2xl font-bold">Tax Summary</h2>
            </div>
            <p className="text-blue-100 text-sm mt-1">Live calculation</p>
          </div>

          {/* Progress Header */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completion</span>
              <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Warning Banners */}
          {warnings.length > 0 && (
            <div className="px-6 pt-4 space-y-2">
              {warnings.map((warning, idx) => (
                <div 
                  key={idx}
                  className={`rounded-lg p-3 border ${
                    warning.type === 'amt' 
                      ? 'bg-amber-50 border-amber-200' 
                      : warning.type === 'eitc'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      warning.type === 'amt' 
                        ? 'text-amber-600' 
                        : warning.type === 'eitc'
                          ? 'text-blue-600'
                          : 'text-orange-600'
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{warning.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{warning.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Income</div>
                <div className="text-2xl font-bold text-slate-900 currency">
                  ${taxCalculation.totalIncome.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Adjusted Gross Income</div>
                <div className="text-2xl font-bold text-slate-900 currency">
                  ${taxCalculation.agi.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Taxable Income</div>
                <div className="text-2xl font-bold text-slate-900 currency">
                  ${taxCalculation.taxableIncome.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Tax</div>
                <div className="text-2xl font-bold text-slate-900 currency">
                  ${taxCalculation.totalTax.toLocaleString()}
                </div>
              </div>

              {/* QBI Deduction - NEW */}
              {(taxCalculation.qbiDeduction ?? 0) > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">QBI Deduction</div>
                    <Info className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 currency">
                    ${taxCalculation.qbiDeduction.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Additional Medicare Tax - NEW */}
              {(taxCalculation.additionalMedicareTax ?? 0) > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Additional Medicare Tax</div>
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600 currency">
                    ${taxCalculation.additionalMedicareTax.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Refund/Owed - Highlighted */}
              <div className={`
                rounded-xl p-5 shadow-lg border-2
                ${isRefund 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                }
              `}>
                <div className="flex items-center space-x-2 mb-2">
                  {isRefund ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    {isRefund ? 'Expected Refund' : 'Amount Owed'}
                  </div>
                </div>
                <div className={`text-4xl font-bold number-emphasis ${isRefund ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(taxCalculation.refundOrAmountOwed).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tax Rates */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 mb-4">
                <Percent className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tax Rates</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Effective Rate</span>
                  <span className="text-lg font-bold text-blue-600">{effectiveRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Marginal Rate</span>
                  <span className="text-lg font-bold text-blue-600">{marginalRate}%</span>
                </div>
              </div>
            </div>

            {/* Tax Bracket Breakdown */}
            {bracketBreakdown.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Tax by Bracket</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={bracketBreakdown}>
                    <XAxis 
                      dataKey="bracket" 
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip 
                      formatter={(value) => `$${(value || 0).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="tax" 
                      fill="url(#colorGradient)" 
                      radius={[6, 6, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#1e40af" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Income Sources Pie Chart */}
            {incomeSources.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Income Sources</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={incomeSources}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={renderInnerPieLabel}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${(value || 0).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tax Planning Insights - NEW */}
            {taxPlanningInsights && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 shadow-sm border border-emerald-200">
                <button 
                  onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tax Planning Insights</h3>
                  </div>
                  {isInsightsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {isInsightsExpanded && (
                  <div className="mt-4 space-y-4">
                    {/* 401k Optimization */}
                    {taxPlanningInsights.retirement401k && (
                      <div className="bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-start space-x-2">
                          <PiggyBank className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">401(k) Optimization</p>
                            <p className="text-xs text-slate-600 mt-1">{taxPlanningInsights.retirement401k.message}</p>
                            {taxPlanningInsights.retirement401k.potentialSavings && (
                              <p className="text-xs font-bold text-green-600 mt-1">
                                Potential savings: ${taxPlanningInsights.retirement401k.potentialSavings.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Roth Analysis */}
                    {taxPlanningInsights.rothVsTraditional && (
                      <div className="bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-start space-x-2">
                          <Calculator className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Roth vs Traditional</p>
                            <p className="text-xs text-slate-600 mt-1">{taxPlanningInsights.rothVsTraditional.message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tax Rate Analysis */}
                    {taxPlanningInsights.taxRateAnalysis && (
                      <div className="bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Tax Rate Analysis</p>
                            <p className="text-xs text-slate-600 mt-1">{taxPlanningInsights.taxRateAnalysis.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Deductions Expandable - NEW */}
            {deductionsData && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <button 
                  onClick={() => setIsDeductionsExpanded(!isDeductionsExpanded)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Deductions</h3>
                  </div>
                  {isDeductionsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {!isDeductionsExpanded && (
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold">{deductionsData.isStandard ? 'Standard' : 'Itemized'}: </span>
                    ${deductionsData.totalDeduction.toLocaleString()}
                  </div>
                )}

                {isDeductionsExpanded && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Standard Deduction</span>
                      <span className="text-sm font-semibold text-slate-700">${deductionsData.standardDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Itemized Deductions</span>
                      <span className="text-sm font-semibold text-slate-700">${deductionsData.itemizedDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Above-the-Line</span>
                      <span className="text-sm font-semibold text-slate-700">${deductionsData.aboveTheLine.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-amber-50 rounded-lg px-2 -mx-2">
                      <span className="text-sm font-semibold text-amber-800">Total Deduction</span>
                      <span className="text-sm font-bold text-amber-700">${deductionsData.totalDeduction.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Using {deductionsData.isStandard ? 'standard' : 'itemized'} deduction (${deductionsData.totalDeduction.toLocaleString()})
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credits Expandable - NEW */}
            {creditsData && creditsData.credits.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <button 
                  onClick={() => setIsTaxBreakdownExpanded(!isTaxBreakdownExpanded)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tax Credits</h3>
                  </div>
                  {isTaxBreakdownExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {!isTaxBreakdownExpanded && (
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold">Total Credits: </span>
                    <span className="text-green-600 font-bold">${creditsData.totalCredits.toLocaleString()}</span>
                  </div>
                )}

                {isTaxBreakdownExpanded && (
                  <div className="mt-4 space-y-3">
                    {creditsData.credits.map((credit, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">{credit.name}</span>
                        <span className="text-sm font-semibold text-green-600">${credit.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-2 -mx-2">
                      <span className="text-sm font-semibold text-green-800">Total Credits</span>
                      <span className="text-sm font-bold text-green-700">${creditsData.totalCredits.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* What-If Scenarios Section */}
            {taxCalculation && (
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-violet-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Sliders className="w-5 h-5 text-violet-600" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">What-If Scenarios</h3>
                </div>

                {/* 401k limit warnings */}
                {is401kOverLimit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-red-800">
                        <p className="font-semibold mb-1">401(k) Limit Exceeded</p>
                        <p>You've contributed ${total401k.toLocaleString()} total (pre-tax + after-tax + match). The 2025 employee contribution limit is ${(taxReturn.personalInfo?.age ?? 35 >= 50 ? K401_CATCHUP_2025 : K401_LIMIT_2025).toLocaleString()}.</p>
                        {afterTax401k > 0 && (
                          <p className="mt-1">Note: ${afterTax401k.toLocaleString()} is after-tax contributions.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show after-tax breakdown if applicable */}
                {(afterTax401k > 0 || employerMatch > 0) && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">401(k) Breakdown</p>
                        <p>Pre-tax: ${preTax401k.toLocaleString()} | After-tax: ${afterTax401k.toLocaleString()} | Employer: ${employerMatch.toLocaleString()}</p>
                        <p className="mt-1">Total: ${total401k.toLocaleString()} / ${K401_TOTAL_LIMIT_2025.toLocaleString()} (2025 combined limit)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 401(k) Contribution Slider */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">401(k) Contribution</span>
                    <span className="text-sm font-bold text-violet-600">
                      ${whatIf401k !== null ? whatIf401k.toLocaleString() : current401k.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={max401kSlider}
                    step={500}
                    value={whatIf401k !== null ? whatIf401k : current401k}
                    onChange={(e) => setWhatIf401k(Number(e.target.value))}
                    className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>$0</span>
                    <span>${max401kSlider.toLocaleString()} (2025 limit){current401k > 0 ? ` • $${current401k.toLocaleString()} contributed` : ''}</span>
                  </div>
                  {whatIf401k !== null && whatIf401k !== current401k && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-violet-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Tax Savings:</span>
                        <span className="font-bold text-green-600">
                          ${calculate401kImpact(whatIf401k - current401k)?.taxSavings.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-slate-600">Effective Rate:</span>
                        <span className="font-bold text-violet-600">
                          {effectiveRate.toFixed(2)}% → {calculate401kImpact(whatIf401k - current401k)?.newEffectiveRate.toFixed(2) ?? effectiveRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {whatIf401k !== null && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setWhatIf401k(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                {/* Traditional vs Roth Comparison (IRA) */}
                {hasBackdoorRoth ? (
                  <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Backdoor Roth Detected</p>
                        <p>You've already done a Roth conversion this year. Traditional IRA contributions may not be deductible. Consider Roth IRA contributions instead.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Traditional IRA Contribution</span>
                    <span className="text-sm font-bold text-violet-600">
                      ${whatIfIRA !== null ? whatIfIRA.toLocaleString() : '$0'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={IRA_LIMITS_2025.contributionLimit}
                    step={100}
                    value={whatIfIRA ?? 0}
                    onChange={(e) => setWhatIfIRA(Number(e.target.value))}
                    className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>$0</span>
                    <span>${IRA_LIMITS_2025.contributionLimit.toLocaleString()} (2025 limit)</span>
                  </div>
                  {whatIfIRA !== null && whatIfIRA > 0 && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-violet-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Tax Savings (Traditional):</span>
                        <span className="font-bold text-green-600">
                          ${calculateIRAImpact(whatIfIRA)?.taxSavings.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 italic">
                        * Roth contributions don't give a deduction but grow tax-free. Traditional gives deduction now, taxed on withdrawal.
                      </div>
                    </div>
                  )}
                  {whatIfIRA !== null && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setWhatIfIRA(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                  )}
                </div>
                )}

                {/* Estimated Tax Payments (Self-Employed Only) */}
                {isSelfEmployed && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Estimated Tax Payments</span>
                      <span className="text-sm font-bold text-violet-600">
                        ${((whatIfEstimatedTax !== null ? whatIfEstimatedTax : taxReturn.estimatedTaxPayments) || 0).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max((taxCalculation.totalTax || 0) * 1.2, 50000)}
                      step={500}
                      value={whatIfEstimatedTax !== null ? whatIfEstimatedTax : taxReturn.estimatedTaxPayments || 0}
                      onChange={(e) => setWhatIfEstimatedTax(Number(e.target.value))}
                      className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>$0</span>
                      <span>${Math.max((taxCalculation.totalTax || 0) * 1.2, 50000).toLocaleString()}</span>
                    </div>
                    {whatIfEstimatedTax !== null && (
                      <div className="mt-2 p-2 bg-white rounded-lg border border-violet-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Current Amount Owed:</span>
                          <span className={`font-bold ${taxCalculation.refundOrAmountOwed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(taxCalculation.refundOrAmountOwed).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-slate-600">After Payments:</span>
                          <span className={`font-bold ${(taxCalculation.refundOrAmountOwed - whatIfEstimatedTax + (taxReturn.estimatedTaxPayments || 0)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(taxCalculation.refundOrAmountOwed - whatIfEstimatedTax + (taxReturn.estimatedTaxPayments || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {whatIfEstimatedTax !== null && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setWhatIfEstimatedTax(null)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <RefreshCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Collapsible */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-2 border-blue-600 z-50 rounded-t-2xl">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Tax Summary</h2>
          </div>
          {isCollapsed ? (
            <ChevronUp className="w-6 h-6 text-slate-600" />
          ) : (
            <ChevronDown className="w-6 h-6 text-slate-600" />
          )}
        </button>

        {!isCollapsed && (
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Progress Header - Mobile */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completion</span>
                <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Warning Banners - Mobile */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((warning, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-lg p-2.5 border ${
                      warning.type === 'amt' 
                        ? 'bg-amber-50 border-amber-200' 
                        : warning.type === 'eitc'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        warning.type === 'amt' 
                          ? 'text-amber-600' 
                          : warning.type === 'eitc'
                            ? 'text-blue-600'
                            : 'text-orange-600'
                      }`} />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{warning.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Income</div>
                <div className="text-lg font-bold text-slate-900 currency">
                  ${taxCalculation.totalIncome.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">AGI</div>
                <div className="text-lg font-bold text-slate-900 currency">
                  ${taxCalculation.agi.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Taxable</div>
                <div className="text-lg font-bold text-slate-900 currency">
                  ${taxCalculation.taxableIncome.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Tax</div>
                <div className="text-lg font-bold text-slate-900 currency">
                  ${taxCalculation.totalTax.toLocaleString()}
                </div>
              </div>

              {/* QBI Deduction - Mobile - NEW */}
              {(taxCalculation.qbiDeduction ?? 0) > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">QBI Deduction</div>
                  <div className="text-lg font-bold text-green-600 currency">
                    ${taxCalculation.qbiDeduction.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Additional Medicare Tax - Mobile - NEW */}
              {(taxCalculation.additionalMedicareTax ?? 0) > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                  <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Add'l Medicare</div>
                  <div className="text-lg font-bold text-orange-600 currency">
                    ${taxCalculation.additionalMedicareTax.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Refund/Owed - Highlighted */}
            <div className={`
              rounded-xl p-4 shadow-lg border-2
              ${isRefund 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
              }
            `}>
              <div className="text-sm font-semibold text-slate-700 text-center mb-2">
                {isRefund ? 'Expected Refund' : 'Amount Owed'}
              </div>
              <div className={`text-4xl font-bold text-center number-emphasis ${isRefund ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(taxCalculation.refundOrAmountOwed).toLocaleString()}
              </div>
            </div>

            {/* Tax Bracket Breakdown */}
            {bracketBreakdown.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Tax by Bracket</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={bracketBreakdown}>
                    <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value) => `$${(value || 0).toLocaleString()}`}
                    />
                    <Bar dataKey="tax" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Income Sources */}
            {incomeSources.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Income Sources</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={incomeSources}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={renderInnerPieLabel}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value || 0).toLocaleString()}`} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* What-If Scenarios Section - Mobile */}
            {taxCalculation && (
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-violet-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Sliders className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">What-If Scenarios</h3>
                </div>

                {/* 401(k) Contribution Slider - Mobile */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-700">401(k) Contribution</span>
                    <span className="text-xs font-bold text-violet-600">
                      ${whatIf401k !== null ? whatIf401k.toLocaleString() : current401k.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={K401_LIMIT_2025}
                    step={500}
                    value={whatIf401k !== null ? whatIf401k : current401k}
                    onChange={(e) => setWhatIf401k(Number(e.target.value))}
                    className="w-full h-1.5 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>$0</span>
                    <span>${K401_LIMIT_2025.toLocaleString()}</span>
                  </div>
                  {whatIf401k !== null && whatIf401k !== current401k && (
                    <div className="mt-1.5 p-1.5 bg-white rounded border border-violet-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tax Savings:</span>
                        <span className="font-bold text-green-600">
                          ${calculate401kImpact(whatIf401k - current401k)?.taxSavings.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>
                  )}
                  {whatIf401k !== null && (
                    <button
                      onClick={() => setWhatIf401k(null)}
                      className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                    >
                      <RefreshCcw className="w-2.5 h-2.5" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Traditional IRA - Mobile */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-700">Traditional IRA</span>
                    <span className="text-xs font-bold text-violet-600">
                      ${whatIfIRA !== null ? whatIfIRA.toLocaleString() : '$0'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={IRA_LIMITS_2025.contributionLimit}
                    step={100}
                    value={whatIfIRA ?? 0}
                    onChange={(e) => setWhatIfIRA(Number(e.target.value))}
                    className="w-full h-1.5 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  {whatIfIRA !== null && whatIfIRA > 0 && (
                    <div className="mt-1.5 p-1.5 bg-white rounded border border-violet-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tax Savings:</span>
                        <span className="font-bold text-green-600">
                          ${calculateIRAImpact(whatIfIRA)?.taxSavings.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>
                  )}
                  {whatIfIRA !== null && (
                    <button
                      onClick={() => setWhatIfIRA(null)}
                      className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                    >
                      <RefreshCcw className="w-2.5 h-2.5" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Estimated Tax Payments - Mobile (Self-Employed) */}
                {isSelfEmployed && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-slate-700">Est. Tax Payments</span>
                      <span className="text-xs font-bold text-violet-600">
                        ${((whatIfEstimatedTax !== null ? whatIfEstimatedTax : taxReturn.estimatedTaxPayments) || 0).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max((taxCalculation.totalTax || 0) * 1.2, 50000)}
                      step={500}
                      value={whatIfEstimatedTax !== null ? whatIfEstimatedTax : taxReturn.estimatedTaxPayments || 0}
                      onChange={(e) => setWhatIfEstimatedTax(Number(e.target.value))}
                      className="w-full h-1.5 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    {whatIfEstimatedTax !== null && (
                      <button
                        onClick={() => setWhatIfEstimatedTax(null)}
                        className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                      >
                        <RefreshCcw className="w-2.5 h-2.5" />
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
