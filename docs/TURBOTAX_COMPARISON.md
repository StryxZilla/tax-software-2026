# TurboTax vs Our Tax Software - Feature Comparison Report

**Date:** March 16, 2026  
**Focus:** Tax Year 2025/2026 Features

---

## 1. Executive Summary

Our tax software is a capable **core tax calculation engine** with strong foundations in:
- OCR-based document extraction (W-2, 1099-INT, 1099-DIV)
- Comprehensive tax calculations (35+ calculation functions covering federal taxes)
- PDF generation for filing
- Form validation
- Tax planning features

However, compared to TurboTax (the market leader), we're missing several **consumer-facing features** that make tax software usable by the general public. TurboTax's strength isn't just calculations—it's the **user experience, import options, filing infrastructure, and support ecosystem**.

This report identifies gaps and prioritizes recommendations for MVP vs full product.

---

## 2. Features We Have ✅

### Core Tax Calculations
| Feature | Status | Notes |
|---------|--------|-------|
| W-2 income handling | ✅ | Full extraction via OCR + manual entry |
| 1099-INT (interest) | ✅ | OCR extraction + form |
| 1099-DIV (dividends) | ✅ | OCR extraction + form |
| Capital gains calculations | ✅ | Short-term + long-term |
| Self-employment income | ✅ | Schedule C support |
| Rental property income | ✅ | Full support |
| Standard deduction | ✅ | Based on filing status |
| Itemized deductions | ✅ | State taxes, property tax, charity, etc. |
| AMT (Alternative Minimum Tax) | ✅ | Implemented |
| QBI (Qualified Business Income) | ✅ | Full deduction calculation |
| Child Tax Credit | ✅ | With phase-out logic |
| Education credits | ✅ | AOTC + LLC |
| EITC (Earned Income Tax Credit) | ✅ | Full calculation |
| Child & Dependent Care Credit | ✅ | Implemented |
| Electric Vehicle Credit | ✅ | New & used vehicles |
| Residential Energy Credit | ✅ | Solar, heat pumps, etc. |
| Saver's Credit | ✅ | Retirement contributions |

### Document Processing
| Feature | Status | Notes |
|---------|--------|-------|
| W-2 OCR extraction | ✅ | Image/PDF upload with AI extraction |
| 1099-INT OCR | ✅ | |
| 1099-DIV OCR | ✅ | |
| PDF generation | ✅ | Filing-ready PDFs |
| Form validation | ✅ | 28K+ lines of validation logic |

### User Experience
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-step wizard | ✅ | Guided filing process |
| Real-time calculations | ✅ | Calculates as you enter data |
| Tax planning | ✅ | Projection features |

### Infrastructure
| Feature | Status | Notes |
|---------|--------|-------|
| User authentication | ✅ | NextAuth + registration |
| Data persistence | ✅ | Prisma + database |
| Rate limiting | ✅ | Security measures |

---

## 3. Features Missing (Prioritized by Importance)

### Tier 1: Critical for MVP (Must Have)

| Feature | Priority | Why It Matters |
|---------|----------|----------------|
| **State Filing** | P0 | Can't file without state returns. Users need to file in their state. |
| **E-Filing** | P0 | Paper filing is last-century. TurboTax boasts "fastest refunds" via e-file. |
| **Real-Time Guidance** | P1 | TurboTax's "interview mode" walks users through questions. We have forms but no conversational guidance. |

### Tier 2: Essential for V1 (Should Have)

| Feature | Priority | Why It Matters |
|---------|----------|----------------|
| **Bank/Brokerage Import** | P2 | Major convenience. TurboTax uses Plaid for instant import. We only have manual entry + OCR. |
| **Audit Risk Detection** | P2 | TurboTax has "Audit Risk Meter" - warns about red flags. We have validation but no risk analysis. |
| **Prior Year Import** | P2 | Importing last year's return saves massive time. TurboTax does this automatically. |

### Tier 3: Full Product Features (Nice to Have)

| Feature | Priority | Why It Matters |
|---------|----------|----------------|
| **Mobile App** | P3 | TurboTax mobile is hugely popular. ~40% of filers use mobile. |
| **Phone/Chat Support** | P3 | Critical for user trust. TurboTax offers U.S.-based support. |
| **Pricing Tiers** | P3 | TurboTax has Free, Deluxe, Premier, Home & Business. We have one product. |
| **Maximum Refund Guarantee** | P3 | Marketing guarantee that builds trust. |
| **Accuracy Guarantee** | P3 | Pays penalties/interest if their calc is wrong. |
| **Audit Support** | P3 | Post-filing support if audited. |

---

## 4. Detailed Feature Gap Analysis

### Import Options

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| Bank connection (Plaid) | ✅ | ❌ | Major - manual entry only |
| Brokerage import | ✅ | ❌ | Via OCR only, not automated |
| Employer import | ✅ (W-2 upload) | ✅ (OCR) | Parity - both have W-2 upload |
| Prior year import | ✅ | ❌ | Missing |
| Document photo import | ✅ | ✅ | Parity - we have OCR |

### Filing Options

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| E-file federal | ✅ | ❌ | Critical missing |
| E-file state | ✅ | ❌ | Critical missing |
| Print & mail | ✅ | ✅ | We generate PDFs |
| Amendment support | ✅ | ❌ | Not implemented |
| Refund anticipation loan | ✅ | ❌ | Out of scope |

### State Filing

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| All 50 states | ✅ | ❌ | Not implemented |
| State calculation | Partial | Only deduction | Only tracks state tax as deduction |
| State e-file | ✅ | ❌ | Missing |

### Calculations & Guidance

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| Real-time calc | ✅ | ✅ | Parity |
| Interview/guidance | ✅ | ❌ | No conversational UI |
| Error detection | ✅ | ✅ | Form validation exists |
| Audit warnings | ✅ | ❌ | No risk meter |
| Deduction search | 375+ credits | ~15 major ones | We have core, missing niche |

### Support

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| Phone support | ✅ | ❌ | Missing |
| Chat support | ✅ | ❌ | Missing |
| Audit support | ✅ | ❌ | Missing |
| U.S.-based | ✅ | N/A | - |

### Mobile

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| iOS app | ✅ | ❌ | Not implemented |
| Android app | ✅ | ❌ | Not implemented |
| Mobile-friendly web | ✅ | Not tested | Unknown |

### Pricing & Guarantees

| Feature | TurboTax | Our Software | Gap |
|---------|----------|-------------|-----|
| Free tier | ✅ (simple returns) | ❌ | No free product |
| Paid tiers | ✅ (4 levels) | ❌ | Single product |
| Refund guarantee | ✅ | ❌ | Missing |
| Accuracy guarantee | ✅ | ❌ | Missing |
| Audit defense | ✅ (paid add-on) | ❌ | Missing |

---

## 5. Recommendations

### MVP (Minimum Viable Product)

For an initial launch that can actually file taxes:

1. **State Filing Engine** (P0)
   - Implement 50-state tax calculation
   - Start with most common states (TX, FL, CA, NY, IL)
   
2. **E-Filing Integration** (P0)
   - Partner with e-file provider (IRS Modernized e-File or third-party)
   - Submit federal + state electronically
   
3. **Enhanced Guidance** (P1)
   - Add "interview" flow for common situations
   -提示用户可能遗漏的扣除额

### Full Product

For a competitive alternative to TurboTax:

4. **Plaid Integration** - Bank/brokerage import
5. **Audit Risk Meter** - Analyze return for audit triggers
6. **Prior Year Import** - Carryforward from competitor formats
7. **Mobile App** - React Native or Expo
8. **Support Infrastructure** - Chat/phone escalation
9. **Guarantees** - Accuracy + refund + audit support
10. **Pricing Tiers** - Free (simple), Deluxe, Premier

---

## 6. Technical Implementation Notes

### E-File Options
- **IRS Modernized e-File (MeF)** - Direct integration, complex
- **Third-party provider** - TaxSlayer API, Drake API (easier to start)
- Start with print-to-PDF + third-party e-file API for speed

### State Filing Approach
- **Full calculation** vs **transit** (calculate federal, pass to state)
- Most software does full calculation per state
- Can license state modules from providers like TaxSlayer/TaxAct

### Plaid Integration
- Relatively straightforward API
- Need to handle OAuth flow
- Store encrypted access tokens

---

*Report generated for feature planning purposes.*
