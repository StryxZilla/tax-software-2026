import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import CurrencyInput, {
  formatCurrencyForEditing,
  formatCurrencyWithCommas,
  parseCurrencyInput,
} from '../../components/common/CurrencyInput'

describe('CurrencyInput invariants', () => {
  it('renders with currency-input wrapper class', () => {
    const html = renderToString(<CurrencyInput placeholder="0.00" />)
    expect(html).toContain('currency-input')
  })

  it('renders with currency-input-prefix class on $ span', () => {
    const html = renderToString(<CurrencyInput placeholder="0.00" />)
    expect(html).toContain('currency-input-prefix')
    expect(html).toContain('$')
  })

  it('input has pl-8 spacing class for prefix clearance', () => {
    const html = renderToString(<CurrencyInput placeholder="0.00" />)
    expect(html).toContain('pl-8')
  })

  it('renders as type="text" to support comma-formatted values', () => {
    const html = renderToString(<CurrencyInput />)
    expect(html).toContain('type="text"')
    expect(html).toContain('inputMode="decimal"')
  })

  it('applies error styling when hasError is true', () => {
    const html = renderToString(<CurrencyInput hasError />)
    expect(html).toContain('border-red-300')
  })

  it('applies normal styling when hasError is false', () => {
    const html = renderToString(<CurrencyInput hasError={false} />)
    expect(html).toContain('border-slate-300')
  })
})

describe('currency comma formatting and parsing', () => {
  it('formats display values with thousands separators', () => {
    expect(formatCurrencyWithCommas(1234567.8)).toBe('1,234,567.80')
  })

  it('uses plain numeric string in editable context', () => {
    expect(formatCurrencyForEditing(1234567.8)).toBe('1234567.8')
  })

  it('round-trips comma-formatted user input back to numeric value', () => {
    const parsed = parseCurrencyInput('1,234,567.89')
    expect(parsed).toBe(1234567.89)
    expect(formatCurrencyWithCommas(parsed)).toBe('1,234,567.89')
  })

  it('parses values with optional $ and spaces', () => {
    expect(parseCurrencyInput(' $ 12,345.67 ')).toBe(12345.67)
  })
})
