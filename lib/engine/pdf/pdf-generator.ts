/**
 * PDF Generation for Tax Forms - 2025 Tax Year
 * 
 * This module generates IRS tax forms as PDFs using pdf-lib.
 * Since we don't have fillable IRS PDFs, we create clean, text-based
 * representations of the forms that match the official layout.
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { TaxReturn, TaxCalculation, W2Income, EducationExpenses, HSAData } from '../../../types/tax-types';
import { calculateTaxReturn } from '../calculations/tax-calculator';

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency for display (e.g., 12345.67 -> "$12,345.67")
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format SSN for display (e.g., "123456789" -> "123-45-6789")
 */
function formatSSN(ssn: string): string {
  if (ssn.length !== 9) return ssn;
  return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
}

/**
 * Format date for display (e.g., "2025-01-15" -> "01/15/2025")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Create a new page with header and basic layout
 */
async function createFormPage(pdfDoc: PDFDocument, formNumber: string, formTitle: string) {
  const page = pdfDoc.addPage([612, 792]); // 8.5" x 11" in points
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Form header
  page.drawText(formNumber, {
    x: 50,
    y: height - 50,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(formTitle, {
    x: 50,
    y: height - 70,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Department of the Treasury - Internal Revenue Service', {
    x: 50,
    y: height - 85,
    size: 8,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('2025', {
    x: width - 80,
    y: height - 50,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Disclaimer
  page.drawText('FOR INFORMATIONAL PURPOSES ONLY - VERIFY ALL DATA BEFORE FILING', {
    x: 50,
    y: 30,
    size: 8,
    font: font,
    color: rgb(0.5, 0, 0),
  });

  return { page, font, boldFont };
}

// ===== FORM 1040 =====

/**
 * Generate Form 1040 (U.S. Individual Income Tax Return)
 */
export async function generateForm1040(taxReturn: TaxReturn): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Form 1040', 'U.S. Individual Income Tax Return');
  const { width, height } = page.getSize();
  
  const calc = taxReturn.taxCalculation || calculateTaxReturn(taxReturn);
  let yPos = height - 120;

  // Personal Information
  page.drawText('Personal Information', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  const { personalInfo } = taxReturn;
  page.drawText(`Name: ${personalInfo.firstName} ${personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText(`SSN: ${formatSSN(personalInfo.ssn)}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText(`Address: ${personalInfo.address}, ${personalInfo.city}, ${personalInfo.state} ${personalInfo.zipCode}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText(`Filing Status: ${personalInfo.filingStatus}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 30;

  // Spouse info if married filing jointly
  if (personalInfo.spouseInfo) {
    page.drawText(`Spouse: ${personalInfo.spouseInfo.firstName} ${personalInfo.spouseInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText(`Spouse SSN: ${formatSSN(personalInfo.spouseInfo.ssn)}`, { x: 50, y: yPos, size: 10, font });
    yPos -= 30;
  }

  // Dependents
  if (taxReturn.dependents.length > 0) {
    page.drawText('Dependents', { x: 50, y: yPos, size: 12, font: boldFont });
    yPos -= 20;
    taxReturn.dependents.forEach((dep, idx) => {
      page.drawText(`${idx + 1}. ${dep.firstName} ${dep.lastName} - SSN: ${formatSSN(dep.ssn)} - ${dep.relationshipToTaxpayer}`, { x: 50, y: yPos, size: 9, font });
      yPos -= 15;
    });
    yPos -= 15;
  }

  // Income Section
  page.drawText('Income', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText(`1. Total Income`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.totalIncome), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`2. Adjustments to Income`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.adjustments), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`3. Adjusted Gross Income (AGI)`, { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.agi), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Deductions
  page.drawText('Deductions and Taxable Income', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText(`4. Standard/Itemized Deduction`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.standardOrItemizedDeduction), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`5. QBI Deduction`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.qbiDeduction), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`6. Taxable Income`, { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.taxableIncome), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Tax Calculation
  page.drawText('Tax Calculation', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText(`7. Regular Tax`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.regularTax), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  if (calc.amt > 0) {
    page.drawText(`8. Alternative Minimum Tax (AMT)`, { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.amt), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  page.drawText(`9. Total Tax Before Credits`, { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.totalTaxBeforeCredits), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 15;

  page.drawText(`10. Total Credits`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.totalCredits), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`11. Tax After Credits`, { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.totalTaxAfterCredits), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Other Taxes
  page.drawText('Other Taxes', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  if (calc.selfEmploymentTax > 0) {
    page.drawText(`12. Self-Employment Tax`, { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.selfEmploymentTax), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  if (calc.additionalMedicareTax > 0) {
    page.drawText(`13. Additional Medicare Tax`, { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.additionalMedicareTax), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  page.drawText(`14. Total Tax`, { x: 50, y: yPos, size: 12, font: boldFont });
  page.drawText(formatCurrency(calc.totalTax), { x: 450, y: yPos, size: 12, font: boldFont });
  yPos -= 30;

  // Payments
  page.drawText('Payments', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText(`15. Federal Tax Withheld`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.federalTaxWithheld), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`16. Estimated Tax Payments`, { x: 50, y: yPos, size: 10, font });
  page.drawText(formatCurrency(calc.estimatedTaxPayments), { x: 450, y: yPos, size: 10, font });
  yPos -= 15;

  page.drawText(`17. Total Payments`, { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.federalTaxWithheld + calc.estimatedTaxPayments), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Refund or Amount Owed
  page.drawText('Refund or Amount You Owe', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  if (calc.refundOrAmountOwed > 0) {
    page.drawText(`18. REFUND`, { x: 50, y: yPos, size: 12, font: boldFont, color: rgb(0, 0.5, 0) });
    page.drawText(formatCurrency(calc.refundOrAmountOwed), { x: 450, y: yPos, size: 12, font: boldFont, color: rgb(0, 0.5, 0) });
  } else {
    page.drawText(`18. AMOUNT YOU OWE`, { x: 50, y: yPos, size: 12, font: boldFont, color: rgb(0.7, 0, 0) });
    page.drawText(formatCurrency(Math.abs(calc.refundOrAmountOwed)), { x: 450, y: yPos, size: 12, font: boldFont, color: rgb(0.7, 0, 0) });
  }

  return pdfDoc.save();
}

// ===== SCHEDULE 1 =====

/**
 * Generate Schedule 1 (Additional Income and Adjustments to Income)
 */
export async function generateSchedule1(taxReturn: TaxReturn): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule 1', 'Additional Income and Adjustments to Income');
  const { height } = page.getSize();
  
  const calc = taxReturn.taxCalculation || calculateTaxReturn(taxReturn);
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Additional Income
  page.drawText('Part I - Additional Income', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  // Taxable refunds
  page.drawText('1. Taxable refunds, credits, or offsets of state and local income taxes', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  // Alimony received
  page.drawText('2. Alimony received', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  // Business income
  if (taxReturn.selfEmployment) {
    page.drawText('3. Business income or loss (Schedule C)', { x: 50, y: yPos, size: 9, font });
    const seProfit = taxReturn.selfEmployment.grossReceipts - taxReturn.selfEmployment.returns - taxReturn.selfEmployment.costOfGoodsSold;
    page.drawText(formatCurrency(seProfit), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // Capital gains
  if (taxReturn.capitalGains.length > 0) {
    page.drawText('7. Capital gain or loss (Schedule D)', { x: 50, y: yPos, size: 9, font });
    const totalGains = taxReturn.capitalGains.reduce((sum, cg) => sum + (cg.proceeds - cg.costBasis), 0);
    page.drawText(formatCurrency(totalGains), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // Rental real estate
  if (taxReturn.rentalProperties.length > 0) {
    page.drawText('5. Rental real estate, royalties, partnerships, S corps, trusts, etc.', { x: 50, y: yPos, size: 9, font });
    const totalRental = taxReturn.rentalProperties.reduce((sum, r) => sum + r.rentalIncome, 0);
    page.drawText(formatCurrency(totalRental), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  yPos -= 20;

  // Part II - Adjustments to Income
  page.drawText('Part II - Adjustments to Income', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  // Educator expenses
  if (taxReturn.aboveTheLineDeductions.educatorExpenses > 0) {
    page.drawText('10. Educator expenses', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(taxReturn.aboveTheLineDeductions.educatorExpenses), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // HSA deduction
  if (taxReturn.hsaData) {
    page.drawText('13. Health savings account deduction', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(taxReturn.hsaData.contributions), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // Self-employment tax deduction
  if (calc.selfEmploymentTax > 0) {
    page.drawText('15. Deductible part of self-employment tax', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(calc.selfEmploymentTax * 0.5), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // IRA deduction
  if (taxReturn.traditionalIRAContribution?.isDeductible) {
    page.drawText('20. IRA deduction', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(taxReturn.traditionalIRAContribution.amount), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // Student loan interest
  if (taxReturn.aboveTheLineDeductions.studentLoanInterest > 0) {
    page.drawText('21. Student loan interest deduction', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(taxReturn.aboveTheLineDeductions.studentLoanInterest), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  yPos -= 15;
  page.drawText('26. Total adjustments', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.adjustments), { x: 450, y: yPos, size: 10, font: boldFont });

  return pdfDoc.save();
}

// ===== SCHEDULE 2 =====

/**
 * Generate Schedule 2 (Additional Taxes)
 */
export async function generateSchedule2(taxReturn: TaxReturn): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule 2', 'Additional Taxes');
  const { height } = page.getSize();
  
  const calc = taxReturn.taxCalculation || calculateTaxReturn(taxReturn);
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Part I - Tax
  page.drawText('Part I - Tax', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  if (calc.amt > 0) {
    page.drawText('1. Alternative minimum tax', { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.amt), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  } else {
    page.drawText('1. Alternative minimum tax', { x: 50, y: yPos, size: 10, font });
    page.drawText('$0.00', { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  yPos -= 20;

  // Part II - Other Taxes
  page.drawText('Part II - Other Taxes', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  if (calc.selfEmploymentTax > 0) {
    page.drawText('4. Self-employment tax (Schedule SE)', { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.selfEmploymentTax), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  if (calc.additionalMedicareTax > 0) {
    page.drawText('8. Additional Medicare Tax', { x: 50, y: yPos, size: 10, font });
    page.drawText(formatCurrency(calc.additionalMedicareTax), { x: 450, y: yPos, size: 10, font });
    yPos -= 15;
  }

  return pdfDoc.save();
}

// ===== SCHEDULE 3 =====

/**
 * Generate Schedule 3 (Additional Credits and Payments)
 */
export async function generateSchedule3(taxReturn: TaxReturn): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule 3', 'Additional Credits and Payments');
  const { height } = page.getSize();
  
  const calc = taxReturn.taxCalculation || calculateTaxReturn(taxReturn);
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Part I - Nonrefundable Credits
  page.drawText('Part I - Nonrefundable Credits', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText('1. Child tax credit and credit for other dependents', { x: 50, y: yPos, size: 9, font });
  const childCredit = taxReturn.dependents.filter(d => d.isQualifyingChildForCTC).length * 2000;
  page.drawText(formatCurrency(childCredit), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  if (taxReturn.educationExpenses.length > 0) {
    page.drawText('3. Education credits', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(0), { x: 450, y: yPos, size: 9, font }); // TODO: Calculate properly
    yPos -= 15;
  }

  yPos -= 15;
  page.drawText('8. Total nonrefundable credits', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(calc.totalCredits), { x: 450, y: yPos, size: 10, font: boldFont });

  return pdfDoc.save();
}

// ===== SCHEDULE A =====

/**
 * Generate Schedule A (Itemized Deductions) - if applicable
 */
export async function generateScheduleA(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (!taxReturn.itemizedDeductions) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule A', 'Itemized Deductions');
  const { height } = page.getSize();
  
  const itemized = taxReturn.itemizedDeductions;
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Medical and Dental
  page.drawText('Medical and Dental Expenses', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  page.drawText('1. Medical and dental expenses', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.medicalExpenses), { x: 450, y: yPos, size: 9, font });
  yPos -= 30;

  // Taxes You Paid
  page.drawText('Taxes You Paid', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  page.drawText('5a. State and local income taxes', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.stateTaxesPaid), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('5b. Real estate taxes', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.realEstateTaxes), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  const saltTotal = Math.min(itemized.stateTaxesPaid + itemized.localTaxesPaid + itemized.realEstateTaxes + itemized.personalPropertyTaxes, 10000);
  page.drawText('5d. Total (limited to $10,000)', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(saltTotal), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 30;

  // Interest You Paid
  page.drawText('Interest You Paid', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  page.drawText('8a. Home mortgage interest', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.homeMortgageInterest), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('9. Investment interest', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.investmentInterest), { x: 450, y: yPos, size: 9, font });
  yPos -= 30;

  // Gifts to Charity
  page.drawText('Gifts to Charity', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  page.drawText('11. Cash contributions', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.charitableCash), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('12. Non-cash contributions', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(itemized.charitableNonCash), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('14. Total charitable contributions', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(itemized.charitableCash + itemized.charitableNonCash), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 30;

  // Total Itemized Deductions
  const total = itemized.medicalExpenses + saltTotal + itemized.homeMortgageInterest + itemized.investmentInterest + 
                itemized.charitableCash + itemized.charitableNonCash + itemized.otherDeductions;
  page.drawText('17. Total itemized deductions', { x: 50, y: yPos, size: 12, font: boldFont });
  page.drawText(formatCurrency(total), { x: 450, y: yPos, size: 12, font: boldFont });

  return pdfDoc.save();
}

// ===== SCHEDULE C =====

/**
 * Generate Schedule C (Profit or Loss from Business) - if self-employed
 */
export async function generateScheduleC(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (!taxReturn.selfEmployment) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule C', 'Profit or Loss From Business');
  const { height } = page.getSize();
  
  const se = taxReturn.selfEmployment;
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 20;
  page.drawText(`Business: ${se.businessName}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 15;
  if (se.ein) {
    page.drawText(`EIN: ${se.ein}`, { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
  }
  page.drawText(`Business Code: ${se.businessCode}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 30;

  // Part I - Income
  page.drawText('Part I - Income', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  page.drawText('1. Gross receipts or sales', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(se.grossReceipts), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('2. Returns and allowances', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(se.returns), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('4. Cost of goods sold', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(se.costOfGoodsSold), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;
  const grossIncome = se.grossReceipts - se.returns - se.costOfGoodsSold;
  page.drawText('7. Gross income', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(grossIncome), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Part II - Expenses
  page.drawText('Part II - Expenses', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;
  
  const expenses = se.expenses;
  const expenseLines: [string, number][] = [
    ['8. Advertising', expenses.advertising],
    ['9. Car and truck expenses', expenses.carAndTruck],
    ['10. Commissions and fees', expenses.commissions],
    ['11. Contract labor', expenses.contractLabor],
    ['13. Depreciation', expenses.depreciation],
    ['14. Employee benefit programs', expenses.employeeBenefitPrograms],
    ['15. Insurance', expenses.insurance],
    ['16a. Interest - Mortgage', expenses.interest],
    ['17. Legal and professional services', expenses.legal],
    ['18. Office expense', expenses.officeExpense],
    ['20a. Rent or lease - Equipment', expenses.rentLease],
    ['21. Repairs and maintenance', expenses.repairs],
    ['22. Supplies', expenses.supplies],
    ['23. Taxes and licenses', expenses.taxes],
    ['24a. Travel', expenses.travel],
    ['24b. Meals', expenses.mealsAndEntertainment],
    ['25. Utilities', expenses.utilities],
    ['26. Wages', expenses.wages],
    ['27a. Other expenses', expenses.other],
  ];

  expenseLines.forEach(([label, amount]: [string, number]) => {
    if (amount > 0) {
      page.drawText(label, { x: 50, y: yPos, size: 8, font });
      page.drawText(formatCurrency(amount), { x: 450, y: yPos, size: 8, font });
      yPos -= 12;
    }
  });

  yPos -= 10;
  const totalExpenses = Object.values(expenses).reduce((sum: number, exp: any) => sum + exp, 0);
  page.drawText('28. Total expenses', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(totalExpenses), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 20;

  const netProfit = grossIncome - totalExpenses;
  page.drawText('31. Net profit or (loss)', { x: 50, y: yPos, size: 12, font: boldFont });
  page.drawText(formatCurrency(netProfit), { x: 450, y: yPos, size: 12, font: boldFont });

  return pdfDoc.save();
}

// ===== SCHEDULE D =====

/**
 * Generate Schedule D (Capital Gains and Losses) - if applicable
 */
export async function generateScheduleD(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (taxReturn.capitalGains.length === 0) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule D', 'Capital Gains and Losses');
  const { height } = page.getSize();
  
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Short-term transactions
  const shortTerm = taxReturn.capitalGains.filter(cg => !cg.isLongTerm);
  if (shortTerm.length > 0) {
    page.drawText('Part I - Short-Term Capital Gains and Losses', { x: 50, y: yPos, size: 12, font: boldFont });
    yPos -= 20;

    shortTerm.forEach((txn, idx) => {
      page.drawText(`${idx + 1}. ${txn.description}`, { x: 50, y: yPos, size: 8, font });
      yPos -= 12;
      page.drawText(`   Acquired: ${formatDate(txn.dateAcquired)}  Sold: ${formatDate(txn.dateSold)}`, { x: 60, y: yPos, size: 7, font });
      yPos -= 10;
      page.drawText(`   Proceeds: ${formatCurrency(txn.proceeds)}  Basis: ${formatCurrency(txn.costBasis)}  Gain/Loss: ${formatCurrency(txn.proceeds - txn.costBasis)}`, { x: 60, y: yPos, size: 7, font });
      yPos -= 15;
    });

    const shortTermTotal = shortTerm.reduce((sum, txn) => sum + (txn.proceeds - txn.costBasis), 0);
    page.drawText('Total short-term gains/losses', { x: 50, y: yPos, size: 9, font: boldFont });
    page.drawText(formatCurrency(shortTermTotal), { x: 450, y: yPos, size: 9, font: boldFont });
    yPos -= 30;
  }

  // Long-term transactions
  const longTerm = taxReturn.capitalGains.filter(cg => cg.isLongTerm);
  if (longTerm.length > 0) {
    page.drawText('Part II - Long-Term Capital Gains and Losses', { x: 50, y: yPos, size: 12, font: boldFont });
    yPos -= 20;

    longTerm.forEach((txn, idx) => {
      page.drawText(`${idx + 1}. ${txn.description}`, { x: 50, y: yPos, size: 8, font });
      yPos -= 12;
      page.drawText(`   Acquired: ${formatDate(txn.dateAcquired)}  Sold: ${formatDate(txn.dateSold)}`, { x: 60, y: yPos, size: 7, font });
      yPos -= 10;
      page.drawText(`   Proceeds: ${formatCurrency(txn.proceeds)}  Basis: ${formatCurrency(txn.costBasis)}  Gain/Loss: ${formatCurrency(txn.proceeds - txn.costBasis)}`, { x: 60, y: yPos, size: 7, font });
      yPos -= 15;
    });

    const longTermTotal = longTerm.reduce((sum, txn) => sum + (txn.proceeds - txn.costBasis), 0);
    page.drawText('Total long-term gains/losses', { x: 50, y: yPos, size: 9, font: boldFont });
    page.drawText(formatCurrency(longTermTotal), { x: 450, y: yPos, size: 9, font: boldFont });
  }

  return pdfDoc.save();
}

// ===== SCHEDULE E =====

/**
 * Generate Schedule E (Supplemental Income and Loss) - if rental properties
 */
export async function generateScheduleE(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (taxReturn.rentalProperties.length === 0) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Schedule E', 'Supplemental Income and Loss');
  const { height } = page.getSize();
  
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  page.drawText('Part I - Income or Loss From Rental Real Estate', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 30;

  taxReturn.rentalProperties.forEach((rental, idx) => {
    page.drawText(`Property ${idx + 1}: ${rental.address}, ${rental.city}, ${rental.state} ${rental.zipCode}`, { x: 50, y: yPos, size: 9, font: boldFont });
    yPos -= 15;
    page.drawText(`Type: ${rental.propertyType}  |  Days rented: ${rental.daysRented}  |  Personal use days: ${rental.daysPersonalUse}`, { x: 50, y: yPos, size: 8, font });
    yPos -= 20;

    page.drawText('Income:', { x: 50, y: yPos, size: 9, font: boldFont });
    yPos -= 12;
    page.drawText(`  3. Rents received: ${formatCurrency(rental.rentalIncome)}`, { x: 50, y: yPos, size: 8, font });
    yPos -= 20;

    page.drawText('Expenses:', { x: 50, y: yPos, size: 9, font: boldFont });
    yPos -= 12;

    const exp = rental.expenses;
    const expenseItems: [string, number][] = [
      ['Advertising', exp.advertising],
      ['Auto and travel', exp.auto],
      ['Cleaning and maintenance', exp.cleaning],
      ['Commissions', exp.commissions],
      ['Insurance', exp.insurance],
      ['Legal and other', exp.legal],
      ['Management fees', exp.management],
      ['Mortgage interest', exp.mortgage],
      ['Repairs', exp.repairs],
      ['Supplies', exp.supplies],
      ['Taxes', exp.taxes],
      ['Utilities', exp.utilities],
      ['Depreciation', exp.depreciation],
      ['Other', exp.other],
    ];

    expenseItems.forEach(([label, amount]: [string, number]) => {
      if (amount > 0) {
        page.drawText(`  ${label}: ${formatCurrency(amount)}`, { x: 50, y: yPos, size: 7, font });
        yPos -= 10;
      }
    });

    const totalExpenses = Object.values(exp).reduce((sum: number, e: any) => sum + e, 0);
    yPos -= 5;
    page.drawText(`  Total expenses: ${formatCurrency(totalExpenses)}`, { x: 50, y: yPos, size: 8, font: boldFont });
    yPos -= 15;

    const netIncome = rental.rentalIncome - totalExpenses;
    page.drawText(`Net rental income (loss): ${formatCurrency(netIncome)}`, { x: 50, y: yPos, size: 9, font: boldFont });
    yPos -= 30;
  });

  const totalRentalIncome = taxReturn.rentalProperties.reduce((sum, r) => {
    const expenses = Object.values(r.expenses).reduce((s: number, e: any) => s + e, 0);
    return sum + (r.rentalIncome - expenses);
  }, 0);

  page.drawText('Total rental real estate income or (loss)', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(totalRentalIncome), { x: 450, y: yPos, size: 10, font: boldFont });

  return pdfDoc.save();
}

// ===== FORM W-2 =====

/**
 * Generate Form W-2 (Wage and Tax Statement) for each employer
 */
export async function generateFormW2(w2Data: W2Income, ssn: string, year: number = 2025): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // 8.5" x 11" in points
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPos = height - 50;

  // Form header
  page.drawText(`Form W-2`, { x: 50, y: yPos, size: 16, font: boldFont });
  page.drawText(`Wage and Tax Statement`, { x: 150, y: yPos, size: 16, font: boldFont });
  yPos -= 25;
  page.drawText(`Tax Year ${year}`, { x: 50, y: yPos, size: 12, font });
  page.drawText(`Department of the Treasury - Internal Revenue Service`, { x: 50, y: yPos - 15, size: 8, font, color: rgb(0.3, 0.3, 0.3) });

  yPos -= 40;

  // Filer information
  page.drawText('Control Number', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatSSN(w2Data.ein.replace('-', '').slice(-7)), { x: 180, y: yPos, size: 10, font });
  yPos -= 20;

  // Box a - Employee's social security number
  page.drawText('a. Employee\'s Social Security Number', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatSSN(ssn), { x: 350, y: yPos, size: 10, font });
  yPos -= 18;

  // Box b - Employer identification number
  page.drawText('b. Employer Identification Number (EIN)', { x: 50, y: yPos, size: 9, font });
  page.drawText(w2Data.ein, { x: 350, y: yPos, size: 10, font });
  yPos -= 18;

  // Box c - Employer's name, address, and ZIP code
  page.drawText('c. Employer\'s name, address, and ZIP code', { x: 50, y: yPos, size: 9, font });
  page.drawText(w2Data.employer, { x: 350, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText('(Address on file with employer)', { x: 350, y: yPos, size: 8, font });
  yPos -= 18;

  // Box d - Employee's name
  page.drawText('d. Employee\'s first name and initial', { x: 50, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('Last name', { x: 50, y: yPos, size: 9, font });
  yPos -= 18;

  // Box e - Employee's address
  page.drawText('e. Employee\'s address and ZIP code', { x: 50, y: yPos, size: 9, font });
  yPos -= 30;

  // Wage and withholding boxes - Row 1
  page.drawText('1. Wages, tips, other compensation', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(w2Data.wages), { x: 400, y: yPos, size: 10, font: boldFont });
  yPos -= 18;

  page.drawText('2. Federal income tax withheld', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(w2Data.federalTaxWithheld), { x: 400, y: yPos, size: 10, font: boldFont });
  yPos -= 18;

  // Box 3 & 4 - Social Security
  page.drawText('3. Social Security wages', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(w2Data.socialSecurityWages), { x: 400, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText('4. Social Security tax withheld', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(w2Data.socialSecurityTaxWithheld), { x: 400, y: yPos, size: 10, font });
  yPos -= 18;

  // Box 5 & 6 - Medicare
  page.drawText('5. Medicare wages and tips', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(w2Data.medicareWages), { x: 400, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText('6. Medicare tax withheld', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(w2Data.medicareTaxWithheld), { x: 400, y: yPos, size: 10, font });
  yPos -= 25;

  // Boxes 7-8 - Social Security Tips (not commonly used)
  page.drawText('7. Social Security tips', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
  yPos -= 15;
  page.drawText('8. Allocated tips', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
  yPos -= 18;

  // Box 10 - Dependent care benefits
  page.drawText('10. Dependent care benefits', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
  yPos -= 18;

  // Box 11 - Nonqualified plans
  page.drawText('11. Nonqualified plans', { x: 50, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
  yPos -= 25;

  // Boxes 12a-d - Codes (from Box 12 data)
  const box12 = w2Data.box12 || [];
  const box12Labels = ['12a.', '12b.', '12c.', '12d.'];
  if (box12.length > 0) {
    for (let i = 0; i < Math.min(box12.length, 4); i++) {
      const entry = box12[i];
      const codeLabel = entry.code ? `Code ${entry.code}` : '';
      page.drawText(`${box12Labels[i]} ${codeLabel}`, { x: 50, y: yPos, size: 9, font });
      page.drawText(formatCurrency(entry.amount), { x: 400, y: yPos, size: 10, font });
      yPos -= 15;
    }
  } else {
    page.drawText('12a. Deferred compensation & other', { x: 50, y: yPos, size: 9, font });
    page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText('12b.', { x: 50, y: yPos, size: 9, font });
    page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText('12c.', { x: 50, y: yPos, size: 9, font });
    page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText('12d.', { x: 50, y: yPos, size: 9, font });
    page.drawText('$0.00', { x: 400, y: yPos, size: 10, font });
  }
  yPos -= 25;

  // Box 13 - Checkboxes
  page.drawText('13. Statutory employee / Retirement plan / Third-party sick pay', { x: 50, y: yPos, size: 9, font });
  page.drawText('☐  ☐  ☐', { x: 400, y: yPos, size: 12, font });
  yPos -= 18;

  // Box 14 - Other
  page.drawText('14. Other', { x: 50, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('(State tax info, etc.)', { x: 50, y: yPos, size: 8, font });
  yPos -= 25;

  // Boxes 15-20 - State tax info
  page.drawText('15. State', { x: 50, y: yPos, size: 9, font });
  page.drawText('State EIN', { x: 180, y: yPos, size: 9, font });
  page.drawText('State wages', { x: 350, y: yPos, size: 9, font });
  page.drawText('State income tax', { x: 500, y: yPos, size: 9, font });
  yPos -= 15;
  page.drawText('---', { x: 50, y: yPos, size: 9, font });
  page.drawText('---', { x: 180, y: yPos, size: 9, font });
  page.drawText(formatCurrency(w2Data.wages), { x: 350, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 500, y: yPos, size: 9, font });
  yPos -= 18;

  page.drawText('---', { x: 50, y: yPos, size: 9, font });
  page.drawText('---', { x: 180, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 350, y: yPos, size: 9, font });
  page.drawText('$0.00', { x: 500, y: yPos, size: 9, font });

  // Disclaimer
  page.drawText('FOR INFORMATIONAL PURPOSES ONLY - VERIFY ALL DATA BEFORE FILING', {
    x: 50,
    y: 30,
    size: 8,
    font,
    color: rgb(0.5, 0, 0),
  });

  return pdfDoc.save();
}

// ===== FORM 8863 =====

/**
 * Generate Form 8863 (Education Credits: American Opportunity and Lifetime Learning Credits)
 */
export async function generateForm8863(educationExpenses: EducationExpenses[], taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (educationExpenses.length === 0) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Form 8863', 'Education Credits (American Opportunity and Lifetime Learning)');
  const { height } = page.getSize();

  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  // Part I - American Opportunity Credit
  page.drawText('Part I - American Opportunity Credit', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  let totalAOCQualifiedExpenses = 0;
  let studentsEligibleForAOC = 0;

  educationExpenses.forEach((student, idx) => {
    // AOC only for first 4 years of post-secondary education
    const isAOCEligible = student.isFirstFourYears;
    
    if (isAOCEligible) {
      studentsEligibleForAOC++;
      // Max $4,000 per student (100% of first $2,000 + 25% of next $2,000)
      const maxCreditPerStudent = Math.min(student.tuitionAndFees, 2000) + Math.min(Math.max(0, student.tuitionAndFees - 2000) * 0.25, 500);
      totalAOCQualifiedExpenses += maxCreditPerStudent;

      yPos -= 15;
      page.drawText(`${idx + 1}. ${student.studentName} - ${student.institution}`, { x: 50, y: yPos, size: 9, font });
      yPos -= 12;
      page.drawText(`   Qualified expenses: ${formatCurrency(student.tuitionAndFees)}`, { x: 60, y: yPos, size: 8, font });
      yPos -= 12;
      page.drawText(`   Credit amount: ${formatCurrency(maxCreditPerStudent)}`, { x: 60, y: yPos, size: 8, font });
    }
  });

  yPos -= 10;
  page.drawText('1. Total qualified education expenses for American Opportunity Credit', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(totalAOCQualifiedExpenses), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('2. Number of students eligible for American Opportunity Credit', { x: 50, y: yPos, size: 9, font });
  page.drawText(String(studentsEligibleForAOC), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  // Max credit is $2,500 per eligible student
  const aocCredit = Math.min(totalAOCQualifiedExpenses, studentsEligibleForAOC * 2500);
  page.drawText('3. American Opportunity Credit (100% of line 1 up to $2,500 per student)', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(aocCredit), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 30;

  // Part II - Lifetime Learning Credit
  page.drawText('Part II - Lifetime Learning Credit', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  // LLC is 20% of first $10,000 of qualified expenses, max $2,000 per return
  const totalLLExpenses = educationExpenses.reduce((sum, e) => sum + e.tuitionAndFees, 0);
  const llcCredit = Math.min(totalLLExpenses * 0.20, 2000);

  page.drawText('5. Total qualified education expenses for Lifetime Learning Credit', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(totalLLExpenses), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('6. Lifetime Learning Credit (20% of line 5, max $2,000)', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(llcCredit), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 30;

  // Part III - Summary
  page.drawText('Part III - Summary', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  // 2025 income limits for AOC: Modified AGI up to $90,000 single/$180,000 MFJ
  const agi = taxReturn.taxCalculation?.agi || 0;
  let aocReduction = 0;
  if (taxReturn.personalInfo.filingStatus === 'Single' || taxReturn.personalInfo.filingStatus === 'Head of Household') {
    if (agi > 80000) aocReduction = Math.min(1, (agi - 80000) / 10000);
  } else if (agi > 160000) {
    aocReduction = Math.min(1, (agi - 160000) / 10000);
  }

  const reducedAOC = aocCredit * (1 - aocReduction);
  const totalEducationCredit = reducedAOC + llcCredit;

  page.drawText('8. Total education credits', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(totalEducationCredit), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 15;

  page.drawText('(Enter on Schedule 3, line 3)', { x: 50, y: yPos, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  return pdfDoc.save();
}

// ===== FORM 8889 =====

/**
 * Generate Form 8889 (Health Savings Account)
 */
export async function generateForm8889(hsaData: HSAData, taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (!hsaData) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Form 8889', 'Health Savings Accounts (HSA)');
  const { height } = page.getSize();

  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 25;

  // Checkboxes
  page.drawText('✓', { x: 50, y: yPos, size: 10, font });
  page.drawText(hsaData.isFamily ? 'Self-only coverage' : 'Family coverage', { x: 70, y: yPos, size: 10, font });
  yPos -= 30;

  // 2025 HSA contribution limits: Self-only $4,150, Family $8,300
  const contributionLimit = hsaData.isFamily ? 8300 : 4150;

  // Part I - HSA Contributions
  page.drawText('Part I - HSA Contributions', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText('1. HSA contributions you made (and those made on your behalf)', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(hsaData.contributions), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('2. Employer contributions to HSA', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(hsaData.employerContributions), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const totalContributions = hsaData.contributions + hsaData.employerContributions;
  page.drawText('3. Total HSA contributions (line 1 + line 2)', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(totalContributions), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 15;

  page.drawText(`4. HSA contribution limit (${hsaData.isFamily ? 'Family' : 'Self-only'})`, { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(contributionLimit), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const excessContribution = Math.max(0, totalContributions - contributionLimit);
  if (excessContribution > 0) {
    page.drawText('5. Excess contributions (line 3 minus line 4)', { x: 50, y: yPos, size: 9, font, color: rgb(0.7, 0, 0) });
    page.drawText(formatCurrency(excessContribution), { x: 450, y: yPos, size: 9, font, color: rgb(0.7, 0, 0) });
  } else {
    page.drawText('5. Excess contributions', { x: 50, y: yPos, size: 9, font });
    page.drawText('$0.00', { x: 450, y: yPos, size: 9, font });
  }
  yPos -= 15;

  // 2025 catch-up contribution for age 55+: additional $1,000
  if (taxReturn.personalInfo.age >= 55) {
    const catchUpLimit = 1000;
    page.drawText(`6. Catch-up contribution (age 55+)`, { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(catchUpLimit), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;
  }

  // Deduction calculation
  const deduction = Math.min(totalContributions, contributionLimit);
  page.drawText('11. HSA deduction (enter on Schedule 1, line 13)', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(deduction), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 30;

  // Part II - HSA Distributions
  page.drawText('Part II - HSA Distributions', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText('14. Distributions from HSA', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(hsaData.distributions), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  // Simplified assumption: distributions are for qualified medical expenses
  page.drawText('15. Qualified medical expenses', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(hsaData.distributions), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const taxableDistribution = Math.max(0, hsaData.distributions - hsaData.distributions);
  page.drawText('16. Taxable HSA distributions', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(taxableDistribution), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 15;

  if (taxableDistribution > 0) {
    page.drawText('17. Additional tax (line 16 × 10%)', { x: 50, y: yPos, size: 9, font, color: rgb(0.7, 0, 0) });
    page.drawText(formatCurrency(taxableDistribution * 0.10), { x: 450, y: yPos, size: 9, font, color: rgb(0.7, 0, 0) });
  }

  return pdfDoc.save();
}

// ===== FORM 8880 =====

/**
 * Generate Form 8880 (Saver's Credit for Retirement Savings)
 */
export async function generateForm8880(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  const tradIRA = taxReturn.traditionalIRAContribution;
  const rothIRA = taxReturn.rothIRAContribution;

  // Must have IRA contributions to claim the credit
  if ((!tradIRA || tradIRA.amount === 0) && (!rothIRA || rothIRA.amount === 0)) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Form 8880', 'Credit for Qualified Retirement Savings Contributions');
  const { height } = page.getSize();

  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 25;

  // Filing status for credit calculation
  const isMFJ = taxReturn.personalInfo.filingStatus === 'Married Filing Jointly';
  page.drawText(`Filing Status: ${taxReturn.personalInfo.filingStatus}`, { x: 50, y: yPos, size: 10, font });
  yPos -= 25;

  // Determine credit rate based on AGI
  const agi = taxReturn.taxCalculation?.agi || 0;

  // 2025 Saver's Credit income limits
  let creditRate = 0;
  let maxCredit = 0;
  let maxContribution = 0;

  if (isMFJ) {
    if (agi <= 43600) { creditRate = 0.50; maxContribution = 2000; maxCredit = 1000; }
    else if (agi <= 47500) { creditRate = 0.20; maxContribution = 2000; maxCredit = 400; }
    else if (agi <= 76500) { creditRate = 0.10; maxContribution = 2000; maxCredit = 200; }
  } else {
    if (agi <= 21800) { creditRate = 0.50; maxContribution = 2000; maxCredit = 1000; }
    else if (agi <= 23750) { creditRate = 0.20; maxContribution = 2000; maxCredit = 400; }
    else if (agi <= 38250) { creditRate = 0.10; maxContribution = 2000; maxCredit = 200; }
  }

  // Part I - Contribution
  page.drawText('Part I - Contributions', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  const tradAmount = tradIRA?.amount || 0;
  const rothAmount = rothIRA?.amount || 0;
  const totalContributions = tradAmount + rothAmount;

  page.drawText('1. Traditional IRA contributions', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(tradAmount), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('2. Roth IRA contributions', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(rothAmount), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('3. Total qualified contributions', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(totalContributions), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 25;

  // Part II - Credit Calculation
  page.drawText('Part II - Saver\'s Credit', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText('4. Adjusted Gross Income', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(agi), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText(`5. Credit rate (based on AGI)`, { x: 50, y: yPos, size: 9, font });
  page.drawText(`${(creditRate * 100).toFixed(0)}%`, { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('6. Maximum contribution for credit', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(maxContribution), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const contributionForCredit = Math.min(totalContributions, maxContribution);
  page.drawText('7. Amount of contribution for credit', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(contributionForCredit), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const credit = contributionForCredit * creditRate;
  page.drawText('8. Saver\'s Credit', { x: 50, y: yPos, size: 10, font: boldFont });
  page.drawText(formatCurrency(credit), { x: 450, y: yPos, size: 10, font: boldFont });
  yPos -= 15;

  page.drawText('(Enter on Schedule 3, line 4)', { x: 50, y: yPos, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  return pdfDoc.save();
}

// ===== FORM 8606 =====

/**
 * Generate Form 8606 (Nondeductible IRAs) - if applicable
 */
export async function generateForm8606(taxReturn: TaxReturn): Promise<Uint8Array | null> {
  if (!taxReturn.form8606) return null;

  const pdfDoc = await PDFDocument.create();
  const { page, font, boldFont } = await createFormPage(pdfDoc, 'Form 8606', 'Nondeductible IRAs');
  const { height } = page.getSize();
  
  const form8606 = taxReturn.form8606;
  let yPos = height - 120;

  // Name and SSN
  page.drawText(`Name: ${taxReturn.personalInfo.firstName} ${taxReturn.personalInfo.lastName}`, { x: 50, y: yPos, size: 10, font });
  page.drawText(`SSN: ${formatSSN(taxReturn.personalInfo.ssn)}`, { x: 400, y: yPos, size: 10, font });
  yPos -= 30;

  page.drawText('Part I - Nondeductible Contributions', { x: 50, y: yPos, size: 12, font: boldFont });
  yPos -= 20;

  page.drawText('1. Nondeductible contributions to traditional IRAs for 2025', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(form8606.nondeductibleContributions), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  page.drawText('2. Total basis in traditional IRAs (prior year basis)', { x: 50, y: yPos, size: 9, font });
  page.drawText(formatCurrency(form8606.priorYearBasis), { x: 450, y: yPos, size: 9, font });
  yPos -= 15;

  const totalBasis = form8606.nondeductibleContributions + form8606.priorYearBasis;
  page.drawText('3. Total basis in traditional IRAs', { x: 50, y: yPos, size: 9, font: boldFont });
  page.drawText(formatCurrency(totalBasis), { x: 450, y: yPos, size: 9, font: boldFont });
  yPos -= 30;

  if (form8606.conversionsToRoth > 0) {
    page.drawText('Part II - Conversions to Roth IRA', { x: 50, y: yPos, size: 12, font: boldFont });
    yPos -= 20;

    page.drawText('8. Amount converted to Roth IRA', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(form8606.conversionsToRoth), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;

    page.drawText('13. Total value of all traditional IRAs at end of year', { x: 50, y: yPos, size: 9, font });
    page.drawText(formatCurrency(form8606.endOfYearTraditionalIRABalance), { x: 450, y: yPos, size: 9, font });
    yPos -= 15;

    const taxableAmount = form8606.conversionsToRoth - (totalBasis / form8606.endOfYearTraditionalIRABalance * form8606.conversionsToRoth);
    page.drawText('18. Taxable amount of conversion', { x: 50, y: yPos, size: 9, font: boldFont });
    page.drawText(formatCurrency(Math.max(0, taxableAmount)), { x: 450, y: yPos, size: 9, font: boldFont });
  }

  return pdfDoc.save();
}

// ===== COMBINED PDF =====

/**
 * Generate all applicable forms and combine into a single PDF
 */
export async function generateAllForms(taxReturn: TaxReturn): Promise<Uint8Array> {
  // Ensure calculations are up-to-date
  if (!taxReturn.taxCalculation) {
    taxReturn.taxCalculation = calculateTaxReturn(taxReturn);
  }

  const mainPdf = await PDFDocument.create();

  // Form 1040 (always included)
  const form1040Bytes = await generateForm1040(taxReturn);
  const form1040Doc = await PDFDocument.load(form1040Bytes);
  const form1040Pages = await mainPdf.copyPages(form1040Doc, form1040Doc.getPageIndices());
  form1040Pages.forEach((page: PDFPage) => mainPdf.addPage(page));

  // Schedule 1 (always included)
  const schedule1Bytes = await generateSchedule1(taxReturn);
  const schedule1Doc = await PDFDocument.load(schedule1Bytes);
  const schedule1Pages = await mainPdf.copyPages(schedule1Doc, schedule1Doc.getPageIndices());
  schedule1Pages.forEach((page: PDFPage) => mainPdf.addPage(page));

  // Schedule 2 (always included)
  const schedule2Bytes = await generateSchedule2(taxReturn);
  const schedule2Doc = await PDFDocument.load(schedule2Bytes);
  const schedule2Pages = await mainPdf.copyPages(schedule2Doc, schedule2Doc.getPageIndices());
  schedule2Pages.forEach((page: PDFPage) => mainPdf.addPage(page));

  // Schedule 3 (always included)
  const schedule3Bytes = await generateSchedule3(taxReturn);
  const schedule3Doc = await PDFDocument.load(schedule3Bytes);
  const schedule3Pages = await mainPdf.copyPages(schedule3Doc, schedule3Doc.getPageIndices());
  schedule3Pages.forEach((page: PDFPage) => mainPdf.addPage(page));

  // Schedule A (if itemized deductions)
  const scheduleABytes = await generateScheduleA(taxReturn);
  if (scheduleABytes) {
    const scheduleADoc = await PDFDocument.load(scheduleABytes);
    const scheduleAPages = await mainPdf.copyPages(scheduleADoc, scheduleADoc.getPageIndices());
    scheduleAPages.forEach((page: PDFPage) => mainPdf.addPage(page));
  }

  // Schedule C (if self-employed)
  const scheduleCBytes = await generateScheduleC(taxReturn);
  if (scheduleCBytes) {
    const scheduleCDoc = await PDFDocument.load(scheduleCBytes);
    const scheduleCPages = await mainPdf.copyPages(scheduleCDoc, scheduleCDoc.getPageIndices());
    scheduleCPages.forEach((page: PDFPage) => mainPdf.addPage(page));
  }

  // Schedule D (if capital gains)
  const scheduleDBytes = await generateScheduleD(taxReturn);
  if (scheduleDBytes) {
    const scheduleDDoc = await PDFDocument.load(scheduleDBytes);
    const scheduleDPages = await mainPdf.copyPages(scheduleDDoc, scheduleDDoc.getPageIndices());
    scheduleDPages.forEach((page: PDFPage) => mainPdf.addPage(page));
  }

  // Schedule E (if rental properties)
  const scheduleEBytes = await generateScheduleE(taxReturn);
  if (scheduleEBytes) {
    const scheduleEDoc = await PDFDocument.load(scheduleEBytes);
    const scheduleEPages = await mainPdf.copyPages(scheduleEDoc, scheduleEDoc.getPageIndices());
    scheduleEPages.forEach((page: PDFPage) => mainPdf.addPage(page));
  }

  // Form 8606 (if mega backdoor Roth)
  const form8606Bytes = await generateForm8606(taxReturn);
  if (form8606Bytes) {
    const form8606Doc = await PDFDocument.load(form8606Bytes);
    const form8606Pages = await mainPdf.copyPages(form8606Doc, form8606Doc.getPageIndices());
    form8606Pages.forEach((page: PDFPage) => mainPdf.addPage(page));
  }

  return mainPdf.save();
}
