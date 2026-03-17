import React from 'react';

interface Form1099K {
  id: string;
  payer: string;
  ein: string;
  grossAmount: number;
  transactionCount: number;
  merchantCategoryCode: string;
}

interface Form1099KListProps {
  values: Form1099K[];
  onChange: (values: Form1099K[]) => void;
}

export default function Form1099KList({ values = [], onChange }: Form1099KListProps) {
  const add1099K = () => {
    onChange([
      ...values,
      {
        id: Date.now().toString(),
        payer: '',
        ein: '',
        grossAmount: 0,
        transactionCount: 0,
        merchantCategoryCode: '',
      },
    ]);
  };

  const remove1099K = (id: string) => {
    onChange(values.filter((k) => k.id !== id));
  };

  const update1099K = (id: string, field: keyof Form1099K, value: string | number) => {
    onChange(
      values.map((k) =>
        k.id === id ? { ...k, [field]: value } : k
      )
    );
  };

  const total1099K = values.reduce((sum, k) => sum + (k.grossAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Form 1099-K</h3>
          <p className="text-sm text-slate-500">
            Payment settlement — from Venmo, PayPal, Stripe, etc.
          </p>
        </div>
        <button
          type="button"
          onClick={add1099K}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add 1099-K
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Starting 2024, the reporting threshold is $5,000 (prior was $600). 
          However, you must still report ALL income from payment apps regardless of whether you receive a form.
        </p>
      </div>

      {values.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500">No 1099-K forms added</p>
          <p className="text-sm text-slate-400 mt-1">
            Add this if you received $5,000+ through payment apps (Venmo, PayPal, etc.)
          </p>
        </div>
      )}

      {values.map((k, index) => (
        <div key={k.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-medium text-slate-700">1099-K #{index + 1}</h4>
            <button
              type="button"
              onClick={() => remove1099K(k.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Payment Settlement Company
              </label>
              <input
                type="text"
                value={k.payer}
                onChange={(e) => update1099K(k.id, 'payer', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., PayPal, Venmo, Stripe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Payer's EIN
              </label>
              <input
                type="text"
                value={k.ein}
                onChange={(e) => update1099K(k.id, 'ein', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Number of Transactions
              </label>
              <input
                type="number"
                value={k.transactionCount || ''}
                onChange={(e) => update1099K(k.id, 'transactionCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Merchant Category Code (MCC)
              </label>
              <input
                type="text"
                value={k.merchantCategoryCode}
                onChange={(e) => update1099K(k.id, 'merchantCategoryCode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5311 for retail"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Gross Amount of All Payment Settlements <span className="text-xs font-normal text-slate-400">(Box 1a)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={k.grossAmount || ''}
                  onChange={(e) => update1099K(k.id, 'grossAmount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                This is the TOTAL processed, NOT your profit. Business expenses reduce taxable income.
              </p>
            </div>
          </div>
        </div>
      ))}

      {values.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total 1099-K Gross:</span>
            <span className="font-semibold text-slate-800">${total1099K.toLocaleString()}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Note: This is gross payments. Your actual business income (profit) is gross minus expenses.
          </p>
        </div>
      )}
    </div>
  );
}
