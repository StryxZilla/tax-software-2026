'use client';

import React, { useMemo, useState } from 'react';
import { useTaxReturn } from '@/lib/context/TaxReturnContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Percent, Loader2, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { TAX_BRACKETS_2025 } from '../../data/tax-constants';

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

  // Check AMT status
  const hasAMT = (taxCalculation?.amt ?? 0) > 0;

  // Check EITC eligibility (simplified check - AGI within range, has dependents, no EITC in credits)
  const eitcEligible = useMemo(() => {
    if (!taxCalculation) return false;
    const agi = taxCalculation.agi;
    const hasDependents = taxReturn.dependents.length > 0;
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
          </div>
        )}
      </div>
    </>
  );
}
