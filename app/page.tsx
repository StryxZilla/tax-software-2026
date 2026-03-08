'use client'

import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TaxReturnProvider } from '../lib/context/TaxReturnContext'
import WizardNavigation from '../components/wizard/WizardNavigation'
import WelcomeScreen from '../components/wizard/WelcomeScreen'
import PersonalInfoForm from '../components/forms/PersonalInfoForm'
import DependentsForm from '../components/forms/DependentsForm'
import W2Form from '../components/forms/W2Form'
import InterestIncomeForm from '../components/forms/InterestIncomeForm'
import CapitalGainsForm from '../components/forms/CapitalGainsForm'
import ScheduleCForm from '../components/forms/ScheduleCForm'
import RentalPropertyForm from '../components/forms/RentalPropertyForm'
import RetirementForm from '../components/forms/RetirementForm'
import ItemizedDeductionsForm from '../components/forms/ItemizedDeductionsForm'
import CreditsForm from '../components/forms/CreditsForm'
import TaxSummarySidebar from '../components/review/TaxSummarySidebar'
import PdfDownloadButton from '../components/review/PdfDownloadButton'
import { useTaxReturn, useAuthUser } from '../lib/context/TaxReturnContext'
import { calculateAGI } from '../lib/engine/calculations/tax-calculator'
import FormNavigation from '../components/common/FormNavigation'
import SaveStatusIndicator from '../components/common/SaveStatusIndicator'
import ZoeyGuideCard from '../components/brand/ZoeyGuideCard'
import ZoeyImage from '../components/brand/ZoeyImage'
import { WizardStep } from '../types/tax-types'

const STEP_ORDER: WizardStep[] = [
  'personal-info',
  'dependents',
  'income-w2',
  'income-interest',
  'income-capital-gains',
  'income-self-employment',
  'income-rental',
  'retirement-accounts',
  'deductions',
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

// Import localStorage banner shown after login
function ImportBanner() {
  const { importFromLocalStorage } = useTaxReturn()
  const [show] = useState(() => {
    const hasLocalData = !!localStorage.getItem('taxReturn2026')
    const alreadyAsked = !!sessionStorage.getItem('importAsked')
    return hasLocalData && !alreadyAsked
  })
  const [dismissed, setDismissed] = useState(false)

  if (!show || dismissed) return null

  const handleImport = async () => {
    await importFromLocalStorage()
    sessionStorage.setItem('importAsked', '1')
    setDismissed(true)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('importAsked', '1')
    setDismissed(true)
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-blue-800">
          📂 We found locally saved tax data. Would you like to import it into your account?
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleImport}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium"
          >
            Import
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
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
      <ImportBanner />
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [currentStep])

  if (currentStep === 'welcome') {
    return (
      <WelcomeScreen
        onStart={() => setCurrentStep('personal-info')}
        onResume={() => {
          // Resume to the saved step (already loaded into currentStep from localStorage/DB).
          // The context loads savedStep on mount, but since we're on 'welcome' the user
          // explicitly navigated here. Read the persisted step directly.
          const savedStep = localStorage.getItem('currentStep')
          if (savedStep && savedStep !== 'welcome') {
            setCurrentStep(savedStep as WizardStep)
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
