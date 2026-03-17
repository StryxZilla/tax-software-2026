import React from 'react';
import { Dividend1099DIV } from '../../types/tax-types';
import { Plus, Trash2, Landmark, DollarSign, TrendingUp, Info, AlertCircle, Receipt } from 'lucide-react';

interface DividendIncomeFormProps {
  values: Dividend1099DIV[];
  onChange: (values: Dividend1099DIV[]) => void;
}

export default function DividendIncomeForm({ values, onChange }: DividendIncomeFormProps) {
  const addDividend = () => {
    onChange([
      ...values,
      {
        payer: '',
        ordinaryDividends: 0,
        qualifiedDividends: 0,
        capitalGainDistributions: 0,
        exemptInterestDividends: 0,
        foreignTaxPaid: 0,
        foreignCountry: '',
      },
    ]);
  };

  const removeDividend = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateDividend = (index: number, field: keyof Dividend1099DIV, value: string | number) => {
    onChange(
      values.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      )
    );
  };

  const totalOrdinary = values.reduce((sum, d) => sum + (d.ordinaryDividends || 0), 0);
  const totalQualified = values.reduce((sum, d) => sum + (d.qualifiedDividends || 0), 0);
  const totalCapitalGains = values.reduce((sum, d) => sum + (d.capitalGainDistributions || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Dividend Income (Schedule B)</h2>
        <p className="text-slate-600 mb-4">
          Report dividends from investments — these go on <strong>Schedule B</strong> and are included in your total income.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Where dividends go:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ordinary dividends</strong> — taxed as regular income</li>
              <li><strong>Qualified dividends</strong> — taxed at lower capital gains rates (0%, 15%, or 20%)</li>
              <li><strong>Capital gain distributions</strong> — from mutual funds, goes to Schedule D</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addDividend}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add 1099-DIV
        </button>
      </div>

      {values.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Receipt className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Dividend Income Added</h3>
          <p className="text-slate-500 mb-4">
            Add Form 1099-DIV from brokerage accounts, mutual funds, and banks.
          </p>
          <p className="text-sm text-slate-400">
            Even if you don't receive a form, you must report all dividend income.
          </p>
        </div>
      )}

      {values.map((dividend, index) => (
        <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-semibold text-slate-700">1099-DIV #{index + 1}</h4>
            <button
              type="button"
              onClick={() => removeDividend(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payer Name
              </label>
              <input
                type="text"
                value={dividend.payer}
                onChange={(e) => updateDividend(index, 'payer', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Vanguard, Fidelity, Charles Schwab"
              />
            </div>

            {/* Foreign Country (if applicable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foreign Country (if applicable)
              </label>
              <input
                type="text"
                value={dividend.foreignCountry}
                onChange={(e) => updateDividend(index, 'foreignCountry', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Canada, UK"
              />
            </div>

            {/* Box 1a - Ordinary Dividends */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Total Ordinary Dividends <span className="text-xs font-normal text-slate-400">(Box 1a)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dividend.ordinaryDividends || ''}
                  onChange={(e) => updateDividend(index, 'ordinaryDividends', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Box 1b - Qualified Dividends */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Qualified Dividends <span className="text-xs font-normal text-slate-400">(Box 1b)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dividend.qualifiedDividends || ''}
                  onChange={(e) => updateDividend(index, 'qualifiedDividends', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Usually less than or equal to ordinary — taxed at lower rates
              </p>
            </div>

            {/* Box 2 - Capital Gain Distributions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Capital Gain Distributions <span className="text-xs font-normal text-slate-400">(Box 2)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dividend.capitalGainDistributions || ''}
                  onChange={(e) => updateDividend(index, 'capitalGainDistributions', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                From mutual funds/ETFs — goes to Schedule D
              </p>
            </div>

            {/* Box 3 - Exempt Interest Dividends */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Exempt-Interest Dividends <span className="text-xs font-normal text-slate-400">(Box 3)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dividend.exemptInterestDividends || ''}
                  onChange={(e) => updateDividend(index, 'exemptInterestDividends', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                From municipal bonds — tax-exempt but affects AMT
              </p>
            </div>

            {/* Box 6 - Foreign Tax Paid */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foreign Tax Paid <span className="text-xs font-normal text-slate-400">(Box 6)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dividend.foreignTaxPaid || ''}
                  onChange={(e) => updateDividend(index, 'foreignTaxPaid', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Can deduct or claim as credit (Form 1116)
              </p>
            </div>
          </div>
        </div>
      ))}

      {values.length > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-green-100 text-sm">Ordinary Dividends</p>
              <p className="text-2xl font-bold">${totalOrdinary.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Qualified Dividends</p>
              <p className="text-2xl font-bold">${totalQualified.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Capital Gains</p>
              <p className="text-2xl font-bold">${totalCapitalGains.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
