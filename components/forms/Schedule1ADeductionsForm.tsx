'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Schedule1ADeductions, FilingStatus } from '../../types/tax-types';
import { SCHEDULE_1_A_2025 } from '../../data/tax-constants';
import { AlertCircle, Info, Car, Clock, DollarSign, UserCheck } from 'lucide-react';

interface Schedule1ADeductionsFormProps {
  schedule1A?: Schedule1ADeductions;
  onChange: (schedule1A: Schedule1ADeductions) => void;
  age: number;
  filingStatus: FilingStatus;
  agi?: number;
  onValidationChange?: (isValid: boolean) => void;
}

export default function Schedule1ADeductionsForm({
  schedule1A,
  onChange,
  age,
  filingStatus,
  agi = 0,
  onValidationChange,
}: Schedule1ADeductionsFormProps) {
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Initialize with defaults if undefined
  const data: Schedule1ADeductions = schedule1A || {
    tipIncome: 0,
    tipExpenses: 0,
    isTipDeductionEligible: false,
    overtimeHours: 0,
    overtimePay: 0,
    carLoanInterest: 0,
    isSeniorDeductionEligible: false,
  };

  const isMarried = filingStatus === 'Married Filing Jointly';

  // Helper function to calculate phaseout
  const calculatePhaseout = (
    magi: number,
    phaseoutStart: number,
    phaseoutEnd: number
  ): number => {
    if (magi <= phaseoutStart) return 1; // Full benefit
    if (magi >= phaseoutEnd) return 0;   // No benefit
    return (phaseoutEnd - magi) / (phaseoutEnd - phaseoutStart);
  };

  // Calculate Tip Income Deduction
  const tipMaxDeduction = SCHEDULE_1_A_2025.tipDeduction.maxDeduction;
  const tipPhaseoutStart = isMarried
    ? SCHEDULE_1_A_2025.tipDeduction.phaseoutStart.marriedFilingJointly
    : SCHEDULE_1_A_2025.tipDeduction.phaseoutStart.single;
  const tipPhaseoutEnd = isMarried
    ? SCHEDULE_1_A_2025.tipDeduction.phaseoutEnd.marriedFilingJointly
    : SCHEDULE_1_A_2025.tipDeduction.phaseoutEnd.single;
  
  const tipPhaseoutFactor = calculatePhaseout(agi, tipPhaseoutStart, tipPhaseoutEnd);
  const tipDeductibleExpenses = Math.min(data.tipExpenses, data.tipIncome);
  const rawTipDeduction = Math.min(tipDeductibleExpenses, tipMaxDeduction);
  const tipDeduction = Math.round(rawTipDeduction * tipPhaseoutFactor);

  // Calculate Overtime Deduction
  const overtimeMaxDeduction = isMarried
    ? SCHEDULE_1_A_2025.overtimeDeduction.maxDeductionMarried
    : SCHEDULE_1_A_2025.overtimeDeduction.maxDeduction;
  const overtimePhaseoutStart = isMarried
    ? SCHEDULE_1_A_2025.overtimeDeduction.phaseoutStart.marriedFilingJointly
    : SCHEDULE_1_A_2025.overtimeDeduction.phaseoutStart.single;
  const overtimePhaseoutEnd = isMarried
    ? SCHEDULE_1_A_2025.overtimeDeduction.phaseoutEnd.marriedFilingJointly
    : SCHEDULE_1_A_2025.overtimeDeduction.phaseoutEnd.single;
  
  const overtimePhaseoutFactor = calculatePhaseout(agi, overtimePhaseoutStart, overtimePhaseoutEnd);
  const rawOvertimeDeduction = Math.min(data.overtimePay, overtimeMaxDeduction);
  const overtimeDeduction = Math.round(rawOvertimeDeduction * overtimePhaseoutFactor);

  // Calculate Senior Deduction
  const seniorMaxDeduction = isMarried
    ? SCHEDULE_1_A_2025.seniorDeduction.maxDeductionMarried
    : SCHEDULE_1_A_2025.seniorDeduction.maxDeduction;
  const seniorPhaseoutStart = isMarried
    ? SCHEDULE_1_A_2025.seniorDeduction.phaseoutStart.marriedFilingJointly
    : SCHEDULE_1_A_2025.seniorDeduction.phaseoutStart.single;
  const seniorPhaseoutEnd = isMarried
    ? SCHEDULE_1_A_2025.seniorDeduction.phaseoutEnd.marriedFilingJointly
    : SCHEDULE_1_A_2025.seniorDeduction.phaseoutEnd.single;
  
  const seniorPhaseoutFactor = calculatePhaseout(agi, seniorPhaseoutStart, seniorPhaseoutEnd);
  const seniorDeduction = data.isSeniorDeductionEligible
    ? Math.round(seniorMaxDeduction * seniorPhaseoutFactor)
    : 0;

  // Total Schedule 1-A deduction
  const totalDeduction = tipDeduction + overtimeDeduction + data.carLoanInterest + seniorDeduction;

  // Validation
  const errors = useMemo(() => {
    const errs: { field: string; message: string }[] = [];
    
    if (data.tipExpenses > data.tipIncome && data.tipIncome > 0) {
      errs.push({ field: 'tipExpenses', message: 'Tip expenses cannot exceed tip income' });
    }
    
    if (data.overtimePay > 0 && data.overtimeHours === 0) {
      errs.push({ field: 'overtimeHours', message: 'Please enter overtime hours worked' });
    }
    
    if (data.overtimeHours > 0 && data.overtimePay === 0) {
      errs.push({ field: 'overtimePay', message: 'Please enter overtime pay received' });
    }

    return errs;
  }, [data]);

  const isValid = errors.length === 0;

  useEffect(() => {
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
    return `block w-full rounded-lg shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
    }`;
  };

  const updateField = (field: keyof Schedule1ADeductions, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Check if taxpayer qualifies for senior deduction (born before Jan 2, 1961 = age 65+ in 2026)
  const qualifiesForSenior = age >= 65;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Schedule 1-A Deductions</h2>
          <p className="text-slate-600">
            New above-the-line deductions from the "One Big Beautiful Bill" (2025-2028)
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
          📋 Forms 1040 / Schedule 1-A
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-purple-800">
            <p className="font-semibold mb-1">These deductions reduce your taxable income (AGI):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tip Income Deduction — Up to $25,000 for tipped workers</li>
              <li>Overtime Pay Deduction — Up to $12,500 ($25,000 married)</li>
              <li>Car Loan Interest — Interest on qualified vehicle loans</li>
              <li>Senior Deduction — $6,000 extra for taxpayers 65+ ($12,000 married)</li>
            </ul>
          </div>
        </div>
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

      {/* Tip Income Deduction (Part II) */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Tip Income Deduction</h3>
            <p className="text-sm text-slate-500">Part II — No tax on tips</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Eligibility:</strong> You must have received tips that were reported to your employer. 
            Married couples must file jointly. Maximum deduction is $25,000, reduced for MAGI over $150,000 (single) / $300,000 (married).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Tips Received (reported to employer)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={data.tipIncome || ''}
                onChange={(e) => updateField('tipIncome', parseFloat(e.target.value) || 0)}
                onBlur={() => touchField('tipIncome')}
                min="0"
                className={`pl-8 ${getInputClassName('tipIncome')}`}
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">From your W-2, Box 7 (if tips reported)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Deductible Tip-Related Expenses
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={data.tipExpenses || ''}
                onChange={(e) => updateField('tipExpenses', parseFloat(e.target.value) || 0)}
                onBlur={() => touchField('tipExpenses')}
                min="0"
                className={`pl-8 ${getInputClassName('tipExpenses')}`}
                placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('tipExpenses')} />
            <p className="mt-1 text-xs text-slate-500">Cannot exceed tips received (e.g., credit card processing fees)</p>
          </div>

          <div className="md:col-span-2 flex items-center space-x-3">
            <input
              type="checkbox"
              id="isTipDeductionEligible"
              checked={data.isTipDeductionEligible}
              onChange={(e) => updateField('isTipDeductionEligible', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="isTipDeductionEligible" className="text-sm font-semibold text-slate-700">
              I confirm tips were reported to my employer
              <p className="text-xs text-slate-500 font-normal mt-0.5">Required to claim this deduction</p>
            </label>
          </div>

          {/* Tip Deduction Calculation */}
          {data.tipExpenses > 0 && (
            <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-800">Tip Deduction:</span>
                <span className="text-xl font-bold text-amber-700">
                  ${tipDeduction.toLocaleString()}
                </span>
              </div>
              {tipPhaseoutFactor < 1 && (
                <p className="text-xs text-amber-600">
                  Reduced by {(1 - tipPhaseoutFactor * 100).toFixed(0)}% due to income phaseout
                  (MAGI ${agi.toLocaleString()} exceeds ${tipPhaseoutStart.toLocaleString()})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overtime Pay Deduction (Part III) */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Overtime Pay Deduction</h3>
            <p className="text-sm text-slate-500">Part III — No tax on overtime</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Eligibility:</strong> Overtime must be paid as required under FLSA Section 7 
            (typically 1.5x regular pay for hours over 40/week). Married couples must file jointly.
            Maximum deduction is $12,500 ($25,000 married), reduced for MAGI over $150,000/$300,000.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Overtime Hours Worked
            </label>
            <input
              type="number"
              step="0.5"
              value={data.overtimeHours || ''}
              onChange={(e) => updateField('overtimeHours', parseFloat(e.target.value) || 0)}
              onBlur={() => touchField('overtimeHours')}
              min="0"
              className={getInputClassName('overtimeHours')}
              placeholder="0"
            />
            <ValidationError message={getFieldError('overtimeHours')} />
            <p className="mt-1 text-xs text-slate-500">Hours worked over 40 in a workweek</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Overtime Pay Received
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={data.overtimePay || ''}
                onChange={(e) => updateField('overtimePay', parseFloat(e.target.value) || 0)}
                onBlur={() => touchField('overtimePay')}
                min="0"
                className={`pl-8 ${getInputClassName('overtimePay')}`}
                placeholder="0.00"
              />
            </div>
            <ValidationError message={getFieldError('overtimePay')} />
            <p className="mt-1 text-xs text-slate-500">Total overtime compensation (not regular wages)</p>
          </div>

          {/* Overtime Deduction Calculation */}
          {data.overtimePay > 0 && (
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-800">Overtime Deduction:</span>
                <span className="text-xl font-bold text-blue-700">
                  ${overtimeDeduction.toLocaleString()}
                </span>
              </div>
              {overtimePhaseoutFactor < 1 && (
                <p className="text-xs text-blue-600">
                  Reduced by {(1 - overtimePhaseoutFactor * 100).toFixed(0)}% due to income phaseout
                  (MAGI ${agi.toLocaleString()} exceeds ${overtimePhaseoutStart.toLocaleString()})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Car Loan Interest Deduction (Part IV) */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Car Loan Interest Deduction</h3>
            <p className="text-sm text-slate-500">Part IV — No tax on car loan interest</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            <strong>Eligibility:</strong> Interest on loans for qualified passenger vehicles 
            (assembled in the US) used for personal purposes. No income phaseout per IRS guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Interest Paid on Car Loan
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={data.carLoanInterest || ''}
                onChange={(e) => updateField('carLoanInterest', parseFloat(e.target.value) || 0)}
                onBlur={() => touchField('carLoanInterest')}
                min="0"
                className={`pl-8 ${getInputClassName('carLoanInterest')}`}
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">From your auto loan interest statement (Form 1098)</p>
          </div>

          {/* Car Loan Deduction Calculation */}
          {data.carLoanInterest > 0 && (
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Car Loan Interest Deduction:</span>
                <span className="text-xl font-bold text-green-700">
                  ${data.carLoanInterest.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Senior Deduction (Part V) */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Enhanced Senior Deduction</h3>
            <p className="text-sm text-slate-500">Part V — No tax on seniors (65+)</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-purple-800">
            <strong>Eligibility:</strong> Must be born before January 2, 1961 (age 65+). 
            Maximum deduction is $6,000 per person ($12,000 married if both qualify). 
            Reduced for MAGI over $75,000 (single) / $150,000 (married).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isSeniorDeductionEligible"
              checked={data.isSeniorDeductionEligible}
              onChange={(e) => updateField('isSeniorDeductionEligible', e.target.checked)}
              disabled={!qualifiesForSenior}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
            />
            <label htmlFor="isSeniorDeductionEligible" className="text-sm font-semibold text-slate-700">
              {qualifiesForSenior 
                ? `I confirm I was born before January 2, 1961 (age ${age}+)` 
                : `Not eligible — must be age 65+ (current age: ${age})`
              }
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Required to claim this deduction
              </p>
            </label>
          </div>

          {/* Senior Deduction Calculation */}
          {data.isSeniorDeductionEligible && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-800">Senior Deduction:</span>
                <span className="text-xl font-bold text-purple-700">
                  ${seniorDeduction.toLocaleString()}
                </span>
              </div>
              {seniorPhaseoutFactor < 1 && (
                <p className="text-xs text-purple-600">
                  Reduced by {(1 - seniorPhaseoutFactor * 100).toFixed(0)}% due to income phaseout
                  (MAGI ${agi.toLocaleString()} exceeds ${seniorPhaseoutStart.toLocaleString()})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-slate-900">Schedule 1-A Deduction Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
            <span className="text-slate-600">Tip Income Deduction:</span>
            <span className="font-semibold text-amber-700">${tipDeduction.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
            <span className="text-slate-600">Overtime Pay Deduction:</span>
            <span className="font-semibold text-blue-700">${overtimeDeduction.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
            <span className="text-slate-600">Car Loan Interest Deduction:</span>
            <span className="font-semibold text-green-700">${data.carLoanInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
            <span className="text-slate-600">Senior Deduction:</span>
            <span className="font-semibold text-purple-700">${seniorDeduction.toLocaleString()}</span>
          </div>
          
          <div className="pt-4 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Total Schedule 1-A Deduction:</span>
              <span className="text-2xl font-bold text-indigo-600">
                ${totalDeduction.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This amount reduces your Adjusted Gross Income (AGI) — even if you take the standard deduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple validation error component (inline for this file)
function ValidationError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600">{message}</p>
  );
}
