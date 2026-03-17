'use client'

import React, { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TaxReturnProvider } from '../lib/context/TaxReturnContext'
import WizardNavigation from '../components/wizard/WizardNavigation'
import WelcomeScreen from '../components/wizard/WelcomeScreen'
import PersonalInfoForm from '../components/forms/PersonalInfoForm'
import DependentsForm from '../components/forms/DependentsForm'
import W2Form from '../components/forms/W2Form'
import InterestIncomeForm from '../components/forms/InterestIncomeForm'
import DividendIncomeForm from '../components/forms/DividendIncomeForm'
import CapitalGainsForm from '../components/forms/CapitalGainsForm'
import ScheduleCForm from '../components/forms/ScheduleCForm'
import Form1099NECList from '../components/forms/Form1099NECList'
import Form1099KList from '../components/forms/Form1099KList'
import RetirementDistributionForm from '../components/forms/RetirementDistributionForm'
import RentalPropertyForm from '../components/forms/RentalPropertyForm'
import RetirementForm from '../components/forms/RetirementForm'
import AboveTheLineDeductionsForm from '../components/forms/AboveTheLineDeductionsForm'
import SocialSecurityForm from '../components/forms/SocialSecurityForm'
import ItemizedDeductionsForm from '../components/forms/ItemizedDeductionsForm'
import CreditsForm from '../components/forms/CreditsForm'
import Schedule1ADeductionsForm from '../components/forms/Schedule1ADeductionsForm'
import TaxSummarySidebar from '../components/review/TaxSummarySidebar'
import PdfDownloadButton from '../components/review/PdfDownloadButton'
import { useTaxReturn, useAuthUser } from '../lib/context/TaxReturnContext'
import { calculateAGI } from '../lib/engine/calculations/tax-calculator'
import FormNavigation from '../components/common/FormNavigation'
import SaveStatusIndicator from '../components/common/SaveStatusIndicator'
import ZoeyGuideCard from '../components/brand/ZoeyGuideCard'
import ZoeyImage from '../components/brand/ZoeyImage'
import { WizardStep } from '../types/tax-types'
import { getWizardStepFromStorage } from '../lib/storage/tax-return-storage'
import { calculateTaxPlanningInsights } from '../lib/engine/calculations/tax-planning'

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
]

// Wizard step components
function WizardStepContent() {
  const {
    taxReturn,
    updateTaxReturn,
    currentStep,
    setCurrentStep,
    markStepCompleted,
    markStepSkipped,
    taxCalculation,
    recalculateTaxes,
  } = useTaxReturn()

  const [isCurrentFormValid, setIsCurrentFormValid] = React.useState(true)
  const [blockedNextAttempts, setBlockedNextAttempts] = React.useState(0)

  const currentIndex = STEP_ORDER.indexOf(currentStep)

  React.useEffect(() => {
    setBlockedNextAttempts(0)
  }, [currentStep])

  const handleNext = () => {
    if (currentIndex < STEP_ORDER.length - 1) {
      // Mark current step as completed before advancing
      markStepCompleted(currentStep)
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
    }
  }
  const handleSkip = () => {
    if (currentIndex < STEP_ORDER.length - 1) {
      markStepSkipped(currentStep)
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }

  switch (currentStep) {
    case 'personal-info':
      return (
        <>
          <PersonalInfoForm
            value={taxReturn.personalInfo}
            onChange={(updates) => {
              updateTaxReturn({ personalInfo: { ...taxReturn.personalInfo, ...updates } })
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'dependents':
      return (
        <>
          <DependentsForm
            values={taxReturn.dependents}
            onChange={(dependents) => {
              updateTaxReturn({ dependents })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'income-w2':
      return (
        <>
          <W2Form
            values={taxReturn.w2Income}
            onChange={(w2s) => {
              updateTaxReturn({ w2Income: w2s })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
            blockedNextAttempts={blockedNextAttempts}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
            onBlockedNext={() => setBlockedNextAttempts((count) => count + 1)}
          />
        </>
      )

    case 'income-interest':
      return (
        <>
          <InterestIncomeForm
            values={taxReturn.interest}
            onChange={(interest) => {
              updateTaxReturn({ interest })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'income-dividends':
      return (
        <>
          <DividendIncomeForm
            values={taxReturn.dividends}
            onChange={(dividends) => {
              updateTaxReturn({ dividends })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={true}
          />
        </>
      )

    case 'income-capital-gains':
      return (
        <>
          <CapitalGainsForm
            values={taxReturn.capitalGains}
            onChange={(capitalGains) => {
              updateTaxReturn({ capitalGains })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'income-self-employment':
      return (
        <>
          <ScheduleCForm
            value={taxReturn.selfEmployment}
            onChange={(selfEmployment) => {
              updateTaxReturn({ selfEmployment })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'income-1099-nec':
      return (
        <>
          <Form1099NECList
            values={taxReturn.form1099NEC}
            onChange={(form1099NEC) => {
              updateTaxReturn({ form1099NEC })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={true}
          />
        </>
      )

    case 'income-1099-k':
      return (
        <>
          <Form1099KList
            values={taxReturn.form1099K}
            onChange={(form1099K) => {
              updateTaxReturn({ form1099K })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={true}
          />
        </>
      )

    case 'income-1099-r':
      return (
        <>
          <RetirementDistributionForm
            values={taxReturn.form1099R}
            onChange={(form1099R) => {
              updateTaxReturn({ form1099R })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={true}
          />
        </>
      )

    case 'income-social-security':
      return (
        <>
          <SocialSecurityForm
            values={taxReturn.socialSecurity}
            onChange={(socialSecurity) => {
              updateTaxReturn({ socialSecurity })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'income-rental':
      return (
        <>
          <RentalPropertyForm
            values={taxReturn.rentalProperties}
            onChange={(rentalProperties) => {
              updateTaxReturn({ rentalProperties })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'retirement-accounts':
      return (
        <>
          <RetirementForm
            traditionalIRA={taxReturn.traditionalIRAContribution}
            rothIRA={taxReturn.rothIRAContribution}
            form8606={taxReturn.form8606}
            onUpdate={(updates) => {
              updateTaxReturn({
                traditionalIRAContribution: updates.traditionalIRA,
                rothIRAContribution: updates.rothIRA,
                form8606: updates.form8606,
              })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        </>
      )

    case 'above-the-line':
      return (
        <>
          <AboveTheLineDeductionsForm
            value={taxReturn.aboveTheLineDeductions}
            onChange={(aboveTheLineDeductions) => {
              updateTaxReturn({ aboveTheLineDeductions })
              recalculateTaxes()
            }}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        </>
      )

    case 'deductions': {
      const agi = calculateAGI(taxReturn)
      return (
        <>
          <ItemizedDeductionsForm
            values={taxReturn.itemizedDeductions}
            onChange={(itemizedDeductions) => {
              updateTaxReturn({ itemizedDeductions })
              recalculateTaxes()
            }}
            agi={agi}
            filingStatus={taxReturn.personalInfo.filingStatus}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        </>
      )
    }

    case 'deductions-schedule-1a': {
      const agi = calculateAGI(taxReturn)
      return (
        <>
          <Schedule1ADeductionsForm
            schedule1A={taxReturn.schedule1A}
            onChange={(schedule1A) => {
              updateTaxReturn({ schedule1A })
              recalculateTaxes()
            }}
            age={taxReturn.personalInfo.age}
            filingStatus={taxReturn.personalInfo.filingStatus}
            agi={agi}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )
    }

    case 'credits':
      return (
        <>
          <CreditsForm
            educationExpenses={taxReturn.educationExpenses}
            onEducationExpensesChange={(educationExpenses) => {
              updateTaxReturn({ educationExpenses })
              recalculateTaxes()
            }}
            onValidationChange={setIsCurrentFormValid}
          />
          <FormNavigation
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            canProceed={isCurrentFormValid}
          />
        </>
      )

    case 'review':
      return (
        <div className="max-w-5xl mx-auto space-y-8 px-4 py-6 fade-in">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold text-slate-900">Zoey's Return Summary</h2>
            <p className="text-slate-600 text-lg">Review your complete 2025 tax return</p>
          </div>

          <ZoeyGuideCard
            variant="warning"
            title="Final pass before export"
            message="Double-check SSNs, withholding, and bank details. These three fields catch most last-minute surprises. Zoey triple-checks every number — no detail slips past this corgi."
            className="max-w-2xl mx-auto"
          />

          {taxCalculation ? (
            <>
              <div className={`
                card-premium overflow-hidden border-2
                ${taxCalculation.refundOrAmountOwed > 0
                  ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-green-300'
                  : 'bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-300'
                }
              `}>
                <div className="p-8 text-center">
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">
                    {taxCalculation.refundOrAmountOwed > 0 ? '✨ Expected Refund' : '⚠️ Amount Owed'}
                  </div>
                  <div className={`
                    text-7xl font-bold number-emphasis mb-4
                    ${taxCalculation.refundOrAmountOwed > 0 ? 'text-green-600' : 'text-red-600'}
                  `}>
                    ${Math.abs(taxCalculation.refundOrAmountOwed).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600">
                    {taxCalculation.refundOrAmountOwed > 0
                      ? "Congratulations! You're getting money back."
                      : 'Please ensure payment is made by the tax deadline.'
                    }
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <PdfDownloadButton taxReturn={taxReturn} />
              </div>

              <div className="card-premium p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-100">
                  💰 Income & Adjustments
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Income</dt>
                    <dd className="text-4xl font-bold text-slate-900 currency">
                      ${taxCalculation.totalIncome.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Adjustments</dt>
                    <dd className="text-4xl font-bold text-purple-700 currency">
                      -${taxCalculation.adjustments.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border border-green-200 md:col-span-2">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Adjusted Gross Income (AGI)
                    </dt>
                    <dd className="text-5xl font-bold text-green-700 currency">
                      ${taxCalculation.agi.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="card-premium p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-100">
                  📊 Deductions & Taxable Income
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Standard/Itemized Deduction
                    </dt>
                    <dd className="text-4xl font-bold text-amber-700 currency">
                      -${taxCalculation.standardOrItemizedDeduction.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Taxable Income
                    </dt>
                    <dd className="text-4xl font-bold text-blue-700 currency">
                      ${taxCalculation.taxableIncome.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="card-premium p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-100">
                  🧮 Tax Calculation
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-5 border border-slate-200">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Regular Tax</dt>
                    <dd className="text-4xl font-bold text-slate-900 currency">
                      ${taxCalculation.regularTax.toLocaleString()}
                    </dd>
                  </div>
                  {taxCalculation.amt > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-200">
                      <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Alternative Minimum Tax
                      </dt>
                      <dd className="text-4xl font-bold text-red-600 currency">
                        +${taxCalculation.amt.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {taxCalculation.selfEmploymentTax > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
                      <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Self-Employment Tax
                      </dt>
                      <dd className="text-4xl font-bold text-orange-700 currency">
                        ${taxCalculation.selfEmploymentTax.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Tax Credits
                    </dt>
                    <dd className="text-4xl font-bold text-green-600 currency">
                      -${taxCalculation.totalCredits.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl p-6 border-2 border-indigo-300 md:col-span-2">
                    <dt className="text-base font-bold text-slate-700 uppercase tracking-wide mb-3">
                      Total Tax Liability
                    </dt>
                    <dd className="text-5xl font-bold text-indigo-700 currency">
                      ${taxCalculation.totalTax.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="card-premium p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-100">
                  💳 Payments & Withholding
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-100">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Federal Tax Withheld
                    </dt>
                    <dd className="text-4xl font-bold text-teal-700 currency">
                      ${taxCalculation.federalTaxWithheld.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-5 border border-sky-100">
                    <dt className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Estimated Tax Payments
                    </dt>
                    <dd className="text-4xl font-bold text-sky-700 currency">
                      ${taxCalculation.estimatedTaxPayments.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Tax Planning Insights */}
              {(() => {
                const insights = calculateTaxPlanningInsights(taxReturn, {
                  agi: taxCalculation.agi,
                  totalIncome: taxCalculation.totalIncome,
                  totalTax: taxCalculation.totalTax,
                  taxableIncome: taxCalculation.taxableIncome,
                });
                
                if (!insights) return null;
                
                const { retirement, taxRates } = insights;
                
                return (
                  <div className="space-y-6">
                    <div className="card-premium p-8 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                      <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-violet-100">
                        📈 Tax Planning Insights
                      </h3>
                      
                      {/* 401k Optimization Card */}
                      <div className="bg-white rounded-xl p-6 border border-violet-100 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-800">💼 401(k) Optimization</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            retirement['401kOptimization'].percentUsed >= 100 
                              ? 'bg-green-100 text-green-700' 
                              : retirement['401kOptimization'].percentUsed >= 75
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {retirement['401kOptimization'].percentUsed}% used
                          </span>
                        </div>
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <dt className="text-xs text-slate-500 uppercase tracking-wide">Current</dt>
                            <dd className="text-xl font-bold text-slate-800">
                              ${retirement['401kOptimization'].currentContributions.toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 uppercase tracking-wide">Annual Limit</dt>
                            <dd className="text-xl font-bold text-slate-800">
                              ${retirement['401kOptimization'].annualLimit.toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 uppercase tracking-wide">Left on Table</dt>
                            <dd className="text-xl font-bold text-amber-600">
                              ${retirement['401kOptimization'].leftOnTable.toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500 uppercase tracking-wide">% Used</dt>
                            <dd className="text-xl font-bold text-violet-600">
                              {retirement['401kOptimization'].percentUsed}%
                            </dd>
                          </div>
                        </dl>
                        <p className="text-sm text-slate-600 bg-violet-50 rounded-lg p-3">
                          {retirement['401kOptimization'].recommendation}
                        </p>
                      </div>

                      {/* Backdoor Roth Card */}
                      <div className="bg-white rounded-xl p-6 border border-violet-100 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-800">🔄 Backdoor Roth IRA</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            retirement.backdoorRoth.didBackdoor
                              ? 'bg-violet-100 text-violet-700'
                              : retirement.backdoorRoth.eligible 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {retirement.backdoorRoth.didBackdoor ? 'Completed' : retirement.backdoorRoth.eligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {retirement.backdoorRoth.reason}
                        </p>
                        <p className="text-sm text-slate-700 bg-violet-50 rounded-lg p-3 font-medium">
                          💡 {retirement.backdoorRoth.recommendation}
                        </p>
                      </div>

                      {/* Effective vs Marginal Rate Card */}
                      <div className="bg-white rounded-xl p-6 border border-violet-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">📊 Effective vs Marginal Rate</h4>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                            <dt className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">Effective Rate</dt>
                            <dd className="text-4xl font-bold text-green-600">{taxRates.effectiveRatePercent}%</dd>
                            <p className="text-xs text-green-600 mt-1">Actual % of income paid</p>
                          </div>
                          <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <dt className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Marginal Rate</dt>
                            <dd className="text-4xl font-bold text-amber-600">{taxRates.marginalRatePercent}%</dd>
                            <p className="text-xs text-amber-600 mt-1">Rate on next dollar</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 bg-violet-50 rounded-lg p-3">
                          {taxRates.breakdown}
                        </p>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Disclaimer:</strong> This is for educational purposes only — consult a qualified tax professional for personalized tax advice.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="card-premium p-12 text-center">
              <p className="text-slate-500 text-lg">No tax calculation available. Please complete the required forms.</p>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">This section is under development.</p>
        </div>
      )
  }
}

// Main page component
export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-slate-900 mb-2">Zoey's Tax Advisory</div>
          <p className="text-slate-400 text-sm animate-pulse">Loading your advisory workspace…</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <TaxReturnProvider>
      <AppShell />
    </TaxReturnProvider>
  )
}

function AppShell() {
  const { currentStep, setCurrentStep, lastSaved, isCalculating, forceSave } = useTaxReturn()
  const user = useAuthUser()
  const isWelcome = currentStep === 'welcome'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`bg-white shadow ${isWelcome ? 'border-b border-slate-100' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('welcome')}
            className="flex items-center gap-2 group"
            title="Back to Welcome"
          >
            <ZoeyImage src="/brand/zoey-neutral.png" alt="Zoey mascot" className="h-9 w-9 rounded-lg border border-slate-200 bg-white object-cover object-top" />
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
              Zoey's Tax Advisory
            </span>
            <span className="hidden sm:inline text-sm font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              2025
            </span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <SaveStatusIndicator lastSaved={lastSaved} isCalculating={isCalculating} onSave={forceSave} />
              {!isWelcome && (
                <button
                  onClick={() => setCurrentStep('welcome')}
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium hidden sm:block"
                >
                  ← Back to Overview
                </button>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-3">
                {user.isAdmin && (
                  <a
                    href="/admin/users"
                    className="text-xs text-slate-400 hover:text-blue-600 transition-colors font-medium hidden sm:block"
                  >
                    Admin
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600 font-medium hidden sm:block">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <MainContent />
      </main>
    </div>
  )
}

function MainContent() {
  const { currentStep, setCurrentStep, completedSteps, skippedSteps, resetTaxReturn } = useTaxReturn()
  const user = useAuthUser()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [currentStep])

  if (currentStep === 'welcome') {
    return (
      <WelcomeScreen
        storageUserId={user?.id}
        onStart={() => setCurrentStep('personal-info')}
        onResume={() => {
          // Resume to the saved step (already loaded into currentStep from localStorage/DB).
          // The context loads savedStep on mount, but since we're on 'welcome' the user
          // explicitly navigated here. Read the persisted step directly.
          const stepToResume = getWizardStepFromStorage(user?.id)
          if (stepToResume && stepToResume !== 'welcome') {
            setCurrentStep(stepToResume as WizardStep)
          } else {
            setCurrentStep('personal-info')
          }
        }}
        onStartOver={() => {
          resetTaxReturn()
        }}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-[1fr_350px] lg:gap-8">
        <div className="space-y-8 pb-80 lg:pb-8">
          <WizardNavigation
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            completedSteps={completedSteps}
            skippedSteps={skippedSteps}
          />
          <div className="bg-white shadow-sm rounded-lg p-8">
            <WizardStepContent />
          </div>
        </div>
        <TaxSummarySidebar />
      </div>
    </div>
  )
}
