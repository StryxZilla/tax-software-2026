import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../../components/common/CurrencyInput'

describe('formatCurrency', () => {
  it('formats number to 2 decimal places', () => {
    expect(formatCurrency(50000)).toBe('50000.00')
  })

  it('preserves existing decimals', () => {
    expect(formatCurrency(1234.5)).toBe('1234.50')
  })

  it('rounds to 2 decimals', () => {
    expect(formatCurrency(1234.567)).toBe('1234.57')
  })

  it('returns 0.00 for 0', () => {
    expect(formatCurrency(0)).toBe('0.00')
  })

  it('returns empty string for undefined', () => {
    expect(formatCurrency(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(formatCurrency(null)).toBe('')
  })

  it('handles small values', () => {
    expect(formatCurrency(0.01)).toBe('0.01')
  })

  it('handles negative values', () => {
    expect(formatCurrency(-500.1)).toBe('-500.10')
  })
})
