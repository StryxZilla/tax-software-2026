import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import RetirementForm from '../../components/forms/RetirementForm'

describe('RetirementForm help content', () => {
  it('uses Backdoor Roth terminology in the help button text', () => {
    const html = renderToString(
      <RetirementForm
        onUpdate={() => {}}
        form8606={{
          nondeductibleContributions: 0,
          priorYearBasis: 0,
          conversionsToRoth: 0,
          distributionsFromTraditionalIRA: 0,
          endOfYearTraditionalIRABalance: 0,
        }}
      />,
    )

    expect(html).toContain('💡 Backdoor Roth Help')
    expect(html).not.toContain('Mega Backdoor Roth Help')
  })

  it('renders conversion breakdown without NaN for legacy Form 8606 payloads', () => {
    const html = renderToString(
      <RetirementForm
        onUpdate={() => {}}
        form8606={{
          nondeductibleContributions: 0,
          priorYearBasis: 0,
          conversionsToRoth: 7000,
          endOfYearTraditionalIRABalance: 0,
          distributionsFromTraditionalIRA: undefined as unknown as number,
        }}
      />,
    )

    expect(html).not.toContain('NaN')
    expect(html).toContain('$7,000')
  })

  it('does not force a leading 0 in current-year nondeductible contribution input', () => {
    const html = renderToString(
      <RetirementForm
        onUpdate={() => {}}
        form8606={{
          nondeductibleContributions: 0,
          priorYearBasis: 0,
          conversionsToRoth: 0,
          distributionsFromTraditionalIRA: 0,
          endOfYearTraditionalIRABalance: 0,
        }}
      />,
    )

    expect(html).toMatch(/Nondeductible Contributions - Current Year[\s\S]*value="0\.00"/)
  })
})
