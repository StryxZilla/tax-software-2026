'use client';
import React from 'react';
import { Form1099R } from '../../types/tax-types';

interface Props {
  values?: Form1099R[];
  onChange: (values: Form1099R[]) => void;
}

const DISTRIBUTION_CODES = [
  { value: '', label: 'Select code' },
  { value: '1', label: '1 - Early distribution' },
  { value: '2', label: '2 - Disability' },
  { value: '3', label: '3 - Death' },
  { value: '4', label: '4 - Section 1035 exchange' },
  { value: '5', label: '5 - Prohibited transaction' },
  { value: '6', label: '6 - Adult survivor' },
  { value: '7', label: '7 - Normal distribution' },
  { value: '8', label: '8 - Excess contribution' },
  { value: 'A', label: 'A - Annuity' },
];

export default function RetirementDistributionForm({ values = [], onChange }: Props) {
  const addForm = () => {
    onChange([...values, { id: crypto.randomUUID(), payer: '', grossDistribution: 0, taxableAmount: 0, federalTaxWithheld: 0, employeeContributions: 0, distributionCode: '' }]);
  };

  const updateForm = (index: number, field: string, value: any) => {
    const updated = [...values];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeForm = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Retirement Distributions (1099-R)</h2>
        <button onClick={addForm} className="px-4 py-2 bg-blue-600 text-white rounded">Add 1099-R</button>
      </div>
      {values.map((form, idx) => (
        <div key={form.id} className="border p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Payer name" value={form.payer} onChange={e => updateForm(idx, 'payer', e.target.value)} className="border p-2 rounded" />
            <select value={form.distributionCode} onChange={e => updateForm(idx, 'distributionCode', e.target.value)} className="border p-2 rounded">
              {DISTRIBUTION_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="number" placeholder="Box 1: Gross Distribution" value={form.grossDistribution || ''} onChange={e => updateForm(idx, 'grossDistribution', parseFloat(e.target.value) || 0)} className="border p-2 rounded" />
            <input type="number" placeholder="Box 2a: Taxable Amount" value={form.taxableAmount || ''} onChange={e => updateForm(idx, 'taxableAmount', parseFloat(e.target.value) || 0)} className="border p-2 rounded" />
            <input type="number" placeholder="Box 4: Federal Tax Withheld" value={form.federalTaxWithheld || ''} onChange={e => updateForm(idx, 'federalTaxWithheld', parseFloat(e.target.value) || 0)} className="border p-2 rounded" />
            <input type="number" placeholder="Box 5: Employee Contributions" value={form.employeeContributions || ''} onChange={e => updateForm(idx, 'employeeContributions', parseFloat(e.target.value) || 0)} className="border p-2 rounded" />
          </div>
          <button onClick={() => removeForm(idx)} className="text-red-600">Remove</button>
        </div>
      ))}
    </div>
  );
}
