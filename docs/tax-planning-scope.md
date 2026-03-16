# Tax Planning Analysis - Scope

## Overview
Add helpful tax planning insights to the review page. Each module should be independently deployable.

---

## Module 1: Retirement Contribution Analysis

**Purpose:** Analyze retirement account contributions for optimization opportunities

### 1.1 401k/403b Optimization
- **Inputs:** W-2 wages, current 401k/403b contributions (if collected)
- **Logic:**
  - Compare to annual limits ($23,500 for 2025 under 50, $31,000 if 50+)
  - Calculate "left on table" match money (if employer info available)
  - Suggest contribution increases to hit limits
- **Output:** "You're contributing $X toward the $23,500 limit. Consider adding $Y more to maximize tax savings."

### 1.2 Backdoor Roth Analysis
- **Inputs:** Filing status, AGI, traditional IRA deductions, Roth IRA contributions
- **Logic:**
  - Check if income exceeds Roth IRA limits (phase-out starts at $150k single, $236k married)
  - If doing traditional IRA deductions + backdoor = pro-rata rule warning
  - If high income + no Roth = explain backdoor option
- **Output:** "Your income may qualify for Roth contributions" or "Consider backdoor Roth since you're above the limit"

### 1.3 Mega Backdoor Roth
- **Inputs:** W-2 income, employer plan type (check Box 13 for 401k match)
- **Logic:**
  - Requires after-tax 401k contributions + in-service distribution
  - Generally only available at certain employers
- **Output:** "Your employer plan may support mega backdoor Roth - worth asking HR"

### 1.4 HSA Analysis
- **Inputs:** HSA data (contributions, distributions), self-employment status
- **Logic:**
  - Triple tax advantage explanation
  - Compare current HSA usage to potential
  - If self-employed + HSA = can deduct as business expense
- **Output:** HSA optimization tips

---

## Module 2: Tax Rate Analysis

### 2.1 Marginal vs Effective Rate
- **Inputs:** Taxable income, total tax, filing status
- **Logic:**
  - Effective rate = total tax / total income
  - Marginal rate = top bracket you're in
- **Output:** "Your effective rate is X% (you pay $Y in taxes on $Z income). Your marginal rate is Z%."

### 2.2 Capital Gains Analysis
- **Inputs:** Short-term gains, long-term gains, total income
- **Logic:**
  - Determine if STCG pushes into higher brackets
  - LTCG rates: 0%, 15%, 20% based on income
  - NIIT (3.8% surtax) threshold
- **Output:** "X% of your capital gains are taxed at preferential rates"

---

## Module 3: Deduction Optimization

### 3.1 Itemized vs Standard
- **Inputs:** Itemized deductions total, standard deduction for filing status
- **Logic:** Compare and explain which is better
- **Output:** "You're taking the standard deduction of $X. Itemizing would save/don't save $Y."

### 3.2 Estimated Tax Recommendations
- **Inputs:** Tax liability, withholding, filing status
- **Logic:**
  - Calculate underpayment penalty thresholds
  - Safe harbor amounts
- **Output:** "You should withhold at least $X to avoid penalties"

---

## Module 4: Summary Cards (UI)

Add to review page:
- "💰 Tax Planning Insights" section
- Card-based layout with each analysis
- Green/yellow/red indicators for optimization opportunities
- "Learn More" tooltips for complex topics

---

## Deployment Order

1. **Module 1.1** - 401k optimization (simplest, no new data needed)
2. **Module 2.1** - Marginal vs effective rate (data already in taxCalculation)
3. **Module 1.2** - Backdoor Roth (new logic, but straightforward)
4. **Module 3.1** - Itemized vs standard (existing data)
5. **Module 1.3/1.4** - Mega backdoor / HSA
6. **Module 2.2/3.2** - Capital gains / estimated tax
7. **Module 4** - UI polish

---

## Technical Notes

- Add new function in `lib/engine/calculations/tax-planning.ts`
- Reuse existing taxCalculation data where possible
- Some modules may need additional inputs collected in wizard
- Keep calculations simple - this is educational, not tax advice (disclaimer needed)
