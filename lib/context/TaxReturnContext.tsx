'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { TaxReturn, WizardStep, TaxCalculation } from '../../types/tax-types'
import { calculateTaxReturn } from '../engine/calculations/tax-calculator'
import { getTaxReturnStorageKeys } from '../storage/tax-return-storage'

interface TaxReturnContextType {
  taxReturn: TaxReturn
  updateTaxReturn: (updates: Partial<TaxReturn>) => void
  currentStep: WizardStep
  setCurrentStep: (step: WizardStep) => void
  completedSteps: Set<WizardStep>
  markStepCompleted: (step: WizardStep) => void
  skippedSteps: Set<WizardStep>
  markStepSkipped: (step: WizardStep) => void
  taxCalculation: TaxCalculation | null
  isCalculating: boolean
  lastSaved: Date | null
  recalculateTaxes: () => Promise<void>
  forceSave: () => Promise<void>
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  resetTaxReturn: () => void
  importFromLocalStorage: () => Promise<void>
}

const TaxReturnContext = createContext<TaxReturnContextType | undefined>(undefined)

const initialTaxReturn: TaxReturn = {
  personalInfo: {
    firstName: '',
    lastName: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'Single',
    age: 30,
    isBlind: false,
  },
  dependents: [],
  w2Income: [],
  interest: [],
  dividends: [],
  capitalGains: [],
  rentalProperties: [],
  selfEmployment: {
    businessName: '',
    ein: '',
    businessCode: '',
    grossReceipts: 0,
    returns: 0,
    costOfGoodsSold: 0,
    expenses: {
      advertising: 0,
      carAndTruck: 0,
      commissions: 0,
      contractLabor: 0,
      depletion: 0,
      depreciation: 0,
      employeeBenefitPrograms: 0,
      insurance: 0,
      interest: 0,
      legal: 0,
      officeExpense: 0,
      pension: 0,
      rentLease: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: 0,
      mealsAndEntertainment: 0,
      utilities: 0,
      wages: 0,
      other: 0,
    },
  },
  aboveTheLineDeductions: {
    educatorExpenses: 0,
    studentLoanInterest: 0,
    hsaDeduction: 0,
    movingExpenses: 0,
    selfEmploymentTaxDeduction: 0,
    selfEmployedHealthInsurance: 0,
    sepIRA: 0,
    alimonyPaid: 0,
  },
  educationExpenses: [],
  estimatedTaxPayments: 0,
}

export function TaxReturnProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [taxReturn, setTaxReturn] = useState<TaxReturn>(initialTaxReturn)
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome')
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<WizardStep>>(new Set())
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dbLoaded, setDbLoaded] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const isAuthenticated = status === 'authenticated'
  const currentUserId = session?.user?.id ?? null
  const storageKeys = useMemo(() => getTaxReturnStorageKeys(currentUserId), [currentUserId])

  // Load data on auth state change
  useEffect(() => {
    if (status === 'authenticated' && !dbLoaded) {
      loadFromDb()
    } else if (status === 'unauthenticated') {
      loadFromLocalStorage()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dbLoaded, storageKeys])

  // Ensure a new login identity always rehydrates from that user's scope.
  useEffect(() => {
    if (status === 'authenticated') {
      setDbLoaded(false)
      setTaxReturn(initialTaxReturn)
      setCurrentStep('welcome')
      setCompletedSteps(new Set())
      setSkippedSteps(new Set())
      setTaxCalculation(null)
    }
  }, [status, currentUserId])

  // Auto-save: localStorage always, DB when authenticated (debounced)
  useEffect(() => {
    if (status === 'loading') return
    // Don't overwrite localStorage before DB restore completes (prevents
    // the initial 'welcome' state from clobbering the persisted step).
    if (isAuthenticated && !dbLoaded) return

    // Always save to localStorage as fallback
    saveToLocalStorage()

    // Debounced save to DB when authenticated
    if (isAuthenticated && dbLoaded) {
      if (saveTimeout) clearTimeout(saveTimeout)
      const t = setTimeout(() => {
        saveToDb()
      }, 1500)
      setSaveTimeout(t)
    }

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxReturn, currentStep, completedSteps, skippedSteps])

  const loadFromDb = async () => {
    try {
      const res = await fetch('/api/tax-return')
      if (!res.ok) return
      const { data } = await res.json()
      if (data) {
        setTaxReturn(data)
      } else {
        // DB has no data yet — fall back to localStorage (covers the case
        // where a debounced DB save hadn't completed before refresh).
        const localData = localStorage.getItem(storageKeys.taxReturn)
        if (localData) {
          const parsed = JSON.parse(localData)
          setTaxReturn(parsed)
        }
      }
      // Restore wizard step and completed steps from localStorage (not stored in DB)
      const savedStep = localStorage.getItem(storageKeys.currentStep)
      const resumeStep = localStorage.getItem(storageKeys.resumeStep)
      if (savedStep) {
        setCurrentStep(savedStep as WizardStep)
      } else if (resumeStep) {
        setCurrentStep(resumeStep as WizardStep)
      }
      const savedCompleted = localStorage.getItem(storageKeys.completedSteps)
      if (savedCompleted) {
        setCompletedSteps(new Set(JSON.parse(savedCompleted)))
      }
      const savedSkipped = localStorage.getItem(storageKeys.skippedSteps)
      if (savedSkipped) {
        setSkippedSteps(new Set(JSON.parse(savedSkipped)))
      }
      setDbLoaded(true)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading from DB:', error)
      }
      setDbLoaded(true)
    }
  }

  const saveToDb = useCallback(async () => {
    try {
      const res = await fetch('/api/tax-return', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: taxReturn }),
      })
      if (res.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving to DB:', error)
      }
    }
  }, [taxReturn])

  const markStepCompleted = useCallback((step: WizardStep) => {
    setCompletedSteps(prev => {
      if (prev.has(step)) return prev
      const next = new Set(prev)
      next.add(step)
      return next
    })
    // If completing a previously skipped step, remove from skipped
    setSkippedSteps(prev => {
      if (!prev.has(step)) return prev
      const next = new Set(prev)
      next.delete(step)
      return next
    })
  }, [])

  const markStepSkipped = useCallback((step: WizardStep) => {
    setSkippedSteps(prev => {
      if (prev.has(step)) return prev
      const next = new Set(prev)
      next.add(step)
      return next
    })
  }, [])

  const updateTaxReturn = (updates: Partial<TaxReturn>) => {
    setTaxReturn(prev => ({ ...prev, ...updates }))
  }

  // Reactively recompute taxes whenever taxReturn changes.
  // This replaces the old manual recalculateTaxes() pattern that required
  // every form onChange to explicitly trigger recalculation — and missed
  // data restored from DB/localStorage, causing the summary to disappear.
  useEffect(() => {
    // Skip recalculation while DB data is still loading for authenticated users
    if (isAuthenticated && !dbLoaded) return

    const hasAnyIncome =
      taxReturn.w2Income.length > 0 ||
      taxReturn.interest.length > 0 ||
      taxReturn.dividends.length > 0 ||
      taxReturn.capitalGains.length > 0 ||
      (taxReturn.selfEmployment && taxReturn.selfEmployment.grossReceipts > 0) ||
      taxReturn.rentalProperties.length > 0

    if (!hasAnyIncome && !taxReturn.personalInfo.firstName) {
      // No meaningful data yet — keep taxCalculation null
      setTaxCalculation(null)
      return
    }

    setIsCalculating(true)
    // Yield a tick so React can flush any pending state before we read taxReturn
    const id = setTimeout(() => {
      try {
        const calculation = calculateTaxReturn(taxReturn)
        setTaxCalculation(calculation)
      } finally {
        setIsCalculating(false)
      }
    }, 0)
    return () => clearTimeout(id)
  }, [taxReturn, isAuthenticated, dbLoaded])

  // Explicit save triggered by user clicking "Save" button
  const forceSave = useCallback(async () => {
    saveToLocalStorage()
    if (isAuthenticated) {
      await saveToDb()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxReturn, currentStep, completedSteps, skippedSteps, isAuthenticated, saveToDb])

  // Keep recalculateTaxes as a no-op for backward compat with form onChange
  // callers. The useEffect above handles all recomputation now.
  const recalculateTaxes = useCallback(async () => {
    // Intentionally empty — calculation is now reactive via useEffect
  }, [])

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(storageKeys.taxReturn, JSON.stringify(taxReturn))
      localStorage.setItem(storageKeys.currentStep, currentStep)
      if (currentStep !== 'welcome') {
        localStorage.setItem(storageKeys.resumeStep, currentStep)
      }
      localStorage.setItem(storageKeys.completedSteps, JSON.stringify([...completedSteps]))
      localStorage.setItem(storageKeys.skippedSteps, JSON.stringify([...skippedSteps]))
      if (!isAuthenticated) {
        setLastSaved(new Date())
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving to localStorage:', error)
      }
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(storageKeys.taxReturn)
      const savedStep = localStorage.getItem(storageKeys.currentStep)
      const resumeStep = localStorage.getItem(storageKeys.resumeStep)
      const savedCompleted = localStorage.getItem(storageKeys.completedSteps)
      const savedSkipped = localStorage.getItem(storageKeys.skippedSteps)
      if (saved) {
        setTaxReturn(JSON.parse(saved))
      }
      if (savedStep) {
        setCurrentStep(savedStep as WizardStep)
      } else if (resumeStep) {
        setCurrentStep(resumeStep as WizardStep)
      }
      if (savedCompleted) {
        setCompletedSteps(new Set(JSON.parse(savedCompleted)))
      }
      if (savedSkipped) {
        setSkippedSteps(new Set(JSON.parse(savedSkipped)))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading from localStorage:', error)
      }
    }
  }

  // Import localStorage data into DB (called after login if user wants to migrate)
  const importFromLocalStorage = async () => {
    try {
      const saved = localStorage.getItem(storageKeys.taxReturn)
      if (!saved) return
      const data = JSON.parse(saved)
      await fetch('/api/tax-return', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      setTaxReturn(data)
      setLastSaved(new Date())
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error importing from localStorage:', error)
      }
    }
  }

  const resetTaxReturn = () => {
    if (!window.confirm('Are you sure you want to clear all tax data? This cannot be undone.')) {
      return
    }
    setTaxReturn(initialTaxReturn)
    setCurrentStep('personal-info')
    setCompletedSteps(new Set())
    setSkippedSteps(new Set())
    setTaxCalculation(null)
    localStorage.removeItem(storageKeys.taxReturn)
    localStorage.removeItem(storageKeys.currentStep)
    localStorage.removeItem(storageKeys.completedSteps)
    localStorage.removeItem(storageKeys.skippedSteps)
    localStorage.removeItem(storageKeys.resumeStep)
    setLastSaved(null)

    // Clear from DB too if authenticated
    if (isAuthenticated) {
      fetch('/api/tax-return', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: initialTaxReturn }),
      }).catch(() => {})
    }
  }

  return (
    <TaxReturnContext.Provider
      value={{
        taxReturn,
        updateTaxReturn,
        currentStep,
        setCurrentStep,
        completedSteps,
        markStepCompleted,
        skippedSteps,
        markStepSkipped,
        taxCalculation,
        isCalculating,
        lastSaved,
        recalculateTaxes,
        forceSave,
        saveToLocalStorage,
        loadFromLocalStorage,
        resetTaxReturn,
        importFromLocalStorage,
      }}
    >
      {children}
    </TaxReturnContext.Provider>
  )
}

export function useTaxReturn() {
  const context = useContext(TaxReturnContext)
  if (!context) {
    throw new Error('useTaxReturn must be used within a TaxReturnProvider')
  }
  return context
}

// Export session user info helper
export function useAuthUser() {
  const { data: session } = useSession()
  return session?.user ?? null
}
