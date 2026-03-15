'use client';

import React from 'react';
import { Dependent } from '../../types/tax-types';
import { Plus, Trash2, Users, Baby, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { validateDependent } from '../../lib/validation/form-validation';
import ValidationError from '../common/ValidationError';

interface DependentsFormProps {
  values: Dependent[];
  onChange: (values: Dependent[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function DependentsForm({ values, onChange, onValidationChange }: DependentsFormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Validate all dependents
  const allErrors = values.flatMap((dep, index) => validateDependent(dep, index));
  const isValid = allErrors.length === 0;

  // Notify parent of validation state
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

  const getInputClassName = (fieldName: string, baseColor = 'purple') => {
    const hasError = getFieldError(fieldName);
    return `block w-full rounded-lg shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : `border-slate-300 focus:border-${baseColor}-600 focus:ring-${baseColor}-600`
    }`;
  };
  const addDependent = () => {
    onChange([...values, {
      firstName: '',
      lastName: '',
      ssn: '',
      relationshipToTaxpayer: '',
      birthDate: '',
      isQualifyingChildForCTC: false,
      monthsLivedWithTaxpayer: 12,
    }]);
  };

  const updateDependent = (index: number, updates: Partial<Dependent>) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], ...updates };
    onChange(newValues);
  };

  const removeDependent = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isQualifyingChild = (dependent: Dependent): boolean => {
    const age = calculateAge(dependent.birthDate);
    // Qualifying child must be under 17 at end of tax year (2025)
    return age < 17 && dependent.monthsLivedWithTaxpayer >= 6;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Dependents (Schedule 8812)</h2>
          <p className="text-slate-600">Add all dependents you're claiming on your 2025 tax return.</p>
        </div>
        <button
          type="button"
          onClick={addDependent}
          aria-label="Add dependent"
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Dependent</span>
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
        <div className="card-premium p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Dependents Added Yet</h3>
          <p className="text-slate-500 mb-6">Add dependents to claim the Child Tax Credit and other benefits.</p>
          <button
            type="button"
            onClick={addDependent}
            aria-label="Add first dependent"
            className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Dependent</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {values.map((dependent, index) => {
            const age = calculateAge(dependent.birthDate);
            const qualifiesForCTC = isQualifyingChild(dependent);

            return (
              <div key={index} className="card-premium overflow-hidden border border-slate-200">
                {/* Card header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-3 text-white">
                    <Baby className="w-5 h-5" />
                    <h3 className="text-lg font-bold">Dependent #{index + 1}</h3>
                    {dependent.firstName && <span className="text-purple-100">• {dependent.firstName} {dependent.lastName}</span>}
                    {qualifiesForCTC && (
                      <span className="flex items-center space-x-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Eligible for CTC</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDependent(index)}
                    aria-label={`Remove dependent ${index + 1}`}
                    className="flex items-center space-x-2 text-red-100 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Remove</span>
                  </button>
                </div>

                {/* Card body */}
                <div className="p-6 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Personal Information</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={dependent.firstName}
                          onChange={(e) => updateDependent(index, { firstName: e.target.value })}
                          onBlur={() => touchField(`dependent-${index}-firstName`)}
                          placeholder="First name"
                          className={getInputClassName(`dependent-${index}-firstName`)}
                        />
                        <ValidationError message={getFieldError(`dependent-${index}-firstName`)} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={dependent.lastName}
                          onChange={(e) => updateDependent(index, { lastName: e.target.value })}
                          onBlur={() => touchField(`dependent-${index}-lastName`)}
                          placeholder="Last name"
                          className={getInputClassName(`dependent-${index}-lastName`)}
                        />
                        <ValidationError message={getFieldError(`dependent-${index}-lastName`)} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Social Security Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={dependent.ssn}
                          onChange={(e) => updateDependent(index, { ssn: e.target.value })}
                          onBlur={() => touchField(`dependent-${index}-ssn`)}
                          placeholder="XXX-XX-XXXX"
                          className={getInputClassName(`dependent-${index}-ssn`)}
                        />
                        <ValidationError message={getFieldError(`dependent-${index}-ssn`)} />
                        {!getFieldError(`dependent-${index}-ssn`) && (
                          <p className="mt-1 text-xs text-slate-500 italic">Example: 123-45-6789</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Relationship to You <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={dependent.relationshipToTaxpayer}
                          onChange={(e) => updateDependent(index, { relationshipToTaxpayer: e.target.value })}
                          onBlur={() => touchField(`dependent-${index}-relationship`)}
                          className={getInputClassName(`dependent-${index}-relationship`)}
                        >
                          <option value="">Select relationship</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Stepchild">Stepchild</option>
                          <option value="Foster child">Foster child</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Grandchild">Grandchild</option>
                          <option value="Parent">Parent</option>
                          <option value="Other">Other</option>
                        </select>
                        <ValidationError message={getFieldError(`dependent-${index}-relationship`)} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>Birth Date <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          value={dependent.birthDate}
                          onChange={(e) => {
                            updateDependent(index, { 
                              birthDate: e.target.value,
                              isQualifyingChildForCTC: isQualifyingChild({ ...dependent, birthDate: e.target.value })
                            });
                          }}
                          onBlur={() => touchField(`dependent-${index}-birthDate`)}
                          className={getInputClassName(`dependent-${index}-birthDate`)}
                        />
                        <ValidationError message={getFieldError(`dependent-${index}-birthDate`)} />
                        {dependent.birthDate && !getFieldError(`dependent-${index}-birthDate`) && (
                          <p className="mt-1 text-xs text-slate-600">Age: {age} years old</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Months Lived With You in 2025 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={dependent.monthsLivedWithTaxpayer}
                          onChange={(e) => {
                            const months = parseInt(e.target.value) || 0;
                            updateDependent(index, { 
                              monthsLivedWithTaxpayer: Math.max(0, Math.min(12, months)),
                              isQualifyingChildForCTC: isQualifyingChild({ ...dependent, monthsLivedWithTaxpayer: months })
                            });
                          }}
                          className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-purple-600 focus:ring-purple-600"
                        />
                        <p className="mt-1 text-xs text-slate-500 italic">Must live with you for more than half the year (6+ months) for Child Tax Credit</p>
                      </div>
                    </div>
                  </div>

                  {/* Child Tax Credit Eligibility */}
                  <div className="border-t pt-6">
                    <div className={`p-4 rounded-lg border-2 ${qualifiesForCTC ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                      <div className="flex items-start space-x-3">
                        {qualifiesForCTC ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-green-900 mb-1">Qualifies for Child Tax Credit</h4>
                              <p className="text-sm text-green-800">
                                This dependent is under 17 and lived with you for at least 6 months. You may be eligible for up to <strong>$2,000</strong> in Child Tax Credit.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Baby className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-amber-900 mb-1">
                                {age >= 17 ? 'Does Not Qualify for Child Tax Credit' : 'May Qualify with Adjustments'}
                              </h4>
                              <p className="text-sm text-amber-800">
                                {age >= 17 
                                  ? 'Dependent is 17 or older. May qualify for Credit for Other Dependents ($500).'
                                  : 'Dependent must live with you for at least 6 months to qualify for Child Tax Credit.'
                                }
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Information box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>Who Qualifies as a Dependent?</span>
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Qualifying Child:</strong> Under 17, related to you, lived with you for more than half the year, and you provided more than half their support</li>
          <li><strong>Qualifying Relative:</strong> Any age, related or lived with you all year, made less than $5,050 in 2025, and you provided more than half their support</li>
          <li><strong>Child Tax Credit:</strong> $2,000 per qualifying child under 17</li>
          <li><strong>Credit for Other Dependents:</strong> $500 for dependents who don't qualify for CTC</li>
        </ul>
      </div>
    </div>
  );
}
