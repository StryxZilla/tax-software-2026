'use client';

import React from 'react';
import { WizardStep, isStepOptional } from '../../types/tax-types';

interface FormNavigationProps {
  currentStep: WizardStep;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  canProceed?: boolean;
  onBlockedNext?: () => void;
}

const STEP_ORDER: WizardStep[] = [
  'personal-info',
  'dependents',
  'income-w2',
  'income-interest',
  'income-dividends',
  'income-capital-gains',
  'income-self-employment',
  'income-1099-nec',
  'income-1099-k',
  'retirement-accounts',
  'income-1099-r',
  'income-social-security',
  'income-rental',
  'above-the-line',
  'deductions',
  'deductions-schedule-1a',
  'credits',
  'review',
];

export default function FormNavigation({ currentStep, onNext, onPrevious, onSkip, canProceed = true, onBlockedNext }: FormNavigationProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === STEP_ORDER.length - 1;
  const optional = isStepOptional(currentStep);

  return (
    <div className="flex justify-between items-center pt-6 border-t mt-8">
      {!isFirst ? (
        <button
          onClick={onPrevious}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        {optional && !isLast && onSkip && (
          <button
            onClick={onSkip}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors text-sm"
          >
            Skip for now
          </button>
        )}

        {!isLast && (
          <button
            onClick={() => {
              if (canProceed) {
                onNext?.()
                return
              }

              onBlockedNext?.()
            }}
            aria-disabled={!canProceed}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
