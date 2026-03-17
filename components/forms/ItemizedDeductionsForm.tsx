'use client';

import React, { useMemo } from 'react';
import { ItemizedDeductions, FilingStatus } from '../../types/tax-types';
import { 
  STANDARD_DEDUCTION_2025, 
  SALT_CAP_2025, 
  MEDICAL_EXPENSE_AGI_THRESHOLD 
} from '../../data/tax-constants';
import { validateItemizedDeductions } from '../../lib/validation/form-validation';
import { AlertCircle } from 'lucide-react';
import ValidationError from '../common/ValidationError';
import CurrencyInput from '../common/CurrencyInput';

interface ItemizedDeductionsFormProps {
  values: ItemizedDeductions | undefined;
  onChange: (values: ItemizedDeductions) => void;
  agi: number;
  filingStatus: FilingStatus;
  onValidationChange?: (isValid: boolean) => void;
}

export default function ItemizedDeductionsForm({ 
  values, 
  onChange, 
  agi, 
  filingStatus,
  onValidationChange,
}: ItemizedDeductionsFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Initialize with defaults if undefined
  const deductions: ItemizedDeductions = values || {
    medicalExpenses: 0,
    stateTaxesPaid: 0,
    localTaxesPaid: 0,
    realEstateTaxes: 0,
    personalPropertyTaxes: 0,
    homeMortgageInterest: 0,
    investmentInterest: 0,
    charitableCash: 0,
    charitableNonCash: 0,
    casualtyLosses: 0,
    otherDeductions: 0,
  };

  // Validation
  const errors = validateItemizedDeductions(deductions);
  const isValid = errors.length === 0;

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

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
    return `block w-full rounded-md pl-8 shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;
  };

  const updateField = (field: keyof ItemizedDeductions, value: number) => {
    onChange({ ...deductions, [field]: value });
  };

  // Calculate medical deduction (only amount over 7.5% of AGI)
  const medicalThreshold = agi * MEDICAL_EXPENSE_AGI_THRESHOLD;
  const deductibleMedical = Math.max(0, deductions.medicalExpenses - medicalThreshold);

  // Calculate SALT total and capped amount
  const saltTotal = 
    deductions.stateTaxesPaid + 
    deductions.localTaxesPaid + 
    deductions.realEstateTaxes + 
    deductions.personalPropertyTaxes;
  const cappedSalt = Math.min(saltTotal, SALT_CAP_2025);
  const isOverSaltCap = saltTotal > SALT_CAP_2025;

  // Calculate total charitable contributions
  const totalCharitable = deductions.charitableCash + deductions.charitableNonCash;

  // Calculate total itemized deductions
  const totalItemized = 
    deductibleMedical +
    cappedSalt +
    deductions.homeMortgageInterest +
    deductions.investmentInterest +
    totalCharitable +
    deductions.casualtyLosses +
    deductions.otherDeductions;

  // Get standard deduction for comparison
  const standardDeduction = STANDARD_DEDUCTION_2025[filingStatus];
  const shouldItemize = totalItemized > standardDeduction;
  const savings = Math.abs(totalItemized - standardDeduction);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Itemized Deductions</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your deductible expenses. We'll compare to the standard deduction and recommend the better option.
        </p>
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

      {/* Comparison Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Standard Deduction</p>
            <p className="text-2xl font-bold text-gray-900">
              ${standardDeduction.toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Your Itemized Total</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalItemized.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Recommendation</p>
            {shouldItemize ? (
              <div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  ✓ Itemize
                </span>
                <p className="text-xs text-gray-600 mt-2">
                  Save ${savings.toLocaleString()} more
                </p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                  Use Standard
                </span>
                <p className="text-xs text-gray-600 mt-2">
                  Worth ${savings.toLocaleString()} more
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medical and Dental Expenses */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Medical and Dental Expenses</h3>
        <p className="text-sm text-gray-600">
          Only the amount exceeding 7.5% of your AGI (${medicalThreshold.toLocaleString()}) is deductible.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Medical and Dental Expenses
            </label>
            <CurrencyInput
              value={deductions.medicalExpenses}
              onValueChange={(val) => updateField('medicalExpenses', val)}
              onBlur={() => touchField('itemized-medicalExpenses')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-medicalExpenses')} />
          </div>

          <div className="flex items-center">
            <div className="p-4 bg-blue-50 rounded-lg w-full">
              <p className="text-sm font-medium text-gray-700">Deductible Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                ${deductibleMedical.toLocaleString()}
              </p>
              {deductibleMedical === 0 && deductions.medicalExpenses > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Below 7.5% AGI threshold
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* State and Local Taxes (SALT) */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">State and Local Taxes (SALT)</h3>
        {isOverSaltCap && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>SALT Cap Applied:</strong> Your total SALT deduction is limited to $10,000.
                  You entered ${saltTotal.toLocaleString()}, but can only deduct ${SALT_CAP_2025.toLocaleString()}.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              State Income Taxes Paid
            </label>
            <CurrencyInput
              value={deductions.stateTaxesPaid}
              onValueChange={(val) => updateField('stateTaxesPaid', val)}
              onBlur={() => touchField('itemized-stateTaxesPaid')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-stateTaxesPaid')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Local Income Taxes Paid
            </label>
            <CurrencyInput
              value={deductions.localTaxesPaid}
              onValueChange={(val) => updateField('localTaxesPaid', val)}
              onBlur={() => touchField('itemized-localTaxesPaid')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-localTaxesPaid')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Real Estate Taxes
            </label>
            <CurrencyInput
              value={deductions.realEstateTaxes}
              onValueChange={(val) => updateField('realEstateTaxes', val)}
              onBlur={() => touchField('itemized-realEstateTaxes')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-realEstateTaxes')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Personal Property Taxes
            </label>
            <CurrencyInput
              value={deductions.personalPropertyTaxes}
              onValueChange={(val) => updateField('personalPropertyTaxes', val)}
              onBlur={() => touchField('itemized-personalPropertyTaxes')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-personalPropertyTaxes')} />
          </div>

          <div className="md:col-span-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total SALT:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${saltTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-gray-700">Deductible Amount:</span>
                <span className={`text-xl font-bold ${isOverSaltCap ? 'text-red-600' : 'text-green-600'}`}>
                  ${cappedSalt.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home Mortgage Interest */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Home Mortgage Interest</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Home Mortgage Interest Paid
            </label>
            <CurrencyInput
              value={deductions.homeMortgageInterest}
              onValueChange={(val) => updateField('homeMortgageInterest', val)}
              onBlur={() => touchField('itemized-homeMortgageInterest')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-homeMortgageInterest')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Investment Interest
            </label>
            <CurrencyInput
              value={deductions.investmentInterest}
              onValueChange={(val) => updateField('investmentInterest', val)}
              onBlur={() => touchField('itemized-investmentInterest')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-investmentInterest')} />
          </div>
        </div>
      </div>

      {/* Charitable Contributions */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Charitable Contributions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cash Contributions
            </label>
            <CurrencyInput
              value={deductions.charitableCash}
              onValueChange={(val) => updateField('charitableCash', val)}
              onBlur={() => touchField('itemized-charitableCash')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-charitableCash')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Non-Cash Contributions (property, goods)
            </label>
            <CurrencyInput
              value={deductions.charitableNonCash}
              onValueChange={(val) => updateField('charitableNonCash', val)}
              onBlur={() => touchField('itemized-charitableNonCash')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-charitableNonCash')} />
          </div>

          <div className="md:col-span-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Charitable:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${totalCharitable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Deductions */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Other Itemized Deductions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Casualty and Theft Losses
            </label>
            <CurrencyInput
              value={deductions.casualtyLosses}
              onValueChange={(val) => updateField('casualtyLosses', val)}
              onBlur={() => touchField('itemized-casualtyLosses')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-casualtyLosses')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Other Itemized Deductions
            </label>
            <CurrencyInput
              value={deductions.otherDeductions}
              onValueChange={(val) => updateField('otherDeductions', val)}
              onBlur={() => touchField('itemized-otherDeductions')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('itemized-otherDeductions')} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Medical & Dental (deductible amount):</span>
            <span className="font-semibold">${deductibleMedical.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">State & Local Taxes (SALT, capped):</span>
            <span className="font-semibold">${cappedSalt.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Mortgage Interest:</span>
            <span className="font-semibold">${deductions.homeMortgageInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Investment Interest:</span>
            <span className="font-semibold">${deductions.investmentInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Charitable Contributions:</span>
            <span className="font-semibold">${totalCharitable.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Casualty & Theft Losses:</span>
            <span className="font-semibold">${deductions.casualtyLosses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Other Deductions:</span>
            <span className="font-semibold">${deductions.otherDeductions.toLocaleString()}</span>
          </div>
          
          <div className="border-t-2 border-indigo-300 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Itemized Deductions:</span>
              <span className="text-2xl font-bold text-indigo-600">
                ${totalItemized.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-600">Standard Deduction:</span>
            <span className="font-semibold">${standardDeduction.toLocaleString()}</span>
          </div>

          <div className="bg-white rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Option</p>
                <p className="text-lg font-bold">
                  {shouldItemize ? 'Itemize Deductions' : 'Take Standard Deduction'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Tax Benefit</p>
                <p className="text-2xl font-bold text-green-600">
                  ${Math.max(totalItemized, standardDeduction).toLocaleString()}
                </p>
              </div>
            </div>
            {shouldItemize && (
              <p className="text-xs text-green-600 mt-2">
                ✓ You'll save ${savings.toLocaleString()} by itemizing instead of taking the standard deduction
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
