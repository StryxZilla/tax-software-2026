'use client';

import React from 'react';
import { SelfEmploymentIncome, ScheduleCExpenses } from '../../types/tax-types';
import { validateScheduleC } from '../../lib/validation/form-validation';
import { AlertCircle } from 'lucide-react';
import ValidationError from '../common/ValidationError';
import CurrencyInput from '../common/CurrencyInput';

interface ScheduleCFormProps {
  value?: SelfEmploymentIncome;
  onChange: (value: SelfEmploymentIncome) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function ScheduleCForm({ value, onChange, onValidationChange }: ScheduleCFormProps) {
  const [showAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const [accountingMethod, setAccountingMethod] = React.useState<'cash' | 'accrual'>('cash');
  // Initialize with default values if not provided
  const formData = value || {
    businessName: '',
    ein: '',
    businessCode: '',
    grossReceipts: 0,
    returns: 0,
    costOfGoodsSold: 0,
    expenses: {
      advertising: 0,
      carAndTruck: 0,
      commissions: 0,
      contractLabor: 0,
      depletion: 0,
      depreciation: 0,
      employeeBenefitPrograms: 0,
      insurance: 0,
      interest: 0,
      legal: 0,
      officeExpense: 0,
      pension: 0,
      rentLease: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: 0,
      mealsAndEntertainment: 0,
      utilities: 0,
      wages: 0,
      other: 0,
    },
  };

  // Validation
  const errors = validateScheduleC(formData);
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
    return `mt-1 block w-full rounded-md shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;
  };

  // Calculate derived values
  const grossIncome = formData.grossReceipts - formData.returns - formData.costOfGoodsSold;

  const expenses = formData.expenses;
  // Meals are only 50% deductible
  const deductibleMeals = expenses.mealsAndEntertainment * 0.5;
  const otherExpenses = Object.entries(expenses)
    .filter(([key]) => key !== 'mealsAndEntertainment')
    .reduce((sum, [, value]) => sum + value, 0);
  const totalExpenses = otherExpenses + deductibleMeals;

  const netProfit = grossIncome - totalExpenses;

  const updateBusinessInfo = (updates: Partial<Omit<SelfEmploymentIncome, 'expenses'>>) => {
    onChange({
      ...formData,
      ...updates,
    });
  };

  const updateExpense = (expenseKey: keyof ScheduleCExpenses, value: number) => {
    onChange({
      ...formData,
      expenses: {
        ...formData.expenses,
        [expenseKey]: value,
      },
    });
  };

  const formatEIN = (ein: string) => {
    // Remove all non-digits
    const digits = ein.replace(/\D/g, '');
    // Format as XX-XXXXXXX
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  };

  const handleEINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEIN(e.target.value);
    updateBusinessInfo({ ein: formatted });
  };

  const formatBusinessCode = (code: string) => {
    // Only allow 6 digits
    return code.replace(/\D/g, '').slice(0, 6);
  };

  const handleBusinessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessCode(e.target.value);
    updateBusinessInfo({ businessCode: formatted });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">Self-Employment Income & Expenses</h2>

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

      {/* Business Information Section */}
      <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => updateBusinessInfo({ businessName: e.target.value })}
              onBlur={() => touchField('scheduleC-businessName')}
              className={getInputClassName('scheduleC-businessName')}
              placeholder="Enter your business name"
            />
            <ValidationError message={getFieldError('scheduleC-businessName')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              EIN (Optional)
            </label>
            <input
              type="text"
              value={formData.ein || ''}
              onChange={handleEINChange}
              onBlur={() => touchField('scheduleC-ein')}
              placeholder="XX-XXXXXXX"
              maxLength={10}
              className={getInputClassName('scheduleC-ein')}
            />
            <ValidationError message={getFieldError('scheduleC-ein')} />
            {!getFieldError('scheduleC-ein') && (
              <p className="mt-1 text-xs text-gray-500">Format: XX-XXXXXXX</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Code
            </label>
            <input
              type="text"
              value={formData.businessCode}
              onChange={handleBusinessCodeChange}
              placeholder="6-digit code"
              maxLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              <a href="https://www.irs.gov/instructions/i1040sc#en_US_2024_publink100033757" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Find your business code
              </a>
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Accounting Method
            </label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="accountingMethod"
                  value="cash"
                  checked={accountingMethod === 'cash'}
                  onChange={() => setAccountingMethod('cash')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Cash (most common for freelancers)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="accountingMethod"
                  value="accrual"
                  checked={accountingMethod === 'accrual'}
                  onChange={() => setAccountingMethod('accrual')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Accrual</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">Most sole proprietors and freelancers use the cash method</p>
          </div>
        </div>
      </div>

      {/* Income Section */}
      <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Income</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gross Receipts or Sales
            </label>
            <CurrencyInput
              value={formData.grossReceipts}
              onValueChange={(grossReceipts) => updateBusinessInfo({ grossReceipts })}
              onBlur={() => touchField('scheduleC-grossReceipts')}
              min="0"
              inputClassName={getInputClassName('scheduleC-grossReceipts')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('scheduleC-grossReceipts')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Returns and Allowances
            </label>
            <CurrencyInput
              value={formData.returns}
              onValueChange={(returns) => updateBusinessInfo({ returns })}
              onBlur={() => touchField('scheduleC-returns')}
              min="0"
              inputClassName={getInputClassName('scheduleC-returns')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('scheduleC-returns')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cost of Goods Sold
            </label>
            <CurrencyInput
              value={formData.costOfGoodsSold}
              onValueChange={(costOfGoodsSold) => updateBusinessInfo({ costOfGoodsSold })}
              onBlur={() => touchField('scheduleC-cogs')}
              min="0"
              inputClassName={getInputClassName('scheduleC-cogs')}
              placeholder="0.00"
            />
            <ValidationError message={getFieldError('scheduleC-cogs')} />
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-blue-900">
              Gross Income
            </label>
            <div className="mt-1 text-2xl font-bold text-blue-900">
              ${grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-blue-700">
              Gross Receipts - Returns - Cost of Goods Sold
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Expenses</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advertising
            </label>
            <CurrencyInput
              value={formData.expenses.advertising}
              onValueChange={(val) => updateExpense('advertising', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Car and Truck Expenses
            </label>
            <CurrencyInput
              value={formData.expenses.carAndTruck}
              onValueChange={(val) => updateExpense('carAndTruck', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Commissions and Fees
            </label>
            <CurrencyInput
              value={formData.expenses.commissions}
              onValueChange={(val) => updateExpense('commissions', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contract Labor
            </label>
            <CurrencyInput
              value={formData.expenses.contractLabor}
              onValueChange={(val) => updateExpense('contractLabor', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Depletion
            </label>
            <CurrencyInput
              value={formData.expenses.depletion}
              onValueChange={(val) => updateExpense('depletion', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Depreciation
            </label>
            <CurrencyInput
              value={formData.expenses.depreciation}
              onValueChange={(val) => updateExpense('depreciation', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employee Benefit Programs
            </label>
            <CurrencyInput
              value={formData.expenses.employeeBenefitPrograms}
              onValueChange={(val) => updateExpense('employeeBenefitPrograms', val)}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">Health insurance, life insurance, and other employee benefit programs</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pension and Profit-Sharing Plans
            </label>
            <CurrencyInput
              value={formData.expenses.pension}
              onValueChange={(val) => updateExpense('pension', val)}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">Contributions to employee retirement plans (e.g., SEP-IRA, SIMPLE IRA)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Insurance (other than health)
            </label>
            <CurrencyInput
              value={formData.expenses.insurance}
              onValueChange={(val) => updateExpense('insurance', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Interest (Mortgage, Other)
            </label>
            <CurrencyInput
              value={formData.expenses.interest}
              onValueChange={(val) => updateExpense('interest', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Legal and Professional Services
            </label>
            <CurrencyInput
              value={formData.expenses.legal}
              onValueChange={(val) => updateExpense('legal', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Office Expense
            </label>
            <CurrencyInput
              value={formData.expenses.officeExpense}
              onValueChange={(val) => updateExpense('officeExpense', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rent or Lease
            </label>
            <CurrencyInput
              value={formData.expenses.rentLease}
              onValueChange={(val) => updateExpense('rentLease', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Repairs and Maintenance
            </label>
            <CurrencyInput
              value={formData.expenses.repairs}
              onValueChange={(val) => updateExpense('repairs', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplies
            </label>
            <CurrencyInput
              value={formData.expenses.supplies}
              onValueChange={(val) => updateExpense('supplies', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Taxes and Licenses
            </label>
            <CurrencyInput
              value={formData.expenses.taxes}
              onValueChange={(val) => updateExpense('taxes', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Travel
            </label>
            <CurrencyInput
              value={formData.expenses.travel}
              onValueChange={(val) => updateExpense('travel', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Meals and Entertainment
            </label>
            <CurrencyInput
              value={formData.expenses.mealsAndEntertainment}
              onValueChange={(val) => updateExpense('mealsAndEntertainment', val)}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ Only 50% of meals are deductible (calculated automatically)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Utilities
            </label>
            <CurrencyInput
              value={formData.expenses.utilities}
              onValueChange={(val) => updateExpense('utilities', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Wages (Less Employment Credits)
            </label>
            <CurrencyInput
              value={formData.expenses.wages}
              onValueChange={(val) => updateExpense('wages', val)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Other Expenses
            </label>
            <CurrencyInput
              value={formData.expenses.other}
              onValueChange={(val) => updateExpense('other', val)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Total Expenses Summary */}
        <div className="pt-6 border-t">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Expenses:</span>
              <span className="text-xl font-bold text-gray-900">
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {formData.expenses.mealsAndEntertainment > 0 && (
              <p className="mt-2 text-xs text-gray-600">
                Includes ${(formData.expenses.mealsAndEntertainment * 0.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                {' '}deductible from ${formData.expenses.mealsAndEntertainment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in meals (50% limit)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Net Profit Summary */}
      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Net Profit/Loss</h3>
        
        <div className={`p-6 rounded-lg ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Net Profit:</span>
            <span className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Gross Income (${grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) 
            {' '}- Total Expenses (${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </p>
        </div>

        {/* SE Tax Warning */}
        {netProfit > 400 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Self-Employment Tax Required
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Your net profit exceeds $400, which triggers self-employment tax requirements. 
                    This will be calculated automatically and added to your total tax liability.
                  </p>
                  <p className="mt-2">
                    Estimated SE tax: ~${(netProfit * 0.153 * 0.9235).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
