'use client';

import React from 'react';
import { W2Income } from '../../types/tax-types';
import { Plus, Trash2, Briefcase, Building2, DollarSign, AlertCircle } from 'lucide-react';
import { validateW2 } from '../../lib/validation/form-validation';
import ValidationError from '../common/ValidationError';
import CurrencyInput from '../common/CurrencyInput';
import DocumentUpload from '../ocr/DocumentUpload';
import { extractW2Data } from '../../lib/ocr/extractors/w2-extractor';

function buildW2ExtractionReport(data: Partial<W2Income>) {
  const expectedFields: Array<{ key: keyof W2Income; label: string }> = [
    { key: 'employer', label: 'Employer name (Box c)' },
    { key: 'ein', label: 'Employer EIN (Box b)' },
    { key: 'wages', label: 'Wages (Box 1)' },
    { key: 'federalTaxWithheld', label: 'Federal tax withheld (Box 2)' },
    { key: 'socialSecurityWages', label: 'Social Security wages (Box 3)' },
    { key: 'socialSecurityTaxWithheld', label: 'Social Security tax withheld (Box 4)' },
    { key: 'medicareWages', label: 'Medicare wages (Box 5)' },
    { key: 'medicareTaxWithheld', label: 'Medicare tax withheld (Box 6)' },
  ];

  const foundFields = expectedFields
    .filter(({ key }) => {
      const value = data[key];
      return typeof value === 'number' ? value > 0 : Boolean(value);
    })
    .map(({ label }) => label);

  const missingFields = expectedFields
    .filter(({ key }) => {
      const value = data[key];
      return typeof value === 'number' ? value <= 0 : !value;
    })
    .map(({ label }) => label);

  const warnings: string[] = [];

  if (!data.ein) warnings.push('Employer EIN was not detected; verify Box b manually.');
  if (!data.wages) warnings.push('Box 1 wages were not detected or parsed as 0.');
  if (typeof data.wages === 'number' && typeof data.federalTaxWithheld === 'number' && data.federalTaxWithheld > data.wages) {
    warnings.push('Federal withholding appears higher than wages; double-check OCR values.');
  }

  return {
    documentType: 'W-2',
    expectedFields: expectedFields.map((f) => f.label),
    foundFields,
    missingFields,
    warnings,
    guidance: [
      'Retake the photo with brighter, even lighting and no shadows.',
      'Crop tightly to include only the W-2 form and all box labels.',
      'Use higher contrast and ensure text is sharp before uploading.',
      'If available, upload a clean PDF copy or screenshot page 1 of the PDF at high resolution.',
    ],
  };
}

interface W2FormProps {
  values: W2Income[];
  onChange: (values: W2Income[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  blockedNextAttempts?: number;
}

const formatEIN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};

export default function W2Form({ values, onChange, onValidationChange, blockedNextAttempts = 0 }: W2FormProps) {
  const [showAllErrors, setShowAllErrors] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const summaryRef = React.useRef<HTMLDivElement | null>(null);
  const fieldRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  // Validate all W-2s
  const allErrors = values.flatMap((w2, index) => validateW2(w2, index));
  const isValid = allErrors.length === 0;

  // Notify parent of validation state
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  React.useEffect(() => {
    if (blockedNextAttempts === 0 || isValid) return;

    setShowAllErrors(true);

    // Collect error field names and only update if there are genuinely new fields
    const errorFields = allErrors.map((error) => error.field);
    setTouchedFields((prev) => {
      const hasNew = errorFields.some((f) => !prev.has(f));
      if (!hasNew) return prev; // stable reference — no re-render
      return new Set([...prev, ...errorFields]);
    });

    const firstErrorField = allErrors[0]?.field;
    const firstInvalidInput = firstErrorField ? fieldRefs.current[firstErrorField] : null;

    if (firstInvalidInput) {
      firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => firstInvalidInput.focus(), 150);
      return;
    }

    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedNextAttempts]);

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

  const addW2 = () => {
    onChange([...values, {
      employer: '',
      ein: '',
      wages: 0,
      federalTaxWithheld: 0,
      socialSecurityWages: 0,
      socialSecurityTaxWithheld: 0,
      medicareWages: 0,
      medicareTaxWithheld: 0,
      box12: [],
      box14: [],
    }]);
  };

  const updateW2 = (index: number, updates: Partial<W2Income>) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], ...updates };
    onChange(newValues);
  };

  const removeW2 = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6 fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Wages (Form W-2)</h2>
          <p className="text-slate-600">Add all W-2 forms you received from employers in 2025.</p>
        </div>
        <button
          type="button"
          onClick={addW2}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add W-2</span>
        </button>
      </div>

      {/* OCR Upload */}
      <div className="card-premium p-6">
        {process.env.NEXT_PUBLIC_FEATURE_OCR_UPLOAD === 'true' && (
          <>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload W-2 Image</h3>
            <p className="text-sm text-slate-600 mb-4">
              Take a photo of your W-2 or upload a PDF, and we'll automatically extract the data.
            </p>
            <DocumentUpload
              onExtract={extractW2Data}
              buildReport={buildW2ExtractionReport}
              onDataExtracted={(data) => {
                // Add extracted W-2 to the list
                addW2();
                const newIndex = values.length;
                updateW2(newIndex, data);
              }}
              label="Upload W-2 Document"
            />
          </>
        )}
      </div>

      {/* Validation summary */}
      {showAllErrors && !isValid && (
        <div ref={summaryRef} className="bg-red-50 border border-red-200 rounded-lg p-4">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No W-2s Added Yet</h3>
          <p className="text-slate-500 mb-6">Click "Add W-2" to begin entering your wage information.</p>
          <button
            type="button"
            onClick={addW2}
            className="inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First W-2</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {values.map((w2, index) => (
            <div key={index} className="card-premium overflow-hidden border border-slate-200">
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3 text-white">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-lg font-bold">W-2 #{index + 1}</h3>
                  {w2.employer && <span className="text-blue-100">• {w2.employer}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeW2(index)}
                  className="flex items-center space-x-2 text-red-100 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Remove</span>
                </button>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-6">
                {/* Employer Information */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Employer Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Employer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-employer`] = element;
                        }}
                        type="text"
                        value={w2.employer}
                        onChange={(e) => updateW2(index, { employer: e.target.value })}
                        onBlur={() => touchField(`w2-${index}-employer`)}
                        placeholder="Company name"
                        className={getInputClassName(`w2-${index}-employer`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-employer`)} />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Employer EIN <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-ein`] = element;
                        }}
                        type="text"
                        value={w2.ein}
                        onChange={(e) => updateW2(index, { ein: formatEIN(e.target.value) })}
                        onBlur={() => touchField(`w2-${index}-ein`)}
                        placeholder="XX-XXXXXXX"
                        className={getInputClassName(`w2-${index}-ein`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-ein`)} />
                      {!getFieldError(`w2-${index}-ein`) && (
                        <p className="mt-1 text-xs text-slate-500">Found on box b of your W-2</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Income and Withholding */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>Income and Withholding</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Wages, Tips, Other Compensation <span className="text-red-500">*</span>
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-wages`] = element;
                        }}
                        value={w2.wages}
                        onValueChange={(v) => updateW2(index, { wages: v })}
                        onBlur={() => touchField(`w2-${index}-wages`)}
                        hasError={!!getFieldError(`w2-${index}-wages`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-wages`)} />
                      {!getFieldError(`w2-${index}-wages`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 1 on your W-2 — your total taxable wages for the year</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Federal Income Tax Withheld
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-federalTax`] = element;
                        }}
                        value={w2.federalTaxWithheld}
                        onValueChange={(v) => updateW2(index, { federalTaxWithheld: v })}
                        onBlur={() => touchField(`w2-${index}-federalTax`)}
                        hasError={!!getFieldError(`w2-${index}-federalTax`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-federalTax`)} />
                      {!getFieldError(`w2-${index}-federalTax`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 2 on your W-2 — already-paid tax that counts toward your refund</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Social Security Wages
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-socialSecurityWages`] = element;
                        }}
                        value={w2.socialSecurityWages}
                        onValueChange={(v) => updateW2(index, { socialSecurityWages: v })}
                        onBlur={() => touchField(`w2-${index}-socialSecurityWages`)}
                        hasError={!!getFieldError(`w2-${index}-socialSecurityWages`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-socialSecurityWages`)} />
                      {!getFieldError(`w2-${index}-socialSecurityWages`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 3 on your W-2 — often same as Box 1, capped at $176,100</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Social Security Tax Withheld
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-socialSecurityTaxWithheld`] = element;
                        }}
                        value={w2.socialSecurityTaxWithheld}
                        onValueChange={(v) => updateW2(index, { socialSecurityTaxWithheld: v })}
                        onBlur={() => touchField(`w2-${index}-socialSecurityTaxWithheld`)}
                        hasError={!!getFieldError(`w2-${index}-socialSecurityTaxWithheld`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-socialSecurityTaxWithheld`)} />
                      {!getFieldError(`w2-${index}-socialSecurityTaxWithheld`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 4 on your W-2 — should be ~6.2% of Box 3</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Medicare Wages and Tips
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-medicareWages`] = element;
                        }}
                        value={w2.medicareWages}
                        onValueChange={(v) => updateW2(index, { medicareWages: v })}
                        onBlur={() => touchField(`w2-${index}-medicareWages`)}
                        hasError={!!getFieldError(`w2-${index}-medicareWages`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-medicareWages`)} />
                      {!getFieldError(`w2-${index}-medicareWages`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 5 on your W-2 — no cap, usually same as Box 1</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Medicare Tax Withheld
                      </label>
                      <CurrencyInput
                        ref={(element) => {
                          fieldRefs.current[`w2-${index}-medicareTaxWithheld`] = element;
                        }}
                        value={w2.medicareTaxWithheld}
                        onValueChange={(v) => updateW2(index, { medicareTaxWithheld: v })}
                        onBlur={() => touchField(`w2-${index}-medicareTaxWithheld`)}
                        hasError={!!getFieldError(`w2-${index}-medicareTaxWithheld`)}
                      />
                      <ValidationError message={getFieldError(`w2-${index}-medicareTaxWithheld`)} />
                      {!getFieldError(`w2-${index}-medicareTaxWithheld`) && (
                        <p className="mt-1 text-xs text-slate-500">Box 6 on your W-2 — should be ~1.45% of Box 5</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Box 12 - Other */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-slate-900">Box 12 (Other Compensation)</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const current = w2.box12 || [];
                        updateW2(index, { box12: [...current, { code: '', amount: 0 }] });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Box 12 Entry
                    </button>
                  </div>
                  {(w2.box12 && w2.box12.length > 0) ? (
                    <div className="space-y-3">
                      {w2.box12.map((entry, box12Idx) => (
                        <div key={box12Idx} className="flex gap-3 items-start">
                          <div className="w-24">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
                            <select
                              value={entry.code}
                              onChange={(e) => {
                                const updated = [...(w2.box12 || [])];
                                updated[box12Idx] = { ...entry, code: e.target.value };
                                updateW2(index, { box12: updated });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select code</option>
                              <option value="A">A - Uncollected SS tax or RRTA tax on tips</option>
                              <option value="B">B - Uncollected Medicare tax on tips</option>
                              <option value="C">C - Taxable cost of group-term life insurance</option>
                              <option value="D">D - 401(k) elective deferrals</option>
                              <option value="E">E - 403(b) elective deferrals</option>
                              <option value="F">F - SIMPLE 401(k) / SEP elective deferrals</option>
                              <option value="G">G - 457(b) deferrals & employer contributions</option>
                              <option value="H">H - 501(c)(18)(D) elective deferrals</option>
                              <option value="J">J - Nontaxable sick pay</option>
                              <option value="K">K - 20% excise on excess golden parachutes</option>
                              <option value="L">L - Substantiated employee business expenses</option>
                              <option value="M">M - Uncollected SS tax on group-term life</option>
                              <option value="N">N - Uncollected Medicare tax on group-term life</option>
                              <option value="P">P - Excludable moving expense reimbursements</option>
                              <option value="Q">Q - Nontaxable combat pay</option>
                              <option value="R">R - Archer MSA employer contributions</option>
                              <option value="S">S - SIMPLE IRA employee contributions</option>
                              <option value="T">T - Adoption benefits</option>
                              <option value="V">V - Income from exercise of nonstatutory stock options</option>
                              <option value="W">W - Employer HSA contributions</option>
                              <option value="Y">Y - Deferrals under Section 409A</option>
                              <option value="Z">Z - Income under Section 409A (failed)</option>
                              <option value="AA">AA - Designated Roth 401(k) contributions</option>
                              <option value="BB">BB - Designated Roth 403(b) contributions</option>
                              <option value="DD">DD - Cost of employer-sponsored health coverage</option>
                              <option value="EE">EE - Designated Roth 457(b) contributions</option>
                              <option value="FF">FF - Qualified small employer health insurance</option>
                              <option value="GG">GG - Income from qualified equity grants</option>
                              <option value="HH">HH - Aggregate deferrals (Section 83(i))</option>
                              <option value="II">II - Medicaid waiver payments</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
                            <CurrencyInput
                              value={entry.amount}
                              onValueChange={(v) => {
                                const updated = [...(w2.box12 || [])];
                                updated[box12Idx] = { ...entry, amount: v };
                                updateW2(index, { box12: updated });
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (w2.box12 || []).filter((_, i) => i !== box12Idx);
                              updateW2(index, { box12: updated });
                            }}
                            className="mt-6 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No Box 12 entries. Leave blank if not applicable.</p>
                  )}
                </div>

                {/* Box 14 - Other State/Local Information */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Box 14 - Other (State tax, local tax, etc.)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = w2.box14 || [];
                        updateW2(index, { box14: [...current, { code: '', description: '', amount: 0 }] });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Box 14 Entry
                    </button>
                  </div>

                  {(w2.box14 && w2.box14.length > 0) ? (
                    <div className="space-y-3">
                      {w2.box14.map((entry, box14Idx) => (
                        <div key={box14Idx} className="flex gap-3 items-start">
                          <div className="w-32">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                            <select
                              value={entry.code}
                              onChange={(e) => {
                                const updated = [...(w2.box14 || [])];
                                updated[box14Idx] = { ...entry, code: e.target.value };
                                updateW2(index, { box14: updated });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select type</option>
                              <option value="STATESTAX">State Tax Withheld</option>
                              <option value="LOCALTAX">Local Tax Withheld</option>
                              <option value="SDI">State Disability Insurance</option>
                              <option value="UI">Unemployment Insurance</option>
                              <option value="VTL">Voluntary Disability</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div className="w-48">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={entry.description}
                              onChange={(e) => {
                                const updated = [...(w2.box14 || [])];
                                updated[box14Idx] = { ...entry, description: e.target.value };
                                updateW2(index, { box14: updated });
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., CA, NYC"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
                            <CurrencyInput
                              value={entry.amount}
                              onValueChange={(v) => {
                                const updated = [...(w2.box14 || [])];
                                updated[box14Idx] = { ...entry, amount: v };
                                updateW2(index, { box14: updated });
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (w2.box14 || []).filter((_, i) => i !== box14Idx);
                              updateW2(index, { box14: updated });
                            }}
                            className="mt-6 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No Box 14 entries. Leave blank if not applicable.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
