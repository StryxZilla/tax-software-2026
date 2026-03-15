'use client';

import React from 'react';
import { EducationExpenses } from '../../types/tax-types';
import { Plus, Trash2, GraduationCap, DollarSign, Award, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { validateEducationExpense } from '../../lib/validation/form-validation';
import ValidationError from '../common/ValidationError';

interface CreditsFormProps {
  educationExpenses: EducationExpenses[];
  onEducationExpensesChange: (values: EducationExpenses[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function CreditsForm({ 
  educationExpenses, 
  onEducationExpensesChange,
  onValidationChange
}: CreditsFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Validate all education expenses
  const allErrors = educationExpenses.flatMap((exp, index) => validateEducationExpense(exp, index));
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
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
    }`;
  };
  const addEducationExpense = () => {
    onEducationExpensesChange([...educationExpenses, {
      studentName: '',
      ssn: '',
      institution: '',
      tuitionAndFees: 0,
      isFirstFourYears: false,
    }]);
  };

  const updateEducationExpense = (index: number, updates: Partial<EducationExpenses>) => {
    const newValues = [...educationExpenses];
    newValues[index] = { ...newValues[index], ...updates };
    onEducationExpensesChange(newValues);
  };

  const removeEducationExpense = (index: number) => {
    onEducationExpensesChange(educationExpenses.filter((_, i) => i !== index));
  };

  const estimateEducationCredit = (expense: EducationExpenses): { type: string; amount: number } => {
    if (!expense.tuitionAndFees || expense.tuitionAndFees <= 0) {
      return { type: 'None', amount: 0 };
    }

    if (expense.isFirstFourYears) {
      // American Opportunity Credit: 100% of first $2,000, 25% of next $2,000 (max $2,500)
      const credit = Math.min(
        2000 + Math.max(0, (expense.tuitionAndFees - 2000) * 0.25),
        2500
      );
      return { type: 'American Opportunity Credit', amount: Math.round(credit) };
    } else {
      // Lifetime Learning Credit: 20% of first $10,000 (max $2,000)
      const credit = Math.min(expense.tuitionAndFees * 0.20, 2000);
      return { type: 'Lifetime Learning Credit', amount: Math.round(credit) };
    }
  };

  const totalEstimatedCredits = educationExpenses.reduce((sum, expense) => {
    const { amount } = estimateEducationCredit(expense);
    return sum + amount;
  }, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Tax Credits (Form 8863)</h2>
        <p className="text-slate-600">Tax credits directly reduce the amount of tax you owe, dollar-for-dollar.</p>
      </div>

      {/* Credit summary */}
      {educationExpenses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8" />
              <div>
                <p className="text-blue-100 text-sm font-medium">Estimated Education Credits</p>
                <p className="text-3xl font-bold">${totalEstimatedCredits.toFixed(0)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">{educationExpenses.length} {educationExpenses.length === 1 ? 'Student' : 'Students'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation summary */}
      {showAllErrors && !isValid && educationExpenses.length > 0 && (
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

      {/* Education Credits Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span>Education Credits</span>
            </h3>
            <p className="text-slate-600">American Opportunity Credit or Lifetime Learning Credit</p>
          </div>
          <button
            type="button"
            onClick={addEducationExpense}
            aria-label="Add education expense"
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>

        {educationExpenses.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Education Expenses Added</h3>
            <p className="text-slate-500 mb-6">Add education expenses to claim the American Opportunity Credit or Lifetime Learning Credit.</p>
            <button
              type="button"
              onClick={addEducationExpense}
              aria-label="Add first education expense"
              className="inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Education Expenses</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {educationExpenses.map((expense, index) => {
              const estimate = estimateEducationCredit(expense);

              return (
                <div key={index} className="card-premium overflow-hidden border border-slate-200">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 text-white">
                      <GraduationCap className="w-5 h-5" />
                      <h3 className="text-lg font-bold">Student #{index + 1}</h3>
                      {expense.studentName && <span className="text-blue-100">• {expense.studentName}</span>}
                      {estimate.amount > 0 && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          ${estimate.amount} credit
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducationExpense(index)}
                      aria-label={`Remove student ${index + 1}`}
                      className="flex items-center space-x-2 text-red-100 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-6">
                    {/* Student Information */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                        Student Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Student Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={expense.studentName}
                            onChange={(e) => updateEducationExpense(index, { studentName: e.target.value })}
                            onBlur={() => touchField(`education-${index}-name`)}
                            placeholder="Full name"
                            className={getInputClassName(`education-${index}-name`)}
                          />
                          <ValidationError message={getFieldError(`education-${index}-name`)} />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Student SSN <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={expense.ssn}
                            onChange={(e) => updateEducationExpense(index, { ssn: e.target.value })}
                            onBlur={() => touchField(`education-${index}-ssn`)}
                            placeholder="XXX-XX-XXXX"
                            className={getInputClassName(`education-${index}-ssn`)}
                          />
                          <ValidationError message={getFieldError(`education-${index}-ssn`)} />
                          {!getFieldError(`education-${index}-ssn`) && (
                            <p className="mt-1 text-xs text-slate-500 italic">Example: 123-45-6789</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Educational Institution <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={expense.institution}
                            onChange={(e) => updateEducationExpense(index, { institution: e.target.value })}
                            onBlur={() => touchField(`education-${index}-institution`)}
                            placeholder="e.g., University of Texas at Austin"
                            className={getInputClassName(`education-${index}-institution`)}
                          />
                          <ValidationError message={getFieldError(`education-${index}-institution`)} />
                        </div>
                      </div>
                    </div>

                    {/* Education Type */}
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                        Education Level
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                          style={{ borderColor: expense.isFirstFourYears ? '#2563eb' : '#e2e8f0' }}
                        >
                          <input
                            type="radio"
                            name={`education-type-${index}`}
                            checked={expense.isFirstFourYears}
                            onChange={() => updateEducationExpense(index, { isFirstFourYears: true })}
                            className="mt-1 text-blue-600 focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 mb-1">
                              First Four Years of College (Undergraduate)
                            </div>
                            <div className="text-sm text-slate-600">
                              Qualifies for <strong>American Opportunity Credit</strong> - Up to $2,500 per student. 
                              40% refundable. Available for first 4 years of post-secondary education.
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                          style={{ borderColor: !expense.isFirstFourYears ? '#2563eb' : '#e2e8f0' }}
                        >
                          <input
                            type="radio"
                            name={`education-type-${index}`}
                            checked={!expense.isFirstFourYears}
                            onChange={() => updateEducationExpense(index, { isFirstFourYears: false })}
                            className="mt-1 text-blue-600 focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 mb-1">
                              Graduate School or Other Post-Secondary
                            </div>
                            <div className="text-sm text-slate-600">
                              Qualifies for <strong>Lifetime Learning Credit</strong> - Up to $2,000 per return (not per student). 
                              Non-refundable. Available for undergraduate, graduate, and professional degree courses.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Expenses */}
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span>Qualified Education Expenses</span>
                      </h4>
                      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Tuition and Fees Paid in 2025 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-slate-600 font-bold text-xl">$</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={expense.tuitionAndFees || ''}
                            onChange={(e) => updateEducationExpense(index, { tuitionAndFees: parseFloat(e.target.value) || 0 })}
                            onBlur={() => touchField(`education-${index}-tuition`)}
                            className={`pl-10 text-2xl font-bold py-4 ${getInputClassName(`education-${index}-tuition`)}`}
                            placeholder="0.00"
                          />
                        </div>
                        <ValidationError message={getFieldError(`education-${index}-tuition`)} />
                        {!getFieldError(`education-${index}-tuition`) && (
                          <p className="mt-3 text-xs text-slate-600">
                            Include tuition and required fees only. Do NOT include room and board, books (unless required to be purchased from the school), 
                            or transportation costs.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Credit Estimate */}
                    {estimate.amount > 0 && (
                      <div className="border-t pt-6">
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-green-900 mb-1">Estimated Credit</h4>
                              <p className="text-sm text-green-800 mb-2">
                                Based on ${expense.tuitionAndFees.toFixed(0)} in qualified expenses, you may be eligible for:
                              </p>
                              <div className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-900">{estimate.type}</span>
                                  <span className="text-2xl font-bold text-green-700">${estimate.amount}</span>
                                </div>
                              </div>
                              {expense.isFirstFourYears && (
                                <p className="text-xs text-green-700 mt-2">
                                  <strong>Up to 40% refundable:</strong> Even if you don't owe taxes, you may receive up to ${Math.round(estimate.amount * 0.4)} as a refund.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Information boxes */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Education Credit Requirements</span>
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              <strong>American Opportunity Credit:</strong>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>Student must be pursuing a degree or credential</li>
                <li>Enrolled at least half-time for at least one academic period</li>
                <li>Available for first 4 years of post-secondary education only</li>
                <li>Student cannot have completed 4 years of higher education before 2025</li>
                <li>No felony drug convictions</li>
                <li>Income limits apply (phases out starting at $80,000 single, $160,000 married)</li>
              </ul>
            </div>
            <div className="mt-2">
              <strong>Lifetime Learning Credit:</strong>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>No limit on number of years claimed</li>
                <li>Available for undergraduate, graduate, and professional degree courses</li>
                <li>No minimum enrollment requirement</li>
                <li>Up to $2,000 credit per tax return (not per student)</li>
                <li>Income limits apply (phases out starting at $80,000 single, $160,000 married)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Other Common Tax Credits (Not Currently Supported)</span>
          </h4>
          <p className="text-sm text-amber-800 mb-2">
            This simplified version currently supports education credits only. Additional credits that may apply to your return:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li><strong>Child Tax Credit:</strong> Automatically calculated from dependents (up to $2,000 per child under 17)</li>
            <li><strong>Earned Income Tax Credit (EITC):</strong> For low to moderate income workers</li>
            <li><strong>Child and Dependent Care Credit:</strong> For daycare and care expenses</li>
            <li><strong>Retirement Savings Contributions Credit (Saver's Credit):</strong> For IRA/401(k) contributions</li>
            <li><strong>Electric Vehicle Credit:</strong> Up to $7,500 for qualifying new EVs</li>
            <li><strong>Residential Energy Credit:</strong> For solar panels, heat pumps, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
