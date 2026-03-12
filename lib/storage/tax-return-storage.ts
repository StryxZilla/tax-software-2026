const STORAGE_BASENAME = {
  taxReturn: 'taxReturn2026',
  currentStep: 'currentStep',
  resumeStep: 'resumeStep',
  completedSteps: 'completedSteps',
  skippedSteps: 'skippedSteps',
} as const

export type TaxReturnStorageKeys = {
  taxReturn: string
  currentStep: string
  resumeStep: string
  completedSteps: string
  skippedSteps: string
}

function withUserScope(baseKey: string, userId?: string | null): string {
  if (!userId) return baseKey
  return `${baseKey}:user:${userId}`
}

export function getTaxReturnStorageKeys(userId?: string | null): TaxReturnStorageKeys {
  return {
    taxReturn: withUserScope(STORAGE_BASENAME.taxReturn, userId),
    currentStep: withUserScope(STORAGE_BASENAME.currentStep, userId),
    resumeStep: withUserScope(STORAGE_BASENAME.resumeStep, userId),
    completedSteps: withUserScope(STORAGE_BASENAME.completedSteps, userId),
    skippedSteps: withUserScope(STORAGE_BASENAME.skippedSteps, userId),
  }
}

export function getWizardStepFromStorage(userId?: string | null): string | null {
  const keys = getTaxReturnStorageKeys(userId)
  const savedStep = localStorage.getItem(keys.currentStep)
  const resumeStep = localStorage.getItem(keys.resumeStep)
  return savedStep && savedStep !== 'welcome' ? savedStep : resumeStep
}

export function hasGuestLocalDraft(): boolean {
  return !!localStorage.getItem(STORAGE_BASENAME.taxReturn)
}
