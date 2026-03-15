'use client';

import React from 'react';
import { CapitalGainTransaction } from '../../types/tax-types';
import { validateCapitalGain } from '../../lib/validation/form-validation';
import { AlertCircle } from 'lucide-react';
import ValidationError from '../common/ValidationError';

interface CapitalGainsFormProps {
  values: CapitalGainTransaction[];
  onChange: (values: CapitalGainTransaction[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function CapitalGainsForm({ values, onChange, onValidationChange }: CapitalGainsFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Validate all transactions
  const allErrors = values.flatMap((txn, index) => validateCapitalGain(txn, index));
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
    return `mt-1 block w-full rounded-md shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;
  };
  const addTransaction = () => {
    onChange([...values, {
      description: '',
      dateAcquired: '',
      dateSold: '',
      proceeds: 0,
      costBasis: 0,
      isLongTerm: false,
    }]);
  };

  const updateTransaction = (index: number, updates: Partial<CapitalGainTransaction>) => {
    const newValues = [...values];
    const transaction = { ...newValues[index], ...updates };

    // Auto-calculate isLongTerm based on holding period
    if (transaction.dateAcquired && transaction.dateSold) {
      const acquired = new Date(transaction.dateAcquired);
      const sold = new Date(transaction.dateSold);
      const holdingDays = Math.floor((sold.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24));
      transaction.isLongTerm = holdingDays > 365;
    }

    newValues[index] = transaction;
    onChange(newValues);
  };

  const removeTransaction = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  // Calculate holding period in days
  const getHoldingPeriod = (dateAcquired: string, dateSold: string): number | null => {
    if (!dateAcquired || !dateSold) return null;
    const acquired = new Date(dateAcquired);
    const sold = new Date(dateSold);
    return Math.floor((sold.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate gain/loss
  const getGainLoss = (proceeds: number, costBasis: number): number => {
    return proceeds - costBasis;
  };

  // Wash sale detection note:
  // The IRS wash sale rule disallows a loss if you buy the same (or substantially
  // identical) security within 30 days BEFORE or AFTER the sale — it's about
  // repurchasing, not the holding period. We can't reliably auto-detect this from
  // per-transaction data alone, so we flag all losses as needing manual review.
  const hasWashSaleRisk = (proceeds: number, costBasis: number): boolean => {
    return getGainLoss(proceeds, costBasis) < 0;
  };

  // Calculate totals
  const calculateTotals = () => {
    let shortTermGains = 0;
    let longTermGains = 0;

    values.forEach(txn => {
      const gainLoss = getGainLoss(txn.proceeds, txn.costBasis);
      if (txn.isLongTerm) {
        longTermGains += gainLoss;
      } else {
        shortTermGains += gainLoss;
      }
    });

    const combinedTotal = shortTermGains + longTermGains;
    const hasCapitalLossLimitation = combinedTotal < 0 && Math.abs(combinedTotal) > 3000;

    return { shortTermGains, longTermGains, combinedTotal, hasCapitalLossLimitation };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Capital Gains (Form 1099-B)</h2>
          <p className="text-sm text-gray-600 mt-1">Enter data from your 1099-B forms received from brokers</p>
        </div>
        <button
          type="button"
          onClick={addTransaction}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add Transaction
        </button>
      </div>

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
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No capital gain transactions added yet. Click "Add Transaction" to begin.</p>
        </div>
      ) : (
        <>
          {values.map((txn, index) => {
            const holdingDays = getHoldingPeriod(txn.dateAcquired, txn.dateSold);
            const gainLoss = getGainLoss(txn.proceeds, txn.costBasis);
            const washRisk = hasWashSaleRisk(txn.proceeds, txn.costBasis);
            const isGain = gainLoss > 0;
            const isLoss = gainLoss < 0;

            return (
              <div key={index} className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Transaction #{index + 1}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      txn.isLongTerm 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {txn.isLongTerm ? 'Long-term' : 'Short-term'}
                    </span>
                    {holdingDays !== null && (
                      <span className="text-sm text-gray-500">
                        ({holdingDays} days)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTransaction(index)}
                    className="text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>

                {washRisk && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Wash Sale Check:</strong> This transaction shows a loss. If you purchased the same or substantially identical security within 30 days <em>before or after</em> this sale, the IRS wash sale rule disallows the loss. Check your brokerage 1099-B — wash sales are usually already identified and noted there.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={txn.description}
                      onChange={(e) => updateTransaction(index, { description: e.target.value })}
                      onBlur={() => touchField(`capital-${index}-description`)}
                      placeholder="e.g., 100 shares AAPL"
                      className={getInputClassName(`capital-${index}-description`)}
                    />
                    <ValidationError message={getFieldError(`capital-${index}-description`)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Acquired <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={txn.dateAcquired}
                      onChange={(e) => updateTransaction(index, { dateAcquired: e.target.value })}
                      onBlur={() => touchField(`capital-${index}-dateAcquired`)}
                      className={getInputClassName(`capital-${index}-dateAcquired`)}
                    />
                    <ValidationError message={getFieldError(`capital-${index}-dateAcquired`)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Sold <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={txn.dateSold}
                      onChange={(e) => updateTransaction(index, { dateSold: e.target.value })}
                      onBlur={() => touchField(`capital-${index}-dateSold`)}
                      min={txn.dateAcquired}
                      className={getInputClassName(`capital-${index}-dateSold`)}
                    />
                    <ValidationError message={getFieldError(`capital-${index}-dateSold`)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sale Proceeds <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-1">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={txn.proceeds || ''}
                        onChange={(e) => updateTransaction(index, { proceeds: parseFloat(e.target.value) || 0 })}
                        onBlur={() => touchField(`capital-${index}-proceeds`)}
                        className={`pl-8 ${getInputClassName(`capital-${index}-proceeds`)}`}
                      placeholder="0.00"
                      />
                    </div>
                    <ValidationError message={getFieldError(`capital-${index}-proceeds`)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cost Basis
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-1">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={txn.costBasis || ''}
                        onChange={(e) => updateTransaction(index, { costBasis: parseFloat(e.target.value) || 0 })}
                        onBlur={() => touchField(`capital-${index}-costBasis`)}
                        className={`pl-8 ${getInputClassName(`capital-${index}-costBasis`)}`}
                      placeholder="0.00"
                      />
                    </div>
                    <ValidationError message={getFieldError(`capital-${index}-costBasis`)} />
                  </div>

                  <div className="md:col-span-2 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Gain/Loss:
                      </span>
                      <span className={`text-2xl font-bold ${
                        isGain ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {isGain ? '+' : ''}{gainLoss < 0 ? '-' : ''}$
                        {Math.abs(gainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary Section */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Capital Gains Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                <span className="text-sm font-medium text-blue-900">Short-term Gains/Losses:</span>
                <span className={`text-xl font-bold ${
                  totals.shortTermGains > 0 ? 'text-green-600' : totals.shortTermGains < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {totals.shortTermGains > 0 ? '+' : ''}
                  {totals.shortTermGains < 0 ? '-' : ''}$
                  {Math.abs(totals.shortTermGains).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                <span className="text-sm font-medium text-blue-900">Long-term Gains/Losses:</span>
                <span className={`text-xl font-bold ${
                  totals.longTermGains > 0 ? 'text-green-600' : totals.longTermGains < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {totals.longTermGains > 0 ? '+' : ''}
                  {totals.longTermGains < 0 ? '-' : ''}$
                  {Math.abs(totals.longTermGains).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <span className="text-lg font-bold text-blue-900">Combined Total:</span>
                <span className={`text-3xl font-bold ${
                  totals.combinedTotal > 0 ? 'text-green-600' : totals.combinedTotal < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {totals.combinedTotal > 0 ? '+' : ''}
                  {totals.combinedTotal < 0 ? '-' : ''}$
                  {Math.abs(totals.combinedTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {totals.hasCapitalLossLimitation && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <strong>Capital Loss Limitation:</strong> Your total capital loss exceeds the $3,000 annual limit. 
                        You can deduct up to $3,000 this year, and the remaining ${(Math.abs(totals.combinedTotal) - 3000).toLocaleString()} 
                        will carry over to next year.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
