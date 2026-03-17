import React from 'react';
import CurrencyInput from '../common/CurrencyInput';

interface AboveTheLineDeductionsData {
  educatorExpenses: number;
  studentLoanInterest: number;
  hsaContributions: number;
  hsaEmployerContributions: number;
  movingExpenses: number;
  selfEmploymentHealthInsurance: number;
  sepIRA: number;
  alimonyPaid: number;
}

interface AboveTheLineDeductionsFormProps {
  value: AboveTheLineDeductionsData;
  onChange: (value: AboveTheLineDeductionsData) => void;
}

export default function AboveTheLineDeductionsForm({ value, onChange }: AboveTheLineDeductionsFormProps) {
  const update = (field: keyof AboveTheLineDeductionsData, amount: number) => {
    onChange({ ...value, [field]: amount });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Above-the-Line Deductions</h2>
        <p className="text-slate-600 mb-4">
          These deductions reduce your AGI regardless of whether you itemize. They’re reported on Schedule 1.
        </p>
      </div>

      {/* Educator Expenses */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Educator Expenses (Form 1098-T)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Teachers & school employees can deduct up to $300 of out-of-pocket expenses for supplies
        </p>
        <div className="relative max-w-md">
          <CurrencyInput
            value={value.educatorExpenses}
            onValueChange={(val) => update('educatorExpenses', val)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">Maximum $300 ($600 if married filing jointly)</p>
      </div>

      {/* Student Loan Interest */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Student Loan Interest (Form 1098-E)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Interest paid on qualified student loans — reported by your loan servicer
        </p>
        <div className="relative max-w-md">
          <CurrencyInput
            value={value.studentLoanInterest}
            onValueChange={(val) => update('studentLoanInterest', val)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">Maximum $2,500 (phase-out starts at $75k single / $155k married)</p>
      </div>

      {/* HSA Contributions */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">HSA Contributions (Form 5498-SA)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Health Savings Account contributions (you’ll receive Form 5498-SA from your HSA custodian)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Contributions
            </label>
            <CurrencyInput
              value={value.hsaContributions}
              onValueChange={(val) => update('hsaContributions', val)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employer Contributions
            </label>
            <CurrencyInput
              value={value.hsaEmployerContributions}
              onValueChange={(val) => update('hsaEmployerContributions', val)}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <p className="mt-2 text-xs text-slate-500">
          2025 limits: $4,150 self / $8,300 family (plus $1,000 catch-up if 55+)
        </p>
      </div>

      {/* Self-Employed Health Insurance */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Self-Employed Health Insurance</h3>
        <p className="text-sm text-slate-500 mb-4">
          Health insurance premiums for self-employed individuals (Schedule 1, Line 17)
        </p>
        <div className="relative max-w-md">
          <CurrencyInput
            value={value.selfEmploymentHealthInsurance}
            onValueChange={(val) => update('selfEmploymentHealthInsurance', val)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Include premiums for you, spouse, and dependents. Taken as an adjustment to income, not an itemized deduction.
        </p>
      </div>

      {/* SEP IRA / SIMPLE IRA */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">SEP IRA / SIMPLE IRA Contributions</h3>
        <p className="text-sm text-slate-500 mb-4">
          Self-employed retirement plan contributions
        </p>
        <div className="relative max-w-md">
          <CurrencyInput
            value={value.sepIRA}
            onValueChange={(val) => update('sepIRA', val)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          2025 limit: 20-25% of net self-employment income (max $69,000)
        </p>
      </div>

      {/* Alimony Paid (pre-2019) */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Alimony Paid</h3>
        <p className="text-sm text-slate-500 mb-4">
          Alimony payments (divorce agreements signed before 2019)
        </p>
        <div className="relative max-w-md">
          <CurrencyInput
            value={value.alimonyPaid}
            onValueChange={(val) => update('alimonyPaid', val)}
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Note: Tax Cuts and Jobs Act eliminated this deduction for divorces after 2018
        </p>
      </div>
    </div>
  );
}
