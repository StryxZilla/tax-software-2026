'use client';

import React from 'react';
import { RetirementIncome, DistributionCode } from '../../types/tax-types';
import { Plus, Trash2, Landmark, DollarSign, TrendingUp, Info, AlertCircle } from 'lucide-react';
import { validateRetirementIncome } from '../../lib/validation/form-validation';
import ValidationError from '../common/ValidationError';
import CurrencyInput from '../common/CurrencyInput';

const DISTRIBUTION_CODES: { value: DistributionCode; label: string }[] = [
  { value: '1-Early distribution', label: '1 - Early distribution (before age 59½)' },
  { value: '2-ERISA', label: '2 - Early distribution (ERISA)' },
  { value: '3-Disability', label: '3 - Disability' },
  { value: '4-Death', label: '4 - Death' },
  { value: '5-Prohibited transaction', label: '5 - Prohibited transaction' },
  { value: '6-Roth conversion', label: '6 - Roth conversion' },
  { value: '7-Normal distribution', label: '7 - Normal distribution' },
  { value: '8-Excess contributions', label: '8 - Excess contributions' },
  { value: '9-Other', label: '9 - Other' },
];

function getDefaultRetirementIncome(): RetirementIncome {
  return {
    payer: '',
    ein: '',
    grossDistribution: 0,
    taxableAmount: 0,
    federalTaxWithheld: 0,
    employeeContributions: 0,
    distributionCode: '7-Normal distribution',
  };
}

interface RetirementIncomeFormProps {
  values: RetirementIncome[];
  onChange: (values: RetirementIncome[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function RetirementIncomeForm({ values, onChange, onValidationChange }: RetirementIncomeFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Validate all retirement income
  const allErrors = values.flatMap((item, index) => validateRetirementIncome(item, index));
  const isValid = allErrors.length === 0;

  // Notify parent
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const touchField = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const getFieldError = (fieldName: string): string | undefined => {
    if (!touchedFields.has(fieldName) && !showAllErrors) return undefined;
    const error = allErrors.find(e => e.field === fieldName);
    return error?.message;
  };

  const getInputClassName = (fieldName: string) => {
    const hasError = getFieldError(fieldName);
    return `block w-full rounded-lg shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-green-600 focus:ring-green-600'
    }`;
  };

  const addRetirementIncome = () => {
    onChange([...values, getDefaultRetirementIncome()]);
  };

  const updateRetirementIncome = (index: number, updates: Partial<RetirementIncome>) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], ...updates };
    onChange(newValues);
  };

  const removeRetirementIncome = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const totalGrossDistribution = values.reduce((sum, item) => sum + (item.grossDistribution || 0), 0);
  const totalTaxableAmount = values.reduce((sum, item) => sum + (item.taxableAmount || 0), 0);
  const totalFederalWithheld = values.reduce((sum, item) => sum + (item.federalTaxWithheld || 0), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Retirement Income (1099-R)</h2>
          <p className="text-slate-600">Add distributions from retirement accounts, pensions, and annuities.</p>
        </div>
        <button
          type="button"
          onClick={addRetirementIncome}
          aria-label="Add 1099-R"
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-sm font-semibold text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add 1099-R</span>
        </button>
      </div>

      {/* Total summary */}
      {values.length > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-green-100 text-sm font-medium">Gross Distribution</p>
                <p className="text-2xl font-bold">${totalGrossDistribution.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <p className="text-green-100 text-sm font-medium">Taxable Amount</p>
                <p className="text-2xl font-bold">${totalTaxableAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Landmark className="w-8 h-8" />
              <div>
                <p className="text-green-100 text-sm font-medium">Federal Withheld</p>
                <p className="text-2xl font-bold">${totalFederalWithheld.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation summary */}
      {showAllErrors && !isValid && values.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {allErrors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {values.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Landmark className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Retirement Income Added Yet</h3>
          <p className="text-slate-500 mb-6">Add Form 1099-R from retirement accounts, pensions, or annuities.</p>
          <button
            type="button"
            onClick={addRetirementIncome}
            aria-label="Add first 1099-R"
            className="inline-flex items-center space-x-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First 1099-R</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {values.map((retirement, index) => (
            <div key={index} className="card-premium overflow-hidden border border-slate-200">
              {/* Card header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3 text-white">
                  <Landmark className="w-5 h-5" />
                  <h3 className="text-lg font-bold">1099-R #{index + 1}</h3>
                  {retirement.payer && <span className="text-green-100">• {retirement.payer}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeRetirementIncome(index)}
                  aria-label={`Remove 1099-R ${index + 1}`}
                  className="flex items-center space-x-2 text-red-100 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Remove</span>
                </button>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-6">
                {/* Payer Information */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-green-600" />
                    <span>Payer Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Payer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={retirement.payer}
                        onChange={(e) => updateRetirementIncome(index, { payer: e.target.value })}
                        onBlur={() => touchField(`retirement-${index}-payer`)}
                        placeholder="e.g., Fidelity, Vanguard, Prudential"
                        className={getInputClassName(`retirement-${index}-payer`)}
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-payer`)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        EIN (Employer ID Number)
                      </label>
                      <input
                        type="text"
                        value={retirement.ein}
                        onChange={(e) => updateRetirementIncome(index, { ein: e.target.value })}
                        onBlur={() => touchField(`retirement-${index}-ein`)}
                        placeholder="XX-XXXXXXX"
                        className={getInputClassName(`retirement-${index}-ein`)}
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-ein`)} />
                    </div>
                  </div>
                </div>

                {/* Distribution Amounts */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>Distribution Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Gross Distribution (Box 1) <span className="text-red-500">*</span>
                      </label>
                      <CurrencyInput
                        value={retirement.grossDistribution}
                        onValueChange={(val) => updateRetirementIncome(index, { grossDistribution: val })}
                        placeholder="0.00"
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-gross`)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Taxable Amount (Box 2a)
                      </label>
                      <CurrencyInput
                        value={retirement.taxableAmount}
                        onValueChange={(val) => updateRetirementIncome(index, { taxableAmount: val })}
                        placeholder="0.00"
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-taxable`)} />
                      <p className="mt-1 text-xs text-slate-500">Box 2b should be checked if taxable amount is unknown</p>
                    </div>
                  </div>
                </div>

                {/* Federal Tax Withheld & Employee Contributions */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Federal Tax Withheld (Box 4)
                      </label>
                      <CurrencyInput
                        value={retirement.federalTaxWithheld}
                        onValueChange={(val) => updateRetirementIncome(index, { federalTaxWithheld: val })}
                        placeholder="0.00"
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-withheld`)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Employee Contributions (Box 5)
                      </label>
                      <CurrencyInput
                        value={retirement.employeeContributions}
                        onValueChange={(val) => updateRetirementIncome(index, { employeeContributions: val })}
                        placeholder="0.00"
                      />
                      <ValidationError message={getFieldError(`retirement-${index}-employee`)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Distribution Code (Box 7) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={retirement.distributionCode}
                        onChange={(e) => updateRetirementIncome(index, { distributionCode: e.target.value as DistributionCode })}
                        onBlur={() => touchField(`retirement-${index}-code`)}
                        className={getInputClassName(`retirement-${index}-code`)}
                      >
                        {DISTRIBUTION_CODES.map((code) => (
                          <option key={code.value} value={code.value}>
                            {code.label}
                          </option>
                        ))}
                      </select>
                      <ValidationError message={getFieldError(`retirement-${index}-code`)} />
                    </div>
                  </div>
                </div>

                {/* Helpful information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-1 text-sm">About Form 1099-R</h5>
                      <p className="text-xs text-blue-800">
                        You'll receive this form if you received distributions from retirement accounts (401k, IRA, pension) 
                        of $10 or more. The distribution code in Box 7 determines how the IRS treats the distribution - 
                        early distributions may be subject to additional 10% penalty.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helpful tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2 flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>Common Sources of 1099-R Income</span>
        </h4>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li><strong>401(k) distributions</strong> - From former employer retirement plans</li>
          <li><strong>IRA distributions</strong> - Traditional, SEP, or SIMPLE IRA withdrawals</li>
          <li><strong>Pension income</strong> - Monthly pension payments</li>
          <li><strong>Annuity payments</strong> - Fixed or variable annuity distributions</li>
          <li><strong>Roth conversions</strong> - Amounts converted from traditional to Roth IRA</li>
        </ul>
      </div>
    </div>
  );
}
