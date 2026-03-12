/**
 * Vitest setup for integration tests (happy-dom environment).
 * Import this at the top of each integration test file, or import
 * from helpers.tsx which re-exports everything.
 *
 * NOTE: This file is NOT in vitest.config.ts setupFiles to avoid
 * polluting unit tests that run in node environment.
 */
import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

export const useSessionMock = vi.fn(() => ({ data: null, status: 'unauthenticated' as const }))

// ---------- next-auth/react mock ----------
vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ---------- next/navigation mock ----------
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// ---------- window.confirm stub ----------
vi.stubGlobal('confirm', vi.fn(() => true))

// ---------- Reset state between tests ----------
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
