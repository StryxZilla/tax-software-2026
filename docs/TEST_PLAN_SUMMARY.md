# Tax Summary Sidebar Test Plan

This document outlines the comprehensive test plan for the Tax Summary Sidebar features (Phases 1-3).

## Overview

| Phase | Features | Status |
|-------|----------|--------|
| Phase 1 | Progress header, Warning banners (AMT, EITC, Additional Medicare Tax), QBI display, Additional Medicare Tax display | ✅ Implemented |
| Phase 2 | Expandable/collapsible cards (Tax Breakdown, Deductions, Credits), Tax Planning Insights | ✅ Implemented |
| Phase 3 | What-if scenario sliders (401k, Roth comparison) | ✅ Implemented |

---

## Table of Contents

1. [Unit Test Cases](#1-unit-test-cases)
2. [Integration Test Scenarios](#2-integration-test-scenarios)
3. [Edge Cases](#3-edge-cases)
4. [Test Data Requirements](#4-test-data-requirements)
5. [Test Environment Setup](#5-test-environment-setup)

---

## 1. Unit Test Cases

### 1.1 Completion Percentage Calculation

| Test ID | Component | Test Description | Expected Result |
|---------|-----------|------------------|-----------------|
| CP-001 | TaxSummarySidebar | All required fields filled (Single filer) | 100% completion |
| CP-002 | TaxSummarySidebar | No fields filled | 0% completion |
| CP-003 | TaxSummarySidebar | Partial fields filled (firstName, lastName) | 50% (2/4 required) |
| CP-004 | TaxSummarySidebar | W2 income present with wages > 0 | +25% for W2 |
| CP-005 | TaxSummarySidebar | Married Filing Jointly with spouse info | Includes spouse count |
| CP-006 | TaxSummarySidebar | Married Filing Separately without spouse | No spouse penalty |
| CP-007 | TaxSummarySidebar | W2 present but wages = 0 | No W2 count |

#### Test Code Reference
```typescript
// Source: TaxSummarySidebar.tsx - completionPercentage useMemo
const completionPercentage = useMemo(() => {
  let filled = 0;
  let total = 4; // Personal Info (4 fields)
  
  if (taxReturn.personalInfo.firstName) filled++;
  if (taxReturn.personalInfo.lastName) filled++;
  if (taxReturn.personalInfo.ssn) filled++;
  if (taxReturn.personalInfo.filingStatus) filled++;

  // W-2 Income
  if (taxReturn.w2Income.length > 0 && taxReturn.w2Income.some(w2 => w2.wages > 0)) {
    filled++;
  }
  total++;

  // Spouse info for married filing
  if (isMarriedFiling) {
    total++;
    if (taxReturn.personalInfo.spouseInfo?.firstName) filled++;
  }

  return Math.round((filled / total) * 100);
}, [taxReturn]);
```

### 1.2 Warning Display Logic

| Test ID | Component | Test Condition | Expected Result |
|---------|-----------|-----------------|-----------------|
| WD-001 | TaxSummarySidebar | AMT > 0 | AMT warning banner displays |
| WD-002 | TaxSummarySidebar | AMT = 0 | AMT warning hidden |
| WD-003 | TaxSummarySidebar | additionalMedicareTax > 0 | Medicare warning displays |
| WD-004 | TaxSummarySidebar | additionalMedicareTax = 0 | Medicare warning hidden |
| WD-005 | TaxSummarySidebar | EITC eligible (AGI in range, has dependents) | EITC warning displays |
| WD-006 | TaxSummarySidebar | EITC not eligible (no dependents) | EITC warning hidden |
| WD-007 | TaxSummarySidebar | All warnings active | All 3 banners display |
| WD-008 | TaxSummarySidebar | No warnings | No warning banners |

#### Warning Logic Reference
```typescript
// Source: TaxSummarySidebar.tsx - warnings useMemo
const warnings = useMemo(() => {
  const msgs = [];
  
  // AMT Warning
  if (hasAMT) {
    msgs.push({ type: 'amt', message: '...', details: '...' });
  }

  // Additional Medicare Tax
  if ((taxCalculation?.additionalMedicareTax ?? 0) > 0) {
    msgs.push({ type: 'medicare', message: '...', details: '...' });
  }

  // EITC Warning
  if (eitcEligible) {
    msgs.push({ type: 'eitc', message: '...', details: '...' });
  }

  return msgs;
}, [hasAMT, taxCalculation, eitcEligible]);
```

### 1.3 QBI and Medicare Tax Display

| Test ID | Component | Test Condition | Expected Result |
|---------|-----------|----------------|-----------------|
| QBI-001 | TaxSummarySidebar | qbiDeduction > 0 | QBI card displays with amount |
| QBI-002 | TaxSummarySidebar | qbiDeduction = 0 | QBI card hidden |
| QBI-003 | TaxSummarySidebar | qbiDeduction = null/undefined | QBI card hidden |
| MED-001 | TaxSummarySidebar | additionalMedicareTax > 0 | Medicare card displays with amount |
| MED-002 | TaxSummarySidebar | additionalMedicareTax = 0 | Medicare card hidden |
| MED-003 | TaxSummarySidebar | additionalMedicareTax = null/undefined | Medicare card hidden |

#### Display Logic Reference
```typescript
// QBI Display
{(taxCalculation.qbiDeduction ?? 0) > 0 && (
  <div className="qbi-card">
    <div className="text-xs font-semibold text-slate-500 uppercase">QBI Deduction</div>
    <div className="text-2xl font-bold text-green-600">
      ${taxCalculation.qbiDeduction.toLocaleString()}
    </div>
  </div>
)}

// Additional Medicare Tax Display
{(taxCalculation.additionalMedicareTax ?? 0) > 0 && (
  <div className="medicare-card">
    <div className="text-xs font-semibold text-orange-600 uppercase">Additional Medicare Tax</div>
    <div className="text-2xl font-bold text-orange-600">
      ${taxCalculation.additionalMedicareTax.toLocaleString()}
    </div>
  </div>
)}
```

### 1.4 Expandable Card Toggle Behavior

| Test ID | Component | Test Description | Expected Result |
|---------|-----------|------------------|-----------------|
| EC-001 | TaxSummarySidebar | Click Tax Breakdown header | Card expands/collapses |
| EC-002 | TaxSummarySidebar | Click Deductions header | Card expands/collapses |
| EC-003 | TaxSummarySidebar | Click Insights header | Card expands/collapses |
| EC-004 | TaxSummarySidebar | Initial state - Insights | Default expanded (true) |
| EC-005 | TaxSummarySidebar | Collapse then refresh | State persists in localStorage |
| EC-006 | TaxSummarySidebar | Mobile view - default collapsed | Defaults to collapsed on mobile |

#### State Management Reference
```typescript
// Source: TaxSummarySidebar.tsx
const [isTaxBreakdownExpanded, setIsTaxBreakdownExpanded] = useState(false);
const [isDeductionsExpanded, setIsDeductionsExpanded] = useState(false);
const [isInsightsExpanded, setIsInsightsExpanded] = useState(true); // Default expanded

// Desktop sidebar collapsed state
const [isCollapsed, setIsCollapsed] = useState(() => {
  const saved = localStorage.getItem('sidebarCollapsed');
  if (saved !== null) return JSON.parse(saved);
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return true;
  return false;
});
```

### 1.5 What-If Slider Calculations

| Test ID | Component | Test Description | Expected Result |
|---------|-----------|------------------|-----------------|
| WI-001 | TaxSummarySidebar | 401k slider at $0 | Tax savings = 0 |
| WI-002 | TaxSummarySidebar | 401k slider at $23,500 (max) | Tax savings calculated correctly |
| WI-003 | TaxSummarySidebar | 401k slider - reset button | Returns to current contribution |
| WI-004 | TaxSummarySidebar | IRA slider at $7,000 | Tax savings = $7,000 × marginal rate |
| WI-005 | TaxSummarySidebar | IRA slider - show explanation text | Roth vs Traditional text displays |
| WI-006 | TaxSummarySidebar | Self-employed - estimated tax slider | Amount owed updates correctly |
| WI-007 | TaxSummarySidebar | Non self-employed - no est. tax slider | Slider hidden |
| WI-008 | TaxSummarySidebar | Effective rate display updates | Rate shows before → after |

#### Calculation Reference
```typescript
// Source: TaxSummarySidebar.tsx
const calculate401kImpact = useCallback((additionalContribution: number) => {
  const currentTaxable = taxCalculation.taxableIncome;
  const newTaxable = Math.max(0, currentTaxable - additionalContribution);
  
  const marginalRate = taxCalculation.taxableIncome > 0 
    ? taxCalculation.totalTax / taxCalculation.taxableIncome 
    : 0.22;
  
  const taxSavings = additionalContribution * marginalRate;
  const netCost = additionalContribution - taxSavings;
  
  return {
    taxSavings,
    newTaxableIncome: newTaxable,
    newTotalTax: taxCalculation.totalTax - taxSavings,
    newEffectiveRate: newTaxable > 0 ? ((taxCalculation.totalTax - taxSavings) / newTaxable) * 100 : 0,
    netCost,
  };
}, [taxCalculation]);
```

### 1.6 Tax Planning Insights

| Test ID | Component | Test Description | Expected Result |
|---------|-----------|------------------|-----------------|
| TP-001 | TaxSummarySidebar | No tax calculation | Insights section hidden |
| TP-002 | TaxSummarySidebar | Has 401k data | Shows 401k optimization |
| TP-003 | TaxSummarySidebar | 401k at 0% | "Not contributing" recommendation |
| TP-004 | TaxSummarySidebar | 401k at 50% | Halfway recommendation |
| TP-005 | TaxSummarySidebar | 401k at 100% | Maxing out recommendation |
| TP-006 | TaxSummarySidebar | AGI below Roth limit | Shows direct Roth eligibility |
| TP-007 | TaxSummarySidebar | AGI in phase-out range | Shows partial contribution limit |
| TP-008 | TaxSummarySidebar | AGI above limit | Shows backdoor Roth recommendation |

---

## 2. Integration Test Scenarios

### 2.1 Full Tax Return Flow

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| IT-001 | Single filer complete return | Enter all personal info → Add W2 ($75k) → Calculate | Completion: 100%, shows summary |
| IT-002 | Married filing jointly | Enter both names → Add two W2s → Add dependents | Completion calculates with spouse |
| IT-003 | Self-employment | Add Schedule C with income → Calculate | Shows SE tax, QBI, estimated tax slider |
| IT-004 | AMT triggered | Enter high deductions → Calculate | AMT warning displays |
| IT-005 | EITC eligible | Add dependent → Low income → Calculate | EITC warning and potential credit |

### 2.2 State Persistence

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| IT-006 | Sidebar collapse persists | Collapse sidebar → Refresh page | Collapsed state maintained |
| IT-007 | Card states persist | Expand all cards → Refresh | All expanded states maintained |
| IT-008 | What-if scenarios persist | Adjust sliders → Navigate away → Return | Sliders reset on new session |

### 2.3 Responsive Behavior

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| IT-009 | Mobile default | Open on <1024px viewport | Sidebar collapsed by default |
| IT-010 | Desktop default | Open on >=1024px viewport | Sidebar visible |
| IT-011 | Breakpoint transition | Resize from mobile to desktop | Layout adapts smoothly |

---

## 3. Edge Cases

### 3.1 Data Edge Cases

| Test ID | Edge Case | Expected Behavior |
|---------|-----------|-------------------|
| E-001 | All income fields = 0 | Shows $0 income, no errors |
| E-002 | Negative taxable income | Shows $0 taxable, handles gracefully |
| E-003 | Extremely high income ($10M+) | Calculations handle bigint overflow |
| E-004 | Missing taxCalculation | Shows "Fill out your tax information" |
| E-005 | Null/undefined values in fields | Uses fallback ?? 0 or ?? '' |
| E-006 | Empty arrays (w2Income: []) | Handles as no income |
| E-007 |Filing status changed mid-session | Recalculates completion correctly |

### 3.2 Calculation Edge Cases

| Test ID | Edge Case | Expected Behavior |
|---------|-----------|-------------------|
| E-008 | Taxable income = 0 | Effective rate = 0%, no bracket breakdown |
| E-009 | Total tax = 0 | Shows $0 refund/owed, no errors |
| E-010 | Refund = 0 | Shows "Amount Owed: $0" |
| E-011 | Amount Owed = 0 | Shows "Refund: $0" |
| E-012 | 401k contribution > limit | Slider max capped at limit |
| E-013 | Zero marginal rate calculation | Uses fallback 0.22 rate |

### 3.3 UI/UX Edge Cases

| Test ID | Edge Case | Expected Behavior |
|---------|-----------|-------------------|
| E-014 | Very long employer name | Truncates with ellipsis |
| E-015 | Many income sources | Pie chart handles 5+ slices |
| E-016 | Deep bracket nesting | Bar chart shows all brackets |
| E-017 | Rapid slider movement | No lag/jank in calculations |
| E-018 | Multiple warnings stack | All warnings visible, scrollable |

---

## 4. Test Data Requirements

### 4.1 Mock Tax Returns

#### Mock 1: Single Filer - Basic
```typescript
const mockTaxReturn1: TaxReturn = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    ssn: '123-45-6789',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    filingStatus: 'Single',
    age: 35,
    isBlind: false
  },
  dependents: [],
  w2Income: [{
    employer: 'Acme Corp',
    ein: '12-3456789',
    wages: 75000,
    federalTaxWithheld: 12000,
    socialSecurityWages: 75000,
    socialSecurityTaxWithheld: 4650,
    medicareWages: 75000,
    medicareTaxWithheld: 1087.50
  }],
  interest: [],
  dividends: [],
  capitalGains: [],
  aboveTheLineDeductions: {
    educatorExpenses: 0,
    studentLoanInterest: 0,
    hsaContributions: 0,
    movingExpenses: 0,
    selfEmploymentTaxDeduction: 0,
    selfEmployedHealthInsurance: 0,
    sepIRA: 0,
    alimonyPaid: 0
  },
  educationExpenses: [],
  estimatedTaxPayments: 0
};
```

#### Mock 2: Married Filing Jointly - With Dependents
```typescript
const mockTaxReturn2: TaxReturn = {
  personalInfo: {
    firstName: 'Jane',
    lastName: 'Smith',
    ssn: '987-65-4321',
    address: '456 Oak Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    filingStatus: 'Married Filing Jointly',
    age: 38,
    isBlind: false,
    spouseInfo: {
      firstName: 'Bob',
      lastName: 'Smith',
      ssn: '987-65-4322',
      age: 40,
      isBlind: false
    }
  },
  dependents: [{
    firstName: 'Timmy',
    lastName: 'Smith',
    ssn: '123-45-0001',
    relationshipToTaxpayer: 'Son',
    birthDate: '2018-05-15',
    isQualifyingChildForCTC: true,
    monthsLivedWithTaxpayer: 12
  }],
  w2Income: [
    {
      employer: 'Tech Inc',
      ein: '98-7654321',
      wages: 95000,
      federalTaxWithheld: 15000,
      socialSecurityWages: 95000,
      socialSecurityTaxWithheld: 5890,
      medicareWages: 95000,
      medicareTaxWithheld: 1377.50
    },
    {
      employer: 'Medical Center',
      ein: '11-2233445',
      wages: 72000,
      federalTaxWithheld: 10000,
      socialSecurityWages: 72000,
      socialSecurityTaxWithheld: 4464,
      medicareWages: 72000,
      medicareTaxWithheld: 1044
    }
  ],
  interest: [],
  dividends: [],
  capitalGains: [],
  aboveTheLineDeductions: {
    educatorExpenses: 250,
    studentLoanInterest: 0,
    hsaContributions: 0,
    movingExpenses: 0,
    selfEmploymentTaxDeduction: 0,
    selfEmployedHealthInsurance: 0,
    sepIRA: 0,
    alimonyPaid: 0
  },
  educationExpenses: [],
  estimatedTaxPayments: 5000
};
```

#### Mock 3: Self-Employed with High Income
```typescript
const mockTaxReturn3: TaxReturn = {
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Entrepreneur',
    ssn: '555-12-3456',
    address: '789 Business Blvd',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    filingStatus: 'Single',
    age: 42,
    isBlind: false
  },
  dependents: [],
  w2Income: [],
  interest: [],
  dividends: [],
  capitalGains: [],
  selfEmployment: {
    businessName: 'Consulting Co',
    ein: '55-1234567',
    businessCode: '541600',
    grossReceipts: 150000,
    returns: 5000,
    costOfGoodsSold: 10000,
    expenses: {
      advertising: 2000,
      carAndTruck: 5000,
      commissions: 0,
      contractLabor: 10000,
      depletion: 0,
      depreciation: 5000,
      employeeBenefitPrograms: 0,
      insurance: 3000,
      interest: 0,
      legal: 1500,
      officeExpense: 2000,
      pension: 0,
      rentLease: 12000,
      repairs: 1000,
      supplies: 3000,
      taxes: 2000,
      travel: 5000,
      mealsAndEntertainment: 1000,
      utilities: 4000,
      wages: 0,
      other: 2000
    }
  },
  aboveTheLineDeductions: {
    educatorExpenses: 0,
    studentLoanInterest: 0,
    hsaContributions: 0,
    movingExpenses: 0,
    selfEmploymentTaxDeduction: 0,
    selfEmployedHealthInsurance: 0,
    sepIRA: 0,
    alimonyPaid: 0
  },
  educationExpenses: [],
  estimatedTaxPayments: 20000
};
```

### 4.2 Mock Tax Calculations

#### Mock Calculation 1: Basic Single
```typescript
const mockTaxCalc1: TaxCalculation = {
  totalIncome: 75000,
  adjustments: 0,
  agi: 75000,
  standardOrItemizedDeduction: 14600,
  qbiDeduction: 0,
  taxableIncome: 60400,
  regularTax: 8644,
  amt: 0,
  totalTaxBeforeCredits: 8644,
  totalCredits: 0,
  totalTaxAfterCredits: 8644,
  selfEmploymentTax: 0,
  additionalMedicareTax: 0,
  totalTax: 8644,
  federalTaxWithheld: 12000,
  estimatedTaxPayments: 0,
  refundOrAmountOwed: 3356
};
```

#### Mock Calculation 2: With AMT
```typescript
const mockTaxCalc2: TaxCalculation = {
  totalIncome: 350000,
  adjustments: 0,
  agi: 350000,
  standardOrItemizedDeduction: 29200,
  qbiDeduction: 25000,
  taxableIncome: 295800,
  regularTax: 68500,
  amt: 12500,
  totalTaxBeforeCredits: 81000,
  totalCredits: 0,
  totalTaxAfterCredits: 81000,
  selfEmploymentTax: 0,
  additionalMedicareTax: 0,
  totalTax: 81000,
  federalTaxWithheld: 75000,
  estimatedTaxPayments: 0,
  refundOrAmountOwed: -6000 // Owe
};
```

#### Mock Calculation 3: With Additional Medicare Tax
```typescript
const mockTaxCalc3: TaxCalculation = {
  totalIncome: 250000,
  adjustments: 0,
  agi: 250000,
  standardOrItemizedDeduction: 14600,
  qbiDeduction: 0,
  taxableIncome: 235400,
  regularTax: 52416,
  amt: 0,
  totalTaxBeforeCredits: 52416,
  totalCredits: 0,
  totalTaxAfterCredits: 52416,
  selfEmploymentTax: 0,
  additionalMedicareTax: 900, // 0.9% on $100k over $200k threshold
  totalTax: 53316,
  federalTaxWithheld: 45000,
  estimatedTaxPayments: 0,
  refundOrAmountOwed: -8316
};
```

#### Mock Calculation 4: With EITC
```typescript
const mockTaxCalc4: TaxCalculation = {
  totalIncome: 28000,
  adjustments: 0,
  agi: 28000,
  standardOrItemizedDeduction: 14600,
  qbiDeduction: 0,
  taxableIncome: 13400,
  regularTax: 1342,
  amt: 0,
  totalTaxBeforeCredits: 1342,
  totalCredits: 3500, // EITC
  totalTaxAfterCredits: 0, // Fully offset
  selfEmploymentTax: 0,
  additionalMedicareTax: 0,
  totalTax: 0,
  federalTaxWithheld: 1500,
  estimatedTaxPayments: 0,
  refundOrAmountOwed: 1500
};
```

### 4.3 Test Scenarios Matrix

| Scenario | Filing Status | Income | Dependents | Special Flags |
|----------|---------------|--------|------------|---------------|
| S1 | Single | $75k W2 | 0 | None |
| S2 | Single | $150k SE | 0 | QBI, SE Tax |
| S3 | Single | $250k W2 | 0 | Add'l Medicare |
| S4 | Single | $350k W2 | 0 | AMT |
| S5 | MFJ | $167k (2 W2s) | 1 | EITC |
| S6 | MFJ | $200k W2s | 2 | Child Tax Credit |
| S7 | MFS | $75k W2 | 0 | None |
| S8 | HoH | $45k W2 | 2 | EITC |
| S9 | Single | $0 | 0 | No income |
| S10 | Single | $10M+ | 0 | High income |

---

## 5. Test Environment Setup

### 5.1 Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

### 5.2 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!*.d.ts'
  ]
};
```

### 5.3 Testing Utilities

```typescript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});
```

---

## Test Execution Checklist

- [ ] Unit tests for all useMemo/useCallback functions
- [ ] Integration tests for complete user flows
- [ ] Edge case validation
- [ ] Responsive/mobile testing
- [ ] State persistence verification
- [ ] Performance testing (slider responsiveness)
- [ ] Accessibility testing (keyboard navigation)
- [ ] Cross-browser verification

---

## Notes

- All monetary values should be tested with various precision levels
- Tax calculations should be verified against actual 2025 tax brackets
- What-if scenarios should use realistic marginal rate calculations
- UI components should be tested at all standard viewport sizes (320px, 768px, 1024px, 1440px)
