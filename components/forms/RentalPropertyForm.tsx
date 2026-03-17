'use client';

import React, { useMemo } from 'react';
import { RentalProperty, RentalExpenses } from '../../types/tax-types';
import { validateRentalProperty } from '../../lib/validation/form-validation';
import { AlertCircle } from 'lucide-react';
import ValidationError from '../common/ValidationError';
import CurrencyInput from '../common/CurrencyInput';

interface RentalPropertyFormProps {
  values: RentalProperty[];
  onChange: (values: RentalProperty[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function RentalPropertyForm({ values, onChange, onValidationChange }: RentalPropertyFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Validate all properties
  const allErrors = values.flatMap((property, index) => validateRentalProperty(property, index));
  const isValid = allErrors.length === 0;

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
  const addProperty = () => {
    onChange([...values, {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: 'single-family',
      daysRented: 0,
      daysPersonalUse: 0,
      rentalIncome: 0,
      expenses: {
        advertising: 0,
        auto: 0,
        cleaning: 0,
        commissions: 0,
        insurance: 0,
        legal: 0,
        management: 0,
        mortgage: 0,
        repairs: 0,
        supplies: 0,
        taxes: 0,
        utilities: 0,
        depreciation: 0,
        other: 0,
      },
    }]);
  };

  const updateProperty = (index: number, updates: Partial<RentalProperty>) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], ...updates };
    onChange(newValues);
  };

  const updateExpense = (index: number, expenseKey: keyof RentalExpenses, value: number) => {
    const newValues = [...values];
    newValues[index] = {
      ...newValues[index],
      expenses: {
        ...newValues[index].expenses,
        [expenseKey]: value,
      },
    };
    onChange(newValues);
  };

  const removeProperty = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  // Calculate metrics for a property
  const getPropertyMetrics = (property: RentalProperty) => {
    const totalExpenses = Object.values(property.expenses).reduce((sum, val) => sum + val, 0);
    const netIncome = property.rentalIncome - totalExpenses;
    
    // Fair rental days calculation (if personal use, reduces rental days for tax purposes)
    const fairRentalDays = property.daysRented;
    
    // Personal use limitation warnings
    // Rule 1: Personal use > 14 days
    const personalUseExceeds14Days = property.daysPersonalUse > 14;
    // Rule 2: Personal use > 10% of rental days
    const personalUseExceeds10Percent = property.daysRented > 0 && 
      property.daysPersonalUse > (property.daysRented * 0.1);
    
    const hasPersonalUseLimitation = personalUseExceeds14Days || personalUseExceeds10Percent;
    
    // Validate days don't exceed 365
    const totalDaysExceeds365 = (property.daysRented + property.daysPersonalUse) > 365;

    return {
      totalExpenses,
      netIncome,
      fairRentalDays,
      hasPersonalUseLimitation,
      totalDaysExceeds365,
    };
  };

  // Calculate summary totals
  const summary = useMemo(() => {
    let totalRentalIncome = 0;
    let totalExpenses = 0;

    values.forEach(property => {
      totalRentalIncome += property.rentalIncome;
      const expenses = Object.values(property.expenses).reduce((sum, val) => sum + val, 0);
      totalExpenses += expenses;
    });

    const netRentalIncome = totalRentalIncome - totalExpenses;

    return {
      totalRentalIncome,
      totalExpenses,
      netRentalIncome,
    };
  }, [values]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rental Income & Expenses</h2>
          <p className="text-sm text-gray-600 mt-1">Report income and expenses from rental properties</p>
        </div>
        <button
          type="button"
          onClick={addProperty}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add Property
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
          <p className="text-gray-500">No rental properties added yet. Click "Add Property" to begin.</p>
        </div>
      ) : (
        <>
          {values.map((property, index) => {
            const metrics = getPropertyMetrics(property);

            return (
              <div key={index} className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Property #{index + 1}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      metrics.netIncome >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {metrics.netIncome >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(metrics.netIncome)}
                    </span>
                    {metrics.hasPersonalUseLimitation && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        ⚠️ Personal Use Limit
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProperty(index)}
                    className="text-red-600 hover:text-red-500 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                {/* Warnings */}
                {metrics.hasPersonalUseLimitation && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Personal Use Limitation:</strong> This property exceeds the 14-day or 10% personal use threshold. 
                          Deductions may be limited. Personal use: {property.daysPersonalUse} days. 
                          10% of rental days = {Math.round(property.daysRented * 0.1)} days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metrics.totalDaysExceeds365 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          <strong>Invalid:</strong> Total days (rented + personal use) cannot exceed 365 days per year.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Information */}
                <div>
                  <h4 className="font-semibold mb-3">Property Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={property.address}
                        onChange={(e) => updateProperty(index, { address: e.target.value })}
                        onBlur={() => touchField(`rental-${index}-address`)}
                        className={`w-full rounded-md shadow-sm ${
                          getFieldError(`rental-${index}-address`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="123 Main St"
                      />
                      <ValidationError message={getFieldError(`rental-${index}-address`)} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={property.city}
                        onChange={(e) => updateProperty(index, { city: e.target.value })}
                        onBlur={() => touchField(`rental-${index}-city`)}
                        className={`w-full rounded-md shadow-sm ${
                          getFieldError(`rental-${index}-city`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="City"
                      />
                      <ValidationError message={getFieldError(`rental-${index}-city`)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={property.state}
                          onChange={(e) => updateProperty(index, { state: e.target.value.toUpperCase() })}
                          onBlur={() => touchField(`rental-${index}-state`)}
                          maxLength={2}
                          className={`w-full rounded-md shadow-sm ${
                            getFieldError(`rental-${index}-state`)
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="TX"
                        />
                        <ValidationError message={getFieldError(`rental-${index}-state`)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={property.zipCode}
                          onChange={(e) => updateProperty(index, { zipCode: e.target.value })}
                          onBlur={() => touchField(`rental-${index}-zipCode`)}
                          maxLength={10}
                          className={`w-full rounded-md shadow-sm ${
                            getFieldError(`rental-${index}-zipCode`)
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="78701"
                        />
                        <ValidationError message={getFieldError(`rental-${index}-zipCode`)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Type
                      </label>
                      <select
                        value={property.propertyType}
                        onChange={(e) => updateProperty(index, { propertyType: e.target.value as any })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="single-family">Single Family</option>
                        <option value="multi-family">Multi-Family</option>
                        <option value="vacation">Vacation/Short-term</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days Rented
                      </label>
                      <input
                        type="number"
                        value={property.daysRented}
                        onChange={(e) => updateProperty(index, { daysRented: Math.max(0, Math.min(365, parseInt(e.target.value) || 0)) })}
                        onBlur={() => touchField(`rental-${index}-daysRented`)}
                        min="0"
                        max="365"
                        className={`w-full rounded-md shadow-sm ${
                          getFieldError(`rental-${index}-daysRented`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                      />
                      <ValidationError message={getFieldError(`rental-${index}-daysRented`)} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days Personal Use
                      </label>
                      <input
                        type="number"
                        value={property.daysPersonalUse}
                        onChange={(e) => updateProperty(index, { daysPersonalUse: Math.max(0, parseInt(e.target.value) || 0) })}
                        onBlur={() => touchField(`rental-${index}-daysPersonalUse`)}
                        min="0"
                        className={`w-full rounded-md shadow-sm ${
                          getFieldError(`rental-${index}-daysPersonalUse`)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                      />
                      <ValidationError message={getFieldError(`rental-${index}-daysPersonalUse`)} />
                    </div>
                  </div>
                </div>

                {/* Income Section */}
                <div>
                  <h4 className="font-semibold mb-3">Rental Income</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Rental Income Received
                      </label>
                      <CurrencyInput
                        value={property.rentalIncome}
                        onValueChange={(val) => updateProperty(index, { rentalIncome: val })}
                        onBlur={() => touchField(`rental-${index}-rentalIncome`)}
                        placeholder="0.00"
                      />
                      <ValidationError message={getFieldError(`rental-${index}-rentalIncome`)} />
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="font-semibold mb-3">Expenses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'advertising', label: 'Advertising' },
                      { key: 'auto', label: 'Auto and Travel' },
                      { key: 'cleaning', label: 'Cleaning and Maintenance' },
                      { key: 'commissions', label: 'Commissions' },
                      { key: 'insurance', label: 'Insurance' },
                      { key: 'legal', label: 'Legal and Professional Fees' },
                      { key: 'management', label: 'Management Fees' },
                      { key: 'mortgage', label: 'Mortgage Interest' },
                      { key: 'repairs', label: 'Repairs' },
                      { key: 'supplies', label: 'Supplies' },
                      { key: 'taxes', label: 'Taxes' },
                      { key: 'utilities', label: 'Utilities' },
                      { key: 'depreciation', label: 'Depreciation' },
                      { key: 'other', label: 'Other Expenses' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                        </label>
                        <CurrencyInput
                          value={property.expenses[key as keyof RentalExpenses]}
                          onValueChange={(val) => updateExpense(index, key as keyof RentalExpenses, val)}
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Summary */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Rental Income</p>
                      <p className="font-semibold text-lg">{formatCurrency(property.rentalIncome)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Expenses</p>
                      <p className="font-semibold text-lg">{formatCurrency(metrics.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Rental Income</p>
                      <p className={`font-semibold text-lg ${metrics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.netIncome)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary Section */}
          {values.length > 1 && (
            <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
              <h3 className="text-xl font-bold mb-4">Rental Summary (All Properties)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-700 font-medium mb-2">Total Rental Income</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalRentalIncome)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-2">Net Rental Income/Loss</p>
                  <p className={`text-2xl font-bold ${summary.netRentalIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netRentalIncome)}
                  </p>
                </div>
              </div>
              {summary.netRentalIncome < 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>💡 <strong>Note:</strong> Rental losses may be subject to passive activity loss limitations. 
                  Consult IRS Publication 925 or a tax professional for guidance on loss deductibility.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
