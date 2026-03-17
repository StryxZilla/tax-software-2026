import React from 'react';
import { useState } from 'react';

interface Form1099NEC {
  id: string;
  payer: string;
  recipient: string;
  tin: string;  // EIN or SSN of recipient
  nonEmployeeCompensation: number;
  federalTaxWithheld: number;
}

interface Form1099NECListProps {
  values: Form1099NEC[];
  onChange: (values: Form1099NEC[]) => void;
}

export default function Form1099NECList({ values = [], onChange }: Form1099NECListProps) {
  const add1099NEC = () => {
    onChange([
      ...values,
      {
        id: Date.now().toString(),
        payer: '',
        recipient: '',
        tin: '',
        nonEmployeeCompensation: 0,
        federalTaxWithheld: 0,
      },
    ]);
  };

  const remove1099NEC = (id: string) => {
    onChange(values.filter((nec) => nec.id !== id));
  };

  const update1099NEC = (id: string, field: keyof Form1099NEC, value: string | number) => {
    onChange(
      values.map((nec) =>
        nec.id === id ? { ...nec, [field]: value } : nec
      )
    );
  };

  const total1099NEC = values.reduce((sum, nec) => sum + (nec.nonEmployeeCompensation || 0), 0);
  const totalWithheld = values.reduce((sum, nec) => sum + (nec.federalTaxWithheld || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Form 1099-NEC</h3>
          <p className="text-sm text-slate-500">
            Non-employee compensation (contractor income) — amounts in Box 1 go to Schedule C
          </p>
        </div>
        <button
          type="button"
          onClick={add1099NEC}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add 1099-NEC
        </button>
      </div>

      {values.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500">No 1099-NEC forms added</p>
          <p className="text-sm text-slate-400 mt-1">
            Add this if you received $600+ in contractor payments
          </p>
        </div>
      )}

      {values.map((nec, index) => (
        <div key={nec.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-medium text-slate-700">1099-NEC #{index + 1}</h4>
            <button
              type="button"
              onClick={() => remove1099NEC(nec.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payer Info */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Payer Name
              </label>
              <input
                type="text"
                value={nec.payer}
                onChange={(e) => update1099NEC(nec.id, 'payer', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Company that paid you"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Your Name / Business Name
              </label>
              <input
                type="text"
                value={nec.recipient}
                onChange={(e) => update1099NEC(nec.id, 'recipient', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Your TIN (SSN or EIN)
              </label>
              <input
                type="text"
                value={nec.tin}
                onChange={(e) => update1099NEC(nec.id, 'tin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="XXX-XXXXXXX or XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Federal Tax Withheld (Box 4)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={nec.federalTaxWithheld ?? ''}
                  onChange={(e) => update1099NEC(nec.id, 'federalTaxWithheld', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Box 1 - Non-employee compensation (the main field) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Non-Employee Compensation <span className="text-xs font-normal text-slate-400">(Box 1)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={nec.nonEmployeeCompensation ?? ''}
                  onChange={(e) => update1099NEC(nec.id, 'nonEmployeeCompensation', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Total payments received for services (not employees) — goes to Schedule C, Line 3
              </p>
            </div>
          </div>
        </div>
      ))}

      {values.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total 1099-NEC Income:</span>
            <span className="font-semibold text-slate-800">${total1099NEC.toLocaleString()}</span>
          </div>
          {totalWithheld > 0 && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-600">Total Federal Withheld:</span>
              <span className="font-semibold text-slate-800">${totalWithheld.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
