# Tax Summary Page UX Plan

**Author:** Subagent  
**Date:** 2026-03-16  
**Goal:** Replace cluttered sidebar with a clean, scannable single-page summary

---

## Current Problems

1. **Cluttered sidebar** - Too much visual noise (dual charts, dense data)
2. **Missing key data** - QBI, AMT, Additional Medicare Tax, tax insights not shown
3. **No warnings** - Users don't know about missed credits (EITC, etc.)
4. **No interactivity** - Can't explore "what-if" scenarios
5. **No progress indicator** - Users don't know how complete their return is

---

## Layout Structure

### Page Layout (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Progress Bar + Return Status                       │
├─────────────────────────────────────────────────────────────┤
│  HERO: Refund/Owed Card (big, bold, color-coded)            │
├─────────────────────────────────────────────────────────────┤
│  GRID: Key Numbers (Income, AGI, Tax, Effective Rate)       │
├─────────────────────────────────────────────────────────────┤
│  WARNINGS BAR: Alert cards for missed credits/opportunities │
├──────────────────────────┬──────────────────────────────────┤
│  TAX BREAKDOWN           │  DEDUCTIONS & CREDITS            │
│  (expandable card)       │  (expandable card)               │
├──────────────────────────┴──────────────────────────────────┤
│  TAX PLANNING INSIGHTS                                     │
│  - 401(k) optimization • Backdoor Roth • Rate analysis     │
├─────────────────────────────────────────────────────────────┤
│  WHAT-IF SCENARIOS (interactive sliders)                    │
│  - 401(k) contributions • IRA contributions                │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: Last saved + "Ready to file" status               │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop:** Full width, 2-column layout for breakdown sections
- **Tablet:** Stack everything, keep hero prominent
- **Mobile:** Single column, collapsible sections, sticky "Refund/Owed" FAB

---

## Component Breakdown

### 1. Progress Header

**Purpose:** Show how complete the return is

| Data | Source |
|------|--------|
| Completion % | Count of filled sections / total sections |
| Sections complete | List of filled sections |
| Missing items | What's still needed |

**Visual:** Horizontal progress bar with segments colored by completion status
- Green = complete
- Yellow = partially filled
- Red = missing required data

**Interaction:** Click to expand list of incomplete items

---

### 2. Hero Card (Refund/Owed)

**Purpose:** The #1 thing users want to see

```
┌────────────────────────────────────────────┐
│  💰 EXPECTED REFUND                        │
│                                            │
│       $3,247                               │
│                                            │
│  ████████████░░░░░░  73% of tax paid       │
└────────────────────────────────────────────┘
```

**Data:**
- `taxCalculation.refundOrAmountOwed` (positive = refund, negative = owed)
- `taxCalculation.federalTaxWithheld`
- `taxCalculation.totalTax`

**Visual:**
- Green gradient for refund, red/orange for owe
- Large typography (48px+)
- Subtitle shows % of tax already paid via withholding

---

### 3. Key Metrics Grid

**Purpose:** Scannable overview of core numbers

| Metric | Source | Priority |
|--------|--------|----------|
| Total Income | `taxCalculation.totalIncome` | High |
| Adjusted Gross Income | `taxCalculation.agi` | High |
| Taxable Income | `taxCalculation.taxableIncome` | High |
| Effective Rate | calculated | High |
| Marginal Rate | calculated | Medium |
| QBI Deduction | `taxCalculation.qbiDeduction` | **NEW** |

**Layout:** 2x3 grid on desktop, 2x3 stack on mobile

**Interaction:** Each cell clickable → opens detailed modal

---

### 4. Warnings & Opportunities Bar

**Purpose:** Alert users to missed benefits

| Warning | Condition | Priority |
|---------|-----------|----------|
| "You may qualify for EITC" | AGI in range, no EITC claimed | HIGH |
| "Consider 401(k) increase" | Contributions < 50% of limit | MEDIUM |
| "Backdoor Roth option" | AGI > $150k, no Roth contributions | MEDIUM |
| "AMT may apply" | AMT > 0 | HIGH |
| "Additional Medicare Tax" | `additionalMedicareTax` > 0 | MEDIUM |

**Visual:** Horizontal scrollable cards or stacked on mobile
- Warning icon + title + brief explanation
- "Take action" link → navigates to relevant form section

**Data Source:** New warnings utility combining:
- `calculateEITC()` result (if 0 but AGI suggests eligibility)
- `taxCalculation.amt` (if > 0)
- `taxCalculation.additionalMedicareTax` (if > 0)
- Tax planning insights (401k, backdoor Roth)

---

### 5. Tax Breakdown Card (Expandable)

**Purpose:** Show where taxes come from without cluttering main view

**Collapsed State:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Tax Breakdown                    [Expand ▼]    │
│                                                     │
│  Regular Tax: $8,420  •  AMT: $0  •  SE Tax: $2,180│
└─────────────────────────────────────────────────────┘
```

**Expanded State (Modal/Drawer):**
```
┌─────────────────────────────────────────────────────┐
│  Tax Breakdown                              [Close] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Income Tax Brackets                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ 10% on $0 - $11,600       → $1,160         │   │
│  │ 12% on $11,601 - $47,150   → $4,266         │   │
│  │ 22% on $47,151 - $100,525  → $11,742        │   │
│  │ ...                                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Other Taxes                                        │
│  • Self-Employment Tax: $2,180                     │
│  • Additional Medicare Tax: $0                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data:**
- Bracket breakdown (existing in code)
- `taxCalculation.regularTax`
- `taxCalculation.amt`
- `taxCalculation.selfEmploymentTax`
- `taxCalculation.additionalMedicareTax`

---

### 6. Deductions & Credits Card (Expandable)

**Purpose:** Show what reduced the tax bill

**Collapsed State:**
```
┌─────────────────────────────────────────────────────┐
│  🎯 Deductions & Credits              [Expand ▼]   │
│                                                     │
│  Standard Deduction: $14,600 • Credits: $3,000    │
└─────────────────────────────────────────────────────┘
```

**Expanded State:**
- Itemized vs Standard toggle explanation
- Each credit with amount: Child Tax Credit, EITC, Education, etc.
- "Why did I get this credit?" tooltips

**Data:**
- `taxCalculation.standardOrItemizedDeduction`
- `taxCalculation.totalCredits`
- Individual credit calculations

---

### 7. Tax Planning Insights Section

**Purpose:** Actionable advice from `tax-planning.ts`

**Structure:** 3-column cards on desktop, stacked on mobile

#### 7a. 401(k) Optimization Card

```
┌─────────────────────────────────────────┐
│  401(k) Optimization                    │
│                                         │
│  ████████████░░░░░  68% of limit        │
│  $16,000 / $23,500                     │
│                                         │
│  💡 You're leaving $7,500 on the table │
│     Increasing contributions could      │
│     save ~$1,650 in taxes               │
│                                         │
│  [Adjust Contributions] →              │
└─────────────────────────────────────────┘
```

**Data:** `calculateRetirementAnalysis()` → `401kOptimization`

#### 7b. Backdoor Roth Card

```
┌─────────────────────────────────────────┐
│  Backdoor Roth IRA                      │
│                                         │
│  ⚠️ AGI exceeds direct contribution    │
│     limit ($165K single)                │
│                                         │
│  💡 Consider: Non-deductible           │
│     Traditional IRA → convert to Roth  │
│     Could add $7,000 to tax-free       │
│     growth annually                     │
│                                         │
│  [Learn More]                           │
└─────────────────────────────────────────┘
```

**Data:** `calculateRetirementAnalysis()` → `backdoorRoth`

#### 7c. Tax Rate Analysis Card

```
┌─────────────────────────────────────────┐
│  Your Tax Rates                         │
│                                         │
│  Effective: 14.2%  ← actual % paid      │
│  Marginal:  22%   ← next $1 taxed at   │
│                                         │
│  The difference: Deductions and         │
│  progressive brackets lower your       │
│  effective rate                         │
└─────────────────────────────────────────┘
```

**Data:** `calculateTaxRateAnalysis()`

---

### 8. What-If Scenarios Section

**Purpose:** Interactive exploration of tax impact

**Structure:** Sliders with real-time calculation

#### 8a. 401(k) Contribution Scenario

```
┌─────────────────────────────────────────────────────┐
│  What if I contribute more to 401(k)?              │
│                                                     │
│  [━━━━━━━●━━━━━━━━━━━━━━━━━━] $16,000 → $20,000  │
│                                                     │
│  📊 Impact:                                        │
│  • Tax savings: $880                                │
│  • Effective rate: 14.2% → 13.9%                   │
│  • Take-home cost: $3,120 (instead of $4,000)     │
│                                                     │
│  [Apply This Change]  [Reset]                     │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
- Drag slider to adjust contribution amount
- Recalculate on-the-fly (debounced 300ms)
- "Apply" stores new value in context
- Show net cost vs tax savings

#### 8b. IRA Contribution Scenario

```
┌─────────────────────────────────────────────────────┐
│  What if I contribute to Traditional IRA?          │
│                                                     │
│  [━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━] $0 → $7,000    │
│                                                     │
│  📊 Impact:                                        │
│  • Deduction: $7,000                               │
│  • Tax savings: $1,540 (at 22% marginal)          │
│                                                     │
│  ⚠️ Note: Deductibility depends on 401(k)        │
│     coverage and income. [Check eligibility]       │
└─────────────────────────────────────────────────────┘
```

---

### 9. Footer Status

**Purpose:** Reassurance that return is ready

```
┌─────────────────────────────────────────────────────┐
│  ✓ All sections complete   •   Last saved 2m ago   │
│                                                     │
│  [ ← Back to Return ]     [ Review & File → ]      │
└─────────────────────────────────────────────────────┘
```

**Data:**
- `lastSaved` timestamp
- Completion status from progress header

---

## Interaction Flows

### Expandable Cards (Tax Breakdown, Deductions)

1. User sees collapsed card with summary
2. Click "Expand" chevron/button
3. Card slides open OR opens as right-side drawer (mobile: bottom sheet)
4. Click outside, "Close" button, or swipe down to collapse

### Warning Cards

1. Warning appears in bar if condition met
2. Click warning → expands to show explanation
3. "Take Action" button navigates to relevant form section

### What-If Sliders

1. User drags slider
2. 300ms debounce
3. Recalculate function runs (read-only, doesn't persist)
4. Update UI with new values
5. "Apply" button → update taxReturn context → full recalculate
6. "Reset" returns slider to current value

### Progress Completion

1. Header shows X% complete
2. Click expands list of incomplete items
3. Each item links to corresponding form section
4. Form sections emit "completed" events on valid submit

---

## Priority Ordering

### Phase 1: Must Have (MVP)
1. Progress indicator header
2. Hero card (refund/owed) - enlarge existing
3. Key metrics grid with QBI added
4. Expandable tax breakdown (add AMT, Additional Medicare Tax)
5. Basic warnings (AMT status, Additional Medicare Tax)
6. Footer status

### Phase 2: Should Have
1. Deductions & credits expandable
2. Tax planning insights (401k, Roth, rates)
3. Warning cards (EITC, missed opportunities)

### Phase 3: Nice to Have
1. What-if scenarios with sliders
2. Advanced warnings (SALT cap, phase-outs)
3. Animated transitions

---

## Data Required

### From taxCalculation
```typescript
{
  totalIncome: number;
  agi: number;
  taxableIncome: number;
  qbiDeduction: number;           // NEW DISPLAY
  regularTax: number;
  amt: number;                   // NEW DISPLAY
  additionalMedicareTax: number;  // NEW DISPLAY
  selfEmploymentTax: number;
  totalCredits: number;
  totalTax: number;
  federalTaxWithheld: number;
  refundOrAmountOwed: number;
}
```

### From taxPlanning.ts
```typescript
{
  retirement: {
    '401kOptimization': {
      currentContributions: number;
      annualLimit: number;
      percentUsed: number;
      leftOnTable: number;
      recommendation: string;
    };
    backdoorRoth: {
      eligible: boolean;
      reason: string;
      recommendation: string;
    };
  };
  taxRates: {
    effectiveRatePercent: number;
    marginalRatePercent: number;
    breakdown: string;
  };
}
```

### Warnings (derived)
- EITC eligibility (calculateEITC returns 0 but AGI suggests eligibility)
- AMT triggered (amt > 0)
- Additional Medicare Tax (additionalMedicareTax > 0)
- 401k under-utilized (percentUsed < 50%)
- Backdoor Roth opportunity (AGI > threshold, no Roth contributions)

---

## Implementation Notes

1. **Keep charts minimal** - The existing Recharts are fine for bracket breakdown, but move to expandable modal
2. **Mobile-first** - The bottom sheet pattern works well; adapt existing mobile code
3. **Performance** - What-if calculations should be cached and debounced
4. **Accessibility** - All expandables need ARIA controls; sliders need keyboard support
5. **Persistence** - What-if "Apply" should persist to actual taxReturn; "Reset" reverts
