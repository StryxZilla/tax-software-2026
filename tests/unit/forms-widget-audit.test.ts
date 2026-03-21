import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../..')

function readForm(fileName: string) {
  return fs.readFileSync(path.join(repoRoot, 'components/forms', fileName), 'utf8')
}

describe('forms widget audit', () => {
  it('uses CurrencyInput for Schedule C income currency fields', () => {
    const source = readForm('ScheduleCForm.tsx')

    expect(source).toContain('value={formData.grossReceipts}')
    expect(source).toContain('value={formData.returns}')
    expect(source).toContain('value={formData.costOfGoodsSold}')

    expect(source).toContain('onValueChange={(grossReceipts) => updateBusinessInfo({ grossReceipts })}')
    expect(source).toContain('onValueChange={(returns) => updateBusinessInfo({ returns })}')
    expect(source).toContain('onValueChange={(costOfGoodsSold) => updateBusinessInfo({ costOfGoodsSold })}')

    expect(source).not.toContain('onChange={(e) => updateBusinessInfo({ grossReceipts: parseFloat(e.target.value) || 0 })}')
    expect(source).not.toContain('onChange={(e) => updateBusinessInfo({ returns: parseFloat(e.target.value) || 0 })}')
    expect(source).not.toContain('onChange={(e) => updateBusinessInfo({ costOfGoodsSold: parseFloat(e.target.value) || 0 })}')
    expect(source).not.toContain('type="number"')
  })

  it('raw number inputs in forms are limited to non-currency fields', () => {
    const formsDir = path.join(repoRoot, 'components/forms')
    const files = fs.readdirSync(formsDir).filter((f) => f.endsWith('.tsx'))

    const filesWithNumberInputs = files.filter((file) => readForm(file).includes('type="number"'))

    expect(filesWithNumberInputs.sort()).toEqual([
      'DependentsForm.tsx',
      'Form1099KList.tsx',
      'PersonalInfoForm.tsx',
      'RentalPropertyForm.tsx',
      'Schedule1ADeductionsForm.tsx',
    ])
  })
})
