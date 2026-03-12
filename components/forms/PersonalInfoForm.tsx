'use client';

import React from 'react';
import { PersonalInfo, FilingStatus } from '../../types/tax-types';
import { User, MapPin, Heart, AlertCircle } from 'lucide-react';
import { validatePersonalInfo, validateSSN } from '../../lib/validation/form-validation';
import { useFormValidation } from '../../lib/hooks/useFormValidation';
import ValidationError from '../common/ValidationError';

const filingStatusOptions: FilingStatus[] = [
  'Single',
  'Married Filing Jointly',
  'Married Filing Separately',
  'Head of Household',
  'Qualifying Surviving Spouse',
];

interface PersonalInfoFormProps {
  value: PersonalInfo;
  onChange: (updates: Partial<PersonalInfo>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function PersonalInfoForm({ value, onChange, onValidationChange }: PersonalInfoFormProps) {
  const validation = useFormValidation(
    () => validatePersonalInfo(value),
    [value]
  );

  // Notify parent of validation state changes
  React.useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  const formatSSNInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const parseAgeInput = (rawValue: string): number => {
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(120, parsed));
  };

  const formatAgeDisplay = (age: unknown): string => {
    const parsed = typeof age === 'number' ? age : Number.parseInt(String(age ?? ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return '';
    return String(Math.max(0, Math.min(120, parsed)));
  };

  const handleChange = (field: keyof PersonalInfo, newValue: any) => {
    const nextValue = field === 'ssn' && typeof newValue === 'string'
      ? formatSSNInput(newValue)
      : newValue;

    onChange({ [field]: nextValue });

    if (field === 'ssn' && typeof nextValue === 'string' && nextValue.length > 0) {
      validation.touchField('ssn');
    }
  };

  const getInputClassName = (fieldName: string) => {
    const hasError = validation.getFieldError(fieldName);
    return `mt-1 block w-full rounded-lg shadow-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
    }`;
  };

  const getSsnFeedbackMessage = (ssn: string) => {
    if (!ssn) return undefined;
    if (validateSSN(ssn)) return undefined;

    const digitsEntered = ssn.replace(/\D/g, '').length;
    if (digitsEntered < 9) {
      return `Keep typing: ${digitsEntered}/9 digits entered`;
    }

    return 'SSN must be in format XXX-XX-XXXX';
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Personal Information</h2>
        <p className="text-slate-600">Let's start with your basic information for your tax return.</p>
      </div>

      {/* Validation summary (only show if attempted to proceed with errors) */}
      {validation.showAllErrors && !validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Basic Information Card */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center space-x-2 text-slate-700 border-b pb-3 mb-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => validation.touchField('firstName')}
              placeholder="Enter first name"
              className={getInputClassName('firstName')}
            />
            <ValidationError message={validation.getFieldError('firstName')} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => validation.touchField('lastName')}
              placeholder="Enter last name"
              className={getInputClassName('lastName')}
            />
            <ValidationError message={validation.getFieldError('lastName')} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Social Security Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.ssn}
              onChange={(e) => handleChange('ssn', e.target.value)}
              onBlur={() => validation.touchField('ssn')}
              placeholder="XXX-XX-XXXX"
              className={getInputClassName('ssn')}
            />
            <ValidationError message={getSsnFeedbackMessage(value.ssn) || validation.getFieldError('ssn')} />
            {!getSsnFeedbackMessage(value.ssn) && !validation.getFieldError('ssn') && (
              <p className="mt-1 text-xs text-slate-500">Your information is secure and encrypted</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filing Status <span className="text-red-500">*</span>
            </label>
            <select
              value={value.filingStatus}
              onChange={(e) => handleChange('filingStatus', e.target.value)}
              className={getInputClassName('filingStatus')}
            >
              {filingStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formatAgeDisplay(value.age)}
              onChange={(e) => handleChange('age', parseAgeInput(e.target.value))}
              onBlur={() => validation.touchField('age')}
              placeholder="Your age"
              className={getInputClassName('age')}
            />
            <ValidationError message={validation.getFieldError('age')} />
          </div>

          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              id="isBlind"
              checked={value.isBlind}
              onChange={(e) => handleChange('isBlind', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 transition-all"
            />
            <label htmlFor="isBlind" className="ml-3 text-sm font-medium text-slate-700">
              I am legally blind
            </label>
          </div>
        </div>
      </div>

      {/* Address Information Card */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center space-x-2 text-slate-700 border-b pb-3 mb-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Address</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => validation.touchField('address')}
              placeholder="123 Main Street"
              className={getInputClassName('address')}
            />
            <ValidationError message={validation.getFieldError('address')} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => handleChange('city', e.target.value)}
              onBlur={() => validation.touchField('city')}
              placeholder="City name"
              className={getInputClassName('city')}
            />
            <ValidationError message={validation.getFieldError('city')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                onBlur={() => validation.touchField('state')}
                placeholder="TX"
                maxLength={2}
                className={getInputClassName('state')}
              />
              <ValidationError message={validation.getFieldError('state')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                onBlur={() => validation.touchField('zipCode')}
                placeholder="12345"
                className={getInputClassName('zipCode')}
              />
              <ValidationError message={validation.getFieldError('zipCode')} />
            </div>
          </div>
        </div>
      </div>

      {/* Spouse Information (conditional) */}
      {value.filingStatus === 'Married Filing Jointly' && (
        <div className="card-premium p-6 space-y-6 border-2 border-blue-100">
          <div className="flex items-center space-x-2 text-slate-700 border-b pb-3 mb-2">
            <Heart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Spouse Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Spouse First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.spouseInfo?.firstName || ''}
                onChange={(e) => handleChange('spouseInfo', { 
                  ...value.spouseInfo,
                  firstName: e.target.value 
                })}
                onBlur={() => validation.touchField('spouseFirstName')}
                placeholder="Enter spouse's first name"
                className={getInputClassName('spouseFirstName')}
              />
              <ValidationError message={validation.getFieldError('spouseFirstName')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Spouse Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.spouseInfo?.lastName || ''}
                onChange={(e) => handleChange('spouseInfo', { 
                  ...value.spouseInfo,
                  lastName: e.target.value 
                })}
                onBlur={() => validation.touchField('spouseLastName')}
                placeholder="Enter spouse's last name"
                className={getInputClassName('spouseLastName')}
              />
              <ValidationError message={validation.getFieldError('spouseLastName')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Spouse SSN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.spouseInfo?.ssn || ''}
                onChange={(e) => {
                  const formattedSpouseSSN = formatSSNInput(e.target.value);
                  handleChange('spouseInfo', { 
                    ...value.spouseInfo,
                    ssn: formattedSpouseSSN
                  });

                  if (formattedSpouseSSN.length > 0) {
                    validation.touchField('spouseSSN');
                  }
                }}
                onBlur={() => validation.touchField('spouseSSN')}
                placeholder="XXX-XX-XXXX"
                className={getInputClassName('spouseSSN')}
              />
              <ValidationError message={validation.getFieldError('spouseSSN')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Spouse Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formatAgeDisplay(value.spouseInfo?.age)}
                onChange={(e) => handleChange('spouseInfo', {
                  ...value.spouseInfo,
                  age: parseAgeInput(e.target.value)
                })}
                onBlur={() => validation.touchField('spouseAge')}
                placeholder="Spouse's age"
                className={getInputClassName('spouseAge')}
              />
              <ValidationError message={validation.getFieldError('spouseAge')} />
            </div>

            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="spouseIsBlind"
                checked={value.spouseInfo?.isBlind || false}
                onChange={(e) => handleChange('spouseInfo', { 
                  ...value.spouseInfo,
                  isBlind: e.target.checked 
                })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 transition-all"
              />
              <label htmlFor="spouseIsBlind" className="ml-3 text-sm font-medium text-slate-700">
                Spouse is legally blind
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export validation function for use by parent
export { validatePersonalInfo };
