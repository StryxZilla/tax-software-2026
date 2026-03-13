'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TraditionalIRAContribution, RothIRAContribution, Form8606Data } from '../../types/tax-types';
import { calculateForm8606, validateMegaBackdoorRoth } from '../../lib/engine/forms/form-8606';
import { validateRetirement } from '../../lib/validation/form-validation';
import { AlertCircle } from 'lucide-react';
import ValidationError from '../common/ValidationError';

interface RetirementFormProps {
  traditionalIRA?: TraditionalIRAContribution;
  rothIRA?: RothIRAContribution;
  form8606?: Form8606Data;
  onUpdate: (updates: {
    traditionalIRA?: TraditionalIRAContribution;
    rothIRA?: RothIRAContribution;
    form8606?: Form8606Data;
  }) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function RetirementForm({ 
  traditionalIRA,
  rothIRA,
  form8606,
  onUpdate,
  onValidationChange,
}: RetirementFormProps) {
  const [showBackdoorRothHelp, setShowBackdoorRothHelp] = useState(false);
  const analysis = useMemo(() => {
    if (!form8606) {
      return { warnings: [] as string[], recommendations: [] as string[] };
    }

    return validateMegaBackdoorRoth(form8606);
  }, [form8606]);

  const { warnings, recommendations } = analysis;
  const [showAllErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation
  const errors = validateRetirement(traditionalIRA, rothIRA, form8606);
  const isValid = errors.length === 0;

  // Notify parent of validation state
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Form 8606 analysis is memoized above.

  const touchField = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const getFieldError = (fieldName: string): string | undefined => {
    if (!touchedFields.has(fieldName) && !showAllErrors) return undefined;
    const error = errors.find(e => e.field === fieldName);
    return error?.message;
  };

  const getInputClassName = (fieldName: string) => {
    const hasError = getFieldError(fieldName);
    return `block w-full rounded-lg shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
    }`;
  };

  const handleTraditionalIRAChange = (updates: Partial<TraditionalIRAContribution>) => {
    onUpdate({
      traditionalIRA: {
        ...traditionalIRA,
        ...updates,
      } as TraditionalIRAContribution,
      rothIRA,
      form8606,
    });
  };

  const handleRothIRAChange = (updates: Partial<RothIRAContribution>) => {
    onUpdate({
      traditionalIRA,
      rothIRA: {
        ...rothIRA,
        ...updates,
      } as RothIRAContribution,
      form8606,
    });
  };

  const handleForm8606Change = (updates: Partial<Form8606Data>) => {
    const current: Form8606Data = {
      nondeductibleContributions: form8606?.nondeductibleContributions ?? 0,
      priorYearBasis: form8606?.priorYearBasis ?? 0,
      conversionsToRoth: form8606?.conversionsToRoth ?? 0,
      distributionsFromTraditionalIRA: form8606?.distributionsFromTraditionalIRA ?? 0,
      endOfYearTraditionalIRABalance: form8606?.endOfYearTraditionalIRABalance ?? 0,
    };

    onUpdate({
      traditionalIRA,
      rothIRA,
      form8606: {
        ...current,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Retirement Accounts</h2>
          <p className="text-slate-600">Enter IRA contributions, Roth conversions, and distributions for 2025.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowBackdoorRothHelp(!showBackdoorRothHelp)}
          className="flex items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
        >
          {showBackdoorRothHelp ? 'Hide Help' : '💡 Backdoor Roth Help'}
        </button>
      </div>

      {/* Validation summary */}
      {showAllErrors && !isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showBackdoorRothHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Backdoor Roth IRA Strategy</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>The backdoor Roth strategy lets you contribute to a Roth IRA even if your income exceeds the direct contribution limits. Here's how it works:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Make a <strong>non-deductible (after-tax)</strong> contribution to a Traditional IRA</li>
              <li><strong>Convert</strong> that contribution to a Roth IRA (ideally immediately)</li>
              <li>The conversion is <strong>tax-free</strong> if you have no other pre-tax money in any Traditional IRA</li>
            </ol>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
              <p className="font-semibold text-yellow-800">⚠️ Pro-Rata Rule Warning</p>
              <p className="mt-1 text-yellow-700">If you have <em>any</em> pre-tax money in a Traditional, SEP, or SIMPLE IRA, the IRS applies the pro-rata rule. Your conversion will be partially taxable in proportion to how much pre-tax money exists across all your IRAs. To avoid this, roll pre-tax IRA balances into your employer's 401(k) first (if the plan allows incoming rollovers).</p>
            </div>
          </div>
        </div>
      )}

      {/* Traditional IRA Section */}
      <div className="card-premium p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Traditional IRA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contribution Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={traditionalIRA?.amount || 0}
                onChange={(e) => handleTraditionalIRAChange({ amount: parseFloat(e.target.value) || 0 })}
                onBlur={() => touchField('retirement-traditional-amount')}
                min="0"
                max="8000"
                className={`pl-8 ${getInputClassName('retirement-traditional-amount')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-traditional-amount')} />
            {!getFieldError('retirement-traditional-amount') && (
              <p className="mt-1 text-xs text-slate-500">2025 limit: $7,000 ($8,000 if age 50+) — found on Form 5498</p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-8">
            <input
              type="checkbox"
              id="isDeductible"
              checked={traditionalIRA?.isDeductible || false}
              onChange={(e) => handleTraditionalIRAChange({ isDeductible: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="isDeductible" className="text-sm font-semibold text-slate-700">
              Contribution is deductible
              <p className="text-xs text-slate-500 font-normal mt-0.5">Deductibility depends on income and whether you have a workplace retirement plan</p>
            </label>
          </div>
        </div>
      </div>

      {/* Roth IRA Section */}
      <div className="card-premium p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Roth IRA</h3>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Contribution Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
                step="0.01"
              value={rothIRA?.amount || 0}
              onChange={(e) => handleRothIRAChange({ amount: parseFloat(e.target.value) || 0 })}
              onBlur={() => touchField('retirement-roth-amount')}
              min="0"
              max="8000"
              className={`pl-8 ${getInputClassName('retirement-roth-amount')}`}
            placeholder="0.00"
            />
          </div>
          <ValidationError message={getFieldError('retirement-roth-amount')} />
          {!getFieldError('retirement-roth-amount') && (
            <p className="mt-1 text-xs text-slate-500">2025 limit: $7,000 ($8,000 if age 50+). Phase-out starts at $150,000 (single) / $236,000 (MFJ).</p>
          )}
        </div>

        {/* Combined limit warning */}
        {getFieldError('retirement-combined-limit') && (
          <ValidationError message={getFieldError('retirement-combined-limit')} />
        )}
      </div>

      {/* Form 8606 Section (Mega Backdoor Roth) */}
      <div className="card-premium p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Form 8606 — Nondeductible IRAs</h3>
          <p className="text-sm text-slate-500 mt-1">
            Complete this section if you made nondeductible (after-tax) IRA contributions or did a Roth conversion.
            The IRS uses the pro-rata rule to determine what portion of conversions and distributions are taxable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Line 1 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nondeductible Contributions — Current Year <span className="text-xs font-normal text-slate-400">(Form 8606, Line 1)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={(form8606?.nondeductibleContributions ?? 0) === 0 ? '' : form8606?.nondeductibleContributions}
                onChange={(e) => {
                  const raw = e.target.value;
                  handleForm8606Change({ nondeductibleContributions: raw === '' ? 0 : parseFloat(raw) || 0 });
                }}
                onBlur={() => touchField('retirement-8606-nondeductible')}
                min="0"
                className={`pl-8 ${getInputClassName('retirement-8606-nondeductible')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-8606-nondeductible')} />
            <p className="mt-1 text-xs text-slate-500">After-tax contributions made to a Traditional IRA this year</p>
          </div>

          {/* Line 2 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prior Year Basis <span className="text-xs font-normal text-slate-400">(Form 8606, Line 2)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={form8606?.priorYearBasis || 0}
                onChange={(e) => handleForm8606Change({ priorYearBasis: parseFloat(e.target.value) || 0 })}
                onBlur={() => touchField('retirement-8606-priorBasis')}
                min="0"
                className={`pl-8 ${getInputClassName('retirement-8606-priorBasis')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-8606-priorBasis')} />
            <p className="mt-1 text-xs text-slate-500">Total nondeductible contributions from all prior years (from your last Form 8606)</p>
          </div>

          {/* Line 4 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Amount Converted to Roth IRA <span className="text-xs font-normal text-slate-400">(Form 8606, Line 4)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={form8606?.conversionsToRoth || 0}
                onChange={(e) => handleForm8606Change({ conversionsToRoth: parseFloat(e.target.value) || 0 })}
                onBlur={() => touchField('retirement-8606-conversions')}
                min="0"
                className={`pl-8 ${getInputClassName('retirement-8606-conversions')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-8606-conversions')} />
            <p className="mt-1 text-xs text-slate-500">Total converted from Traditional IRA to Roth IRA during 2025</p>
          </div>

          {/* Line 5 — PREVIOUSLY MISSING FROM UI */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Distributions from Traditional IRA <span className="text-xs font-normal text-slate-400">(Form 8606, Line 5)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={form8606?.distributionsFromTraditionalIRA || 0}
                onChange={(e) => handleForm8606Change({ distributionsFromTraditionalIRA: parseFloat(e.target.value) || 0 })}
                onBlur={() => touchField('retirement-8606-distributions')}
                min="0"
                className={`pl-8 ${getInputClassName('retirement-8606-distributions')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-8606-distributions')} />
            <p className="mt-1 text-xs text-slate-500">Regular withdrawals taken from Traditional IRA (excluding conversions) — from Form 1099-R</p>
          </div>

          {/* Line 7 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Traditional IRA Balance at Dec 31, 2025 <span className="text-xs font-normal text-slate-400">(Form 8606, Line 7)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                  step="0.01"
                value={form8606?.endOfYearTraditionalIRABalance || 0}
                onChange={(e) => handleForm8606Change({ endOfYearTraditionalIRABalance: parseFloat(e.target.value) || 0 })}
                onBlur={() => touchField('retirement-8606-balance')}
                min="0"
                className={`pl-8 ${getInputClassName('retirement-8606-balance')}`}
              placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('retirement-8606-balance')} />
            <p className="mt-1 text-xs text-slate-500">Combined year-end value of all Traditional, SEP, and SIMPLE IRAs — include all accounts</p>
          </div>
        </div>

        {/* Form 8606 Analysis */}
        {form8606 && (form8606.conversionsToRoth > 0 || form8606.nondeductibleContributions > 0) && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Pro-Rata Analysis</h4>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="text-yellow-800 font-semibold mb-2">⚠️ Warnings</h5>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="text-green-800 font-semibold mb-2">✅ Recommendations</h5>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  {recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Calculation Results */}
            {form8606 && form8606.conversionsToRoth > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h5 className="font-semibold text-slate-800 mb-4">Conversion Breakdown (Form 8606, Part II)</h5>
                {(() => {
                  const results = calculateForm8606(form8606);
                  const basisPct = (results.line9_basisPercentage * 100).toFixed(2);
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm py-2 border-b border-slate-200">
                        <span className="text-slate-600">Total basis (after-tax contributions, Line 3)</span>
                        <span className="font-semibold">${results.line3_totalBasis.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-2 border-b border-slate-200">
                        <span className="text-slate-600">Total IRA pool (Line 8)</span>
                        <span className="font-semibold">${results.line8_totalIRABalancePlusDistributions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-2 border-b border-slate-200">
                        <span className="text-slate-600">Tax-free percentage (Line 9)</span>
                        <span className="font-semibold text-blue-600">{basisPct}%</span>
                      </div>
                      <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                          <dt className="text-xs text-slate-500 uppercase tracking-wide">Total Converted</dt>
                          <dd className="text-xl font-bold text-slate-800 mt-1">${results.line16_amountConverted.toLocaleString()}</dd>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                          <dt className="text-xs text-green-700 uppercase tracking-wide">Tax-Free Amount</dt>
                          <dd className="text-xl font-bold text-green-600 mt-1">${results.line17_nontaxablePortion.toLocaleString()}</dd>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
                          <dt className="text-xs text-red-700 uppercase tracking-wide">Taxable Amount</dt>
                          <dd className="text-xl font-bold text-red-600 mt-1">${results.line18_taxablePortion.toLocaleString()}</dd>
                        </div>
                      </dl>
                      <div className="flex justify-between items-center text-sm pt-2">
                        <span className="text-slate-600">Remaining basis carried to 2026</span>
                        <span className="font-semibold">${results.remainingBasis.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
