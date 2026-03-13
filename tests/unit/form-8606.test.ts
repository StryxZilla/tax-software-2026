import { describe, it, expect } from 'vitest'
import { calculateForm8606 } from '../../lib/engine/forms/form-8606'

describe('Form 8606 calculations', () => {
  it('handles zero values and missing legacy line-5 data without NaN', () => {
    const result = calculateForm8606({
      nondeductibleContributions: 0,
      priorYearBasis: 0,
      conversionsToRoth: 7000,
      endOfYearTraditionalIRABalance: 0,
      // Simulate older saved payloads created before this field existed.
      distributionsFromTraditionalIRA: undefined as unknown as number,
    })

    expect(result.line8_totalIRABalancePlusDistributions).toBe(7000)
    expect(result.line9_basisPercentage).toBe(0)
    expect(result.line17_nontaxablePortion).toBe(0)
    expect(result.line18_taxablePortion).toBe(7000)

    for (const value of Object.values(result)) {
      expect(Number.isNaN(value)).toBe(false)
    }
  })

  it('uses the corrected pro-rata pool math (line 8 = line 6 + line 7 only)', () => {
    const result = calculateForm8606({
      nondeductibleContributions: 7000,
      priorYearBasis: 0,
      conversionsToRoth: 7000,
      distributionsFromTraditionalIRA: 0,
      endOfYearTraditionalIRABalance: 100000,
    })

    expect(result.line8_totalIRABalancePlusDistributions).toBe(107000)
    expect(result.line9_basisPercentage).toBeCloseTo(7000 / 107000, 8)
    expect(result.line17_nontaxablePortion).toBe(458)
    expect(result.line18_taxablePortion).toBe(6542)
  })
})
