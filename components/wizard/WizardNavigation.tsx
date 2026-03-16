'use client';

import React, { useState } from 'react';
import { WizardStep } from '../../types/tax-types';
import { Check, List, X, ChevronRight, Minus } from 'lucide-react';

const steps: Array<{ id: WizardStep; label: string; shortLabel?: string; description: string }> = [
  { id: 'personal-info',          label: 'Personal Information',       shortLabel: 'Personal',   description: 'Name, address, SSN, filing status' },
  { id: 'dependents',             label: 'Dependents',                 shortLabel: 'Depend.',    description: 'Children & qualifying relatives' },
  { id: 'income-w2',              label: 'W-2 Income',                 shortLabel: 'W-2',        description: 'Wages from employers' },
  { id: 'income-interest',        label: 'Interest Income',            shortLabel: 'Interest',   description: '1099-INT from banks & savings' },
  { id: 'income-capital-gains',   label: 'Capital Gains',              shortLabel: 'Cap. Gains', description: 'Schedule D — stocks, crypto' },
  { id: 'income-self-employment', label: 'Self-Employment',            shortLabel: 'Self-Emp.',  description: 'Schedule C — freelance & business' },
  { id: 'income-1099-r',          label: 'Retirement Distributions',  shortLabel: '1099-R',     description: 'Pensions, annuities, 1099-R' },
  { id: 'income-social-security', label: 'Social Security Benefits',  shortLabel: 'SS Benefits', description: 'SSA-1099 — benefits & withholding' },
  { id: 'income-rental',          label: 'Rental Property',            shortLabel: 'Rental',     description: 'Schedule E — rental income' },
  { id: 'retirement-accounts',    label: 'Retirement Accounts',        shortLabel: 'Retire.',    description: 'IRA contributions & distributions' },
  { id: 'deductions',            label: 'Itemized Deductions',        shortLabel: 'Deduct.',    description: 'Schedule A — mortgage, charity' },
  { id: 'credits',               label: 'Tax Credits',                shortLabel: 'Credits',    description: 'Child credit, education & more' },
  { id: 'review',                label: 'Review & Download',          shortLabel: 'Review',     description: 'Summary, PDF & final review' },
];

interface WizardNavigationProps {
  currentStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
  completedSteps?: Set<WizardStep>;
  skippedSteps?: Set<WizardStep>;
}

/**
 * A step is "passed" if it was completed OR skipped — either way the user
 * moved past it, so the next step should be unlocked.
 */
function isStepPassed(stepId: WizardStep, completedSteps: Set<WizardStep>, skippedSteps: Set<WizardStep>): boolean {
  return completedSteps.has(stepId) || skippedSteps.has(stepId);
}

export default function WizardNavigation({ currentStep, onStepChange, completedSteps = new Set(), skippedSteps = new Set() }: WizardNavigationProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const [showPanel, setShowPanel] = useState(false);

  // Safety: if step not found (e.g. 'welcome'), treat as -1
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPct = Math.round(((safeIndex + 1) / steps.length) * 100);

  /** Derive step states used across all three rendering modes */
  function getStepState(step: typeof steps[number], index: number) {
    const isActive = step.id === currentStep;
    const isCompleted = completedSteps.has(step.id);
    const isSkipped = skippedSteps.has(step.id) && !isCompleted;
    const prevPassed = index > 0 && isStepPassed(steps[index - 1].id, completedSteps, skippedSteps);
    const isAccessible = isActive || isCompleted || isSkipped || prevPassed;
    return { isActive, isCompleted, isSkipped, isAccessible };
  }

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress header row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">
            Step {safeIndex + 1} of {steps.length}
            <span className="ml-2 font-semibold text-slate-800">
              — {steps[safeIndex]?.label ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-slate-600">
              {progressPct}% Complete
            </div>
            {/* Steps panel toggle */}
            <button
              onClick={() => setShowPanel(v => !v)}
              className="
                inline-flex items-center gap-1.5 text-xs font-semibold
                px-3 py-1.5 rounded-full border
                bg-slate-50 text-slate-600 border-slate-200
                hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200
                transition-colors duration-150
              "
              title="View all steps"
            >
              <List className="w-3.5 h-3.5" />
              Steps
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Steps panel — full list dropdown */}
        {showPanel && (
          <div className="mb-6 brand-surface-warm border border-accent-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-accent-100">
              <span className="text-sm font-bold text-slate-700">All Steps</span>
              <button
                onClick={() => setShowPanel(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
              {steps.map((step, index) => {
                const { isActive, isCompleted, isSkipped, isAccessible } = getStepState(step, index);

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isAccessible) {
                        onStepChange(step.id);
                        setShowPanel(false);
                      }
                    }}
                    disabled={!isAccessible}
                    aria-current={isActive ? 'step' : undefined}
                    className={`
                      flex items-center gap-3 px-5 py-3.5 text-left border-b border-r border-accent-100
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-primary-700 text-white border-2 border-primary-800 shadow-sm'
                        : isCompleted
                        ? 'hover:bg-emerald-50 cursor-pointer'
                        : isSkipped
                        ? 'hover:bg-slate-50 cursor-pointer opacity-60'
                        : isAccessible
                        ? 'hover:bg-slate-100 cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                      }
                    `}
                  >
                    {/* Status indicator */}
                    <div className={`
                      flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive
                        ? 'bg-white text-primary-700 ring-2 ring-primary-200'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isSkipped
                        ? 'bg-slate-300 text-slate-500'
                        : 'bg-slate-200 text-slate-500'
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : isSkipped ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${
                        isActive ? 'text-white'
                        : isCompleted ? 'text-emerald-800'
                        : isSkipped ? 'text-slate-400'
                        : 'text-slate-700'
                      }`}>
                        {step.label}
                        {isSkipped && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(skipped)</span>}
                      </div>
                      <div className={`text-xs truncate ${isActive ? 'text-primary-100' : 'text-slate-400'}`}>{step.description}</div>
                    </div>

                    {isActive && <ChevronRight className="w-4 h-4 text-primary-100 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop stepper with connecting lines */}
        <nav className="hidden lg:flex items-center justify-between">
          {steps.map((step, index) => {
            const { isActive, isCompleted, isSkipped, isAccessible } = getStepState(step, index);

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative group">
                  <button
                    onClick={() => isAccessible && onStepChange(step.id)}
                    disabled={!isAccessible}
                    className={`
                      flex flex-col items-center
                      ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    `}
                  >
                    {/* Step circle */}
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        transition-all duration-200 ease-in-out
                        ${isActive
                          ? 'bg-primary-700 text-white border-2 border-primary-900 ring-4 ring-primary-200 scale-110 shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : isSkipped
                          ? 'bg-slate-200 text-slate-400 border-2 border-dashed border-slate-300 hover:bg-slate-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isSkipped ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Step short label */}
                    <span
                      className={`
                        mt-2 text-xs font-medium text-center max-w-[80px]
                        ${isActive
                          ? 'text-primary-700 font-semibold'
                          : isCompleted
                          ? 'text-emerald-700'
                          : isSkipped
                          ? 'text-slate-400'
                          : 'text-slate-600'
                        }
                      `}
                    >
                      {step.shortLabel || step.label}
                    </span>
                  </button>

                  {/* Tooltip on hover */}
                  <div className="
                    absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                    bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity duration-150 z-50
                    shadow-lg
                    before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2
                    before:border-4 before:border-transparent before:border-t-slate-800
                  ">
                    <div className="font-semibold">{step.label}</div>
                    <div className="text-slate-300 text-[10px] mt-0.5">
                      {step.description}
                      {isSkipped && ' — Skipped'}
                    </div>
                  </div>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative" style={{ top: '-20px' }}>
                    <div className="absolute inset-0 bg-slate-200" />
                    <div
                      className={`
                        absolute inset-0 transition-all duration-500 ease-out
                        ${completedSteps.has(step.id)
                          ? 'bg-emerald-600'
                          : isSkipped
                          ? 'bg-slate-300'
                          : 'bg-slate-200'
                        }
                      `}
                      style={{
                        width: isStepPassed(step.id, completedSteps, skippedSteps) ? '100%' : '0%'
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Mobile/Tablet horizontal scroll */}
        <nav className="lg:hidden flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
          {steps.map((step, index) => {
            const { isActive, isCompleted, isSkipped, isAccessible } = getStepState(step, index);

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && onStepChange(step.id)}
                disabled={!isAccessible}
                className={`
                  flex items-center space-x-2 px-4 py-2.5 rounded-lg whitespace-nowrap
                  transition-all duration-200 ease-in-out flex-shrink-0
                  ${isActive
                    ? 'bg-primary-700 text-white border-2 border-primary-900 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : isSkipped
                    ? 'bg-slate-50 text-slate-400 border border-dashed border-slate-300 hover:bg-slate-100'
                    : isAccessible
                    ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                  }
                `}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${isActive
                      ? 'bg-white text-primary-700'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isSkipped
                      ? 'bg-slate-300 text-slate-500'
                      : 'bg-slate-300 text-slate-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isSkipped ? (
                    <Minus className="w-3.5 h-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium">{step.shortLabel || step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
