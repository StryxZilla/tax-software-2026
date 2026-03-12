// Form Validation Utilities
// Provides validation functions for all tax forms

import { PersonalInfo, W2Income, Dependent, Interest1099INT, EducationExpenses, TraditionalIRAContribution, RothIRAContribution, Form8606Data, ItemizedDeductions, TaxReturn } from '../../types/tax-types';
import { SELF_EMPLOYMENT_TAX_2025 } from '../../data/tax-constants';

export interface ValidationError {
  field: string;
  message: string;
}

const TAX_YEAR = 2025;

const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
]);

function parseStrictIsoDate(value: string): Date | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  // Date input fields emit YYYY-MM-DD. Parse strictly to avoid JS Date rollover
  // accepting impossible dates like 2025-02-30.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isExactDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return isExactDate ? parsed : null;
}

function isValidPastOrPresentDate(value: string): boolean {
  const parsed = parseStrictIsoDate(value);
  if (!parsed) return false;

  const today = new Date();
  const todayUtcMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return parsed.getTime() <= todayUtcMidnight;
}

// SSN validation
export function validateSSN(ssn: string): boolean {
  const normalized = ssn?.trim();
  if (!normalized) return false;

  const ssnPattern = /^(\d{3})-(\d{2})-(\d{4})$/;
  const match = ssnPattern.exec(normalized);
  if (!match) return false;

  const [, area, group, serial] = match;
  if (area === '000' || area === '666' || area.startsWith('9')) return false;
  if (group === '00') return false;
  if (serial === '0000') return false;

  return true;
}

// EIN validation
export function validateEIN(ein: string): boolean {
  const einPattern = /^\d{2}-\d{7}$/;
  return einPattern.test(ein?.trim());
}

// Zip code validation
export function validateZipCode(zip: string): boolean {
  const zipPattern = /^\d{5}(-\d{4})?$/;
  return zipPattern.test(zip?.trim());
}

export function validateStateCode(state: string): boolean {
  return US_STATE_CODES.has(state?.trim().toUpperCase());
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeSSN(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

// Personal Info Validation
export function validatePersonalInfo(info: PersonalInfo): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!info.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!info.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  if (!info.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' });
  }
  if (!info.city?.trim()) {
    errors.push({ field: 'city', message: 'City is required' });
  }
  if (!info.state?.trim()) {
    errors.push({ field: 'state', message: 'State is required' });
  } else if (!validateStateCode(info.state)) {
    errors.push({ field: 'state', message: 'Enter a valid 2-letter US state code' });
  }

  // SSN format validation
  if (!info.ssn?.trim()) {
    errors.push({ field: 'ssn', message: 'Social Security Number is required' });
  } else if (!validateSSN(info.ssn)) {
    errors.push({ field: 'ssn', message: 'SSN must be in format XXX-XX-XXXX' });
  }

  // Zip code validation
  if (!info.zipCode?.trim()) {
    errors.push({ field: 'zipCode', message: 'ZIP code is required' });
  } else if (!validateZipCode(info.zipCode)) {
    errors.push({ field: 'zipCode', message: 'ZIP code must be in format XXXXX or XXXXX-XXXX' });
  }

  // Age validation
  if (!isFiniteNumber(info.age)) {
    errors.push({ field: 'age', message: 'Age must be a valid number' });
  } else if (info.age === 0) {
    errors.push({ field: 'age', message: 'Age is required' });
  } else if (info.age < 0 || info.age > 120) {
    errors.push({ field: 'age', message: 'Age must be between 0 and 120' });
  }

  // Spouse validation for Married Filing Jointly
  if (info.filingStatus === 'Married Filing Jointly') {
    if (!info.spouseInfo?.firstName?.trim()) {
      errors.push({ field: 'spouseFirstName', message: 'Spouse first name is required when filing jointly' });
    }
    if (!info.spouseInfo?.lastName?.trim()) {
      errors.push({ field: 'spouseLastName', message: 'Spouse last name is required when filing jointly' });
    }
    if (!info.spouseInfo?.ssn?.trim()) {
      errors.push({ field: 'spouseSSN', message: 'Spouse SSN is required when filing jointly' });
    } else if (!validateSSN(info.spouseInfo.ssn)) {
      errors.push({ field: 'spouseSSN', message: 'Spouse SSN must be in format XXX-XX-XXXX' });
    } else if (normalizeSSN(info.spouseInfo.ssn) === normalizeSSN(info.ssn)) {
      errors.push({ field: 'spouseSSN', message: 'Spouse SSN must be different from your SSN' });
    }
    if (!isFiniteNumber(info.spouseInfo?.age)) {
      errors.push({ field: 'spouseAge', message: 'Spouse age must be a valid number' });
    } else if (info.spouseInfo!.age === 0) {
      errors.push({ field: 'spouseAge', message: 'Spouse age is required when filing jointly' });
    } else if (info.spouseInfo!.age < 0 || info.spouseInfo!.age > 120) {
      errors.push({ field: 'spouseAge', message: 'Spouse age must be between 0 and 120' });
    }
  }

  return errors;
}

// W-2 Validation
export function validateW2(w2: W2Income, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `W-2 #${index + 1}`;

  const numericFields: Array<[keyof W2Income, string, string]> = [
    ['wages', 'wages', 'Wages'],
    ['federalTaxWithheld', 'federalTax', 'Federal tax withheld'],
    ['socialSecurityWages', 'socialSecurityWages', 'Social Security wages'],
    ['socialSecurityTaxWithheld', 'socialSecurityTaxWithheld', 'Social Security tax withheld'],
    ['medicareWages', 'medicareWages', 'Medicare wages'],
    ['medicareTaxWithheld', 'medicareTaxWithheld', 'Medicare tax withheld'],
  ];

  for (const [field, suffix, label] of numericFields) {
    if (!isFiniteNumber(w2[field])) {
      errors.push({ field: `w2-${index}-${suffix}`, message: `${prefix}: ${label} must be a valid number` });
    }
  }

  if (!w2.employer?.trim()) {
    errors.push({ field: `w2-${index}-employer`, message: `${prefix}: Employer name is required` });
  }
  if (!w2.ein?.trim()) {
    errors.push({ field: `w2-${index}-ein`, message: `${prefix}: Employer EIN is required` });
  } else if (!validateEIN(w2.ein)) {
    errors.push({ field: `w2-${index}-ein`, message: `${prefix}: EIN must be in format XX-XXXXXXX` });
  }
  if (isFiniteNumber(w2.wages) && w2.wages < 0) {
    errors.push({ field: `w2-${index}-wages`, message: `${prefix}: Wages cannot be negative` });
  }
  if (isFiniteNumber(w2.wages) && w2.wages === 0) {
    errors.push({ field: `w2-${index}-wages`, message: `${prefix}: Wages are required` });
  }
  if (isFiniteNumber(w2.federalTaxWithheld) && w2.federalTaxWithheld < 0) {
    errors.push({ field: `w2-${index}-federalTax`, message: `${prefix}: Federal tax withheld cannot be negative` });
  }
  if (isFiniteNumber(w2.federalTaxWithheld) && isFiniteNumber(w2.wages) && w2.federalTaxWithheld > w2.wages && w2.wages > 0) {
    errors.push({ field: `w2-${index}-federalTax`, message: `${prefix}: Federal tax withheld cannot exceed wages` });
  }

  if (isFiniteNumber(w2.socialSecurityWages) && w2.socialSecurityWages < 0) {
    errors.push({ field: `w2-${index}-socialSecurityWages`, message: `${prefix}: Social Security wages cannot be negative` });
  }
  if (isFiniteNumber(w2.socialSecurityTaxWithheld) && w2.socialSecurityTaxWithheld < 0) {
    errors.push({ field: `w2-${index}-socialSecurityTaxWithheld`, message: `${prefix}: Social Security tax withheld cannot be negative` });
  }
  if (isFiniteNumber(w2.medicareWages) && w2.medicareWages < 0) {
    errors.push({ field: `w2-${index}-medicareWages`, message: `${prefix}: Medicare wages cannot be negative` });
  }
  if (isFiniteNumber(w2.medicareTaxWithheld) && w2.medicareTaxWithheld < 0) {
    errors.push({ field: `w2-${index}-medicareTaxWithheld`, message: `${prefix}: Medicare tax withheld cannot be negative` });
  }

  // Social Security wage base cap — a single W-2 cannot report SS wages
  // above the annual limit; this catches common data-entry transpositions.
  const ssWageLimit = SELF_EMPLOYMENT_TAX_2025.socialSecurityWageLimit;
  if (isFiniteNumber(w2.socialSecurityWages) && w2.socialSecurityWages > ssWageLimit) {
    errors.push({
      field: `w2-${index}-socialSecurityWages`,
      message: `${prefix}: Social Security wages cannot exceed the ${TAX_YEAR} wage base ($${ssWageLimit.toLocaleString()})`,
    });
  }

  // SS tax withheld should not exceed employee rate (6.2%) × SS wages
  if (
    isFiniteNumber(w2.socialSecurityTaxWithheld) &&
    isFiniteNumber(w2.socialSecurityWages) &&
    w2.socialSecurityWages > 0 &&
    w2.socialSecurityTaxWithheld > 0
  ) {
    const employeeSSRate = SELF_EMPLOYMENT_TAX_2025.socialSecurityRate / 2;
    const maxSSTax = Math.round(w2.socialSecurityWages * employeeSSRate * 100) / 100;
    if (w2.socialSecurityTaxWithheld > maxSSTax + 0.01) {
      errors.push({
        field: `w2-${index}-socialSecurityTaxWithheld`,
        message: `${prefix}: Social Security tax withheld ($${w2.socialSecurityTaxWithheld.toFixed(2)}) exceeds expected maximum ($${maxSSTax.toFixed(2)})`,
      });
    }
  }

  return errors;
}

// Dependent Validation
export function validateDependent(dependent: Dependent, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `Dependent #${index + 1}`;

  if (!dependent.firstName?.trim()) {
    errors.push({ field: `dependent-${index}-firstName`, message: `${prefix}: First name is required` });
  }
  if (!dependent.lastName?.trim()) {
    errors.push({ field: `dependent-${index}-lastName`, message: `${prefix}: Last name is required` });
  }
  if (!dependent.ssn?.trim()) {
    errors.push({ field: `dependent-${index}-ssn`, message: `${prefix}: SSN is required` });
  } else if (!validateSSN(dependent.ssn)) {
    errors.push({ field: `dependent-${index}-ssn`, message: `${prefix}: SSN must be in format XXX-XX-XXXX` });
  }
  if (!dependent.relationshipToTaxpayer?.trim()) {
    errors.push({ field: `dependent-${index}-relationship`, message: `${prefix}: Relationship is required` });
  }
  if (!dependent.birthDate?.trim()) {
    errors.push({ field: `dependent-${index}-birthDate`, message: `${prefix}: Birth date is required` });
  } else if (!isValidPastOrPresentDate(dependent.birthDate)) {
    errors.push({ field: `dependent-${index}-birthDate`, message: `${prefix}: Enter a valid birth date that is not in the future` });
  }
  if (!isFiniteNumber(dependent.monthsLivedWithTaxpayer)) {
    errors.push({ field: `dependent-${index}-months`, message: `${prefix}: Months lived with you must be a valid number` });
  } else if (dependent.monthsLivedWithTaxpayer < 0 || dependent.monthsLivedWithTaxpayer > 12) {
    errors.push({ field: `dependent-${index}-months`, message: `${prefix}: Months lived with you must be between 0 and 12` });
  }

  return errors;
}

// Interest Income Validation
export function validateInterest(interest: Interest1099INT, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `1099-INT #${index + 1}`;

  if (!interest.payer?.trim()) {
    errors.push({ field: `interest-${index}-payer`, message: `${prefix}: Payer name is required` });
  }
  if (!isFiniteNumber(interest.amount)) {
    errors.push({ field: `interest-${index}-amount`, message: `${prefix}: Interest amount must be a valid number` });
    return errors;
  }
  if (interest.amount < 0) {
    errors.push({ field: `interest-${index}-amount`, message: `${prefix}: Interest amount cannot be negative` });
  }
  if (interest.amount === 0) {
    errors.push({ field: `interest-${index}-amount`, message: `${prefix}: Interest amount is required` });
  }

  return errors;
}

// Education Expenses Validation
export function validateEducationExpense(expense: EducationExpenses, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `Student #${index + 1}`;

  if (!expense.studentName?.trim()) {
    errors.push({ field: `education-${index}-name`, message: `${prefix}: Student name is required` });
  }
  if (!expense.ssn?.trim()) {
    errors.push({ field: `education-${index}-ssn`, message: `${prefix}: Student SSN is required` });
  } else if (!validateSSN(expense.ssn)) {
    errors.push({ field: `education-${index}-ssn`, message: `${prefix}: SSN must be in format XXX-XX-XXXX` });
  }
  if (!expense.institution?.trim()) {
    errors.push({ field: `education-${index}-institution`, message: `${prefix}: Institution name is required` });
  }
  if (!isFiniteNumber(expense.tuitionAndFees)) {
    errors.push({ field: `education-${index}-tuition`, message: `${prefix}: Tuition must be a valid number` });
    return errors;
  }
  if (expense.tuitionAndFees < 0) {
    errors.push({ field: `education-${index}-tuition`, message: `${prefix}: Tuition cannot be negative` });
  }
  if (expense.tuitionAndFees === 0) {
    errors.push({ field: `education-${index}-tuition`, message: `${prefix}: Tuition amount is required` });
  }

  return errors;
}

function validateUniqueSSNs(taxReturn: TaxReturn): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();

  const track = (ssn: string | undefined, field: string, label: string) => {
    const normalizedSsn = normalizeSSN(ssn);
    if (!normalizedSsn || !validateSSN(normalizedSsn)) return;

    const existing = seen.get(normalizedSsn);
    if (existing) {
      errors.push({ field, message: `${label}: SSN duplicates ${existing}` });
    } else {
      seen.set(normalizedSsn, label);
    }
  };

  track(taxReturn.personalInfo.ssn, 'ssn', 'Taxpayer');
  track(taxReturn.personalInfo.spouseInfo?.ssn, 'spouseSSN', 'Spouse');

  taxReturn.dependents.forEach((dep, index) => {
    track(dep.ssn, `dependent-${index}-ssn`, `Dependent #${index + 1}`);
  });

  taxReturn.educationExpenses.forEach((exp, index) => {
    track(exp.ssn, `education-${index}-ssn`, `Student #${index + 1}`);
  });

  return errors;
}

export function validateTaxReturn(taxReturn: TaxReturn): ValidationError[] {
  return [
    ...validatePersonalInfo(taxReturn.personalInfo),
    ...taxReturn.w2Income.flatMap((w2, index) => validateW2(w2, index)),
    ...taxReturn.dependents.flatMap((dep, index) => validateDependent(dep, index)),
    ...taxReturn.interest.flatMap((interest, index) => validateInterest(interest, index)),
    ...taxReturn.educationExpenses.flatMap((exp, index) => validateEducationExpense(exp, index)),
    ...taxReturn.capitalGains.flatMap((gain, index) => validateCapitalGain(gain, index)),
    ...(taxReturn.selfEmployment ? validateScheduleC(taxReturn.selfEmployment) : []),
    ...taxReturn.rentalProperties.flatMap((rental, index) => validateRentalProperty(rental, index)),
    ...validateRetirement(taxReturn.traditionalIRAContribution, taxReturn.rothIRAContribution, taxReturn.form8606),
    ...validateItemizedDeductions(taxReturn.itemizedDeductions),
    ...validateUniqueSSNs(taxReturn),
  ];
}

// Utility function to check if there are any errors
export function hasErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

// Utility function to get error messages as a single string
export function getErrorMessages(errors: ValidationError[]): string[] {
  return errors.map(e => e.message);
}

// Capital Gains Validation
export function validateCapitalGain(gain: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `Transaction #${index + 1}`;

  if (!gain.description?.trim()) {
    errors.push({ field: `capital-${index}-description`, message: `${prefix}: Description is required` });
  }
  if (!gain.dateAcquired?.trim()) {
    errors.push({ field: `capital-${index}-dateAcquired`, message: `${prefix}: Acquisition date is required` });
  } else if (!isValidPastOrPresentDate(gain.dateAcquired)) {
    errors.push({ field: `capital-${index}-dateAcquired`, message: `${prefix}: Enter a valid acquisition date that is not in the future` });
  }

  if (!gain.dateSold?.trim()) {
    errors.push({ field: `capital-${index}-dateSold`, message: `${prefix}: Sale date is required` });
  } else if (!isValidPastOrPresentDate(gain.dateSold)) {
    errors.push({ field: `capital-${index}-dateSold`, message: `${prefix}: Enter a valid sale date that is not in the future` });
  }

  const acquired = parseStrictIsoDate(gain.dateAcquired);
  const sold = parseStrictIsoDate(gain.dateSold);
  if (acquired && sold && sold < acquired) {
    errors.push({ field: `capital-${index}-dateSold`, message: `${prefix}: Sale date cannot be before acquisition date` });
  }
  if (!isFiniteNumber(gain.proceeds)) {
    errors.push({ field: `capital-${index}-proceeds`, message: `${prefix}: Proceeds must be a valid number` });
  } else if (gain.proceeds < 0) {
    errors.push({ field: `capital-${index}-proceeds`, message: `${prefix}: Proceeds cannot be negative` });
  } else if (gain.proceeds === 0) {
    errors.push({ field: `capital-${index}-proceeds`, message: `${prefix}: Proceeds amount is required` });
  }
  if (!isFiniteNumber(gain.costBasis)) {
    errors.push({ field: `capital-${index}-costBasis`, message: `${prefix}: Cost basis must be a valid number` });
  } else if (gain.costBasis < 0) {
    errors.push({ field: `capital-${index}-costBasis`, message: `${prefix}: Cost basis cannot be negative` });
  }

  return errors;
}

// Schedule C (Self-Employment) Validation
export function validateScheduleC(scheduleC: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!scheduleC.businessName?.trim()) {
    errors.push({ field: 'scheduleC-businessName', message: 'Business name is required' });
  }
  if (scheduleC.ein && !validateEIN(scheduleC.ein)) {
    errors.push({ field: 'scheduleC-ein', message: 'EIN must be in format XX-XXXXXXX' });
  }

  const numericFields: Array<[unknown, string, string]> = [
    [scheduleC.grossReceipts, 'scheduleC-grossReceipts', 'Gross receipts'],
    [scheduleC.returns, 'scheduleC-returns', 'Returns'],
    [scheduleC.costOfGoodsSold, 'scheduleC-cogs', 'Cost of goods sold'],
  ];

  for (const [value, field, label] of numericFields) {
    if (!isFiniteNumber(value)) {
      errors.push({ field, message: `${label} must be a valid number` });
    }
  }

  if (isFiniteNumber(scheduleC.grossReceipts) && scheduleC.grossReceipts < 0) {
    errors.push({ field: 'scheduleC-grossReceipts', message: 'Gross receipts cannot be negative' });
  }
  if (isFiniteNumber(scheduleC.returns) && scheduleC.returns < 0) {
    errors.push({ field: 'scheduleC-returns', message: 'Returns cannot be negative' });
  }
  if (isFiniteNumber(scheduleC.costOfGoodsSold) && scheduleC.costOfGoodsSold < 0) {
    errors.push({ field: 'scheduleC-cogs', message: 'Cost of goods sold cannot be negative' });
  }

  return errors;
}

// Rental Property Validation
export function validateRentalProperty(rental: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `Property #${index + 1}`;

  if (!rental.address?.trim()) {
    errors.push({ field: `rental-${index}-address`, message: `${prefix}: Address is required` });
  }
  if (!rental.city?.trim()) {
    errors.push({ field: `rental-${index}-city`, message: `${prefix}: City is required` });
  }
  if (!rental.state?.trim()) {
    errors.push({ field: `rental-${index}-state`, message: `${prefix}: State is required` });
  } else if (!validateStateCode(rental.state)) {
    errors.push({ field: `rental-${index}-state`, message: `${prefix}: Enter a valid 2-letter US state code` });
  }
  if (!rental.zipCode?.trim()) {
    errors.push({ field: `rental-${index}-zipCode`, message: `${prefix}: ZIP code is required` });
  } else if (!validateZipCode(rental.zipCode)) {
    errors.push({ field: `rental-${index}-zipCode`, message: `${prefix}: ZIP code must be in format XXXXX or XXXXX-XXXX` });
  }
  if (!isFiniteNumber(rental.daysRented)) {
    errors.push({ field: `rental-${index}-daysRented`, message: `${prefix}: Days rented must be a valid number` });
  } else if (rental.daysRented < 0 || rental.daysRented > 365) {
    errors.push({ field: `rental-${index}-daysRented`, message: `${prefix}: Days rented must be between 0 and 365` });
  }

  if (!isFiniteNumber(rental.daysPersonalUse)) {
    errors.push({ field: `rental-${index}-daysPersonalUse`, message: `${prefix}: Days of personal use must be a valid number` });
  } else if (rental.daysPersonalUse < 0 || rental.daysPersonalUse > 365) {
    errors.push({ field: `rental-${index}-daysPersonalUse`, message: `${prefix}: Days of personal use must be between 0 and 365` });
  }

  if (isFiniteNumber(rental.daysRented) && isFiniteNumber(rental.daysPersonalUse) && rental.daysRented + rental.daysPersonalUse > 365) {
    errors.push({ field: `rental-${index}-daysRented`, message: `${prefix}: Total days (rented + personal) cannot exceed 365` });
  }

  if (!isFiniteNumber(rental.rentalIncome)) {
    errors.push({ field: `rental-${index}-rentalIncome`, message: `${prefix}: Rental income must be a valid number` });
  } else if (rental.rentalIncome < 0) {
    errors.push({ field: `rental-${index}-rentalIncome`, message: `${prefix}: Rental income cannot be negative` });
  }

  return errors;
}

// IRA / Retirement Validation (2025 limits)
const IRA_LIMIT_2025 = 7000;
const IRA_CATCHUP_LIMIT_2025 = 8000; // 50+ years old

export function validateRetirement(
  traditionalIRA: TraditionalIRAContribution | undefined,
  rothIRA: RothIRAContribution | undefined,
  form8606: Form8606Data | undefined
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (traditionalIRA) {
    if (!isFiniteNumber(traditionalIRA.amount)) {
      errors.push({ field: 'retirement-traditional-amount', message: 'Traditional IRA contribution must be a valid number' });
    } else {
      if (traditionalIRA.amount < 0) {
        errors.push({ field: 'retirement-traditional-amount', message: 'Traditional IRA contribution cannot be negative' });
      }
      if (traditionalIRA.amount > IRA_CATCHUP_LIMIT_2025) {
        errors.push({
          field: 'retirement-traditional-amount',
          message: `Traditional IRA contribution cannot exceed $${IRA_CATCHUP_LIMIT_2025.toLocaleString()} (2025 limit)`,
        });
      }
    }
  }

  if (rothIRA) {
    if (!isFiniteNumber(rothIRA.amount)) {
      errors.push({ field: 'retirement-roth-amount', message: 'Roth IRA contribution must be a valid number' });
    } else {
      if (rothIRA.amount < 0) {
        errors.push({ field: 'retirement-roth-amount', message: 'Roth IRA contribution cannot be negative' });
      }
      if (rothIRA.amount > IRA_CATCHUP_LIMIT_2025) {
        errors.push({
          field: 'retirement-roth-amount',
          message: `Roth IRA contribution cannot exceed $${IRA_CATCHUP_LIMIT_2025.toLocaleString()} (2025 limit)`,
        });
      }
    }
  }

  // Combined traditional + Roth cannot exceed the annual limit
  const traditionalAmount = traditionalIRA && isFiniteNumber(traditionalIRA.amount) ? traditionalIRA.amount : 0;
  const rothAmount = rothIRA && isFiniteNumber(rothIRA.amount) ? rothIRA.amount : 0;
  const totalIRA = traditionalAmount + rothAmount;
  if (totalIRA > IRA_CATCHUP_LIMIT_2025) {
    errors.push({
      field: 'retirement-combined-limit',
      message: `Combined IRA contributions ($${totalIRA.toLocaleString()}) exceed the 2025 annual limit of $${IRA_CATCHUP_LIMIT_2025.toLocaleString()}`,
    });
  }

  if (form8606) {
    const form8606Fields: Array<[keyof Form8606Data, string, string]> = [
      ['nondeductibleContributions', 'retirement-8606-nondeductible', 'Nondeductible contributions'],
      ['priorYearBasis', 'retirement-8606-priorBasis', 'Prior year basis'],
      ['conversionsToRoth', 'retirement-8606-conversions', 'Roth conversion amount'],
      ['endOfYearTraditionalIRABalance', 'retirement-8606-balance', 'End-of-year IRA balance'],
    ];

    for (const [key, field, label] of form8606Fields) {
      const value = form8606[key];
      if (!isFiniteNumber(value)) {
        errors.push({ field, message: `${label} must be a valid number` });
      } else if (value < 0) {
        errors.push({ field, message: `${label} cannot be negative` });
      }
    }
  }

  return errors;
}

// SALT deduction cap (Tax Cuts and Jobs Act, 2018-2025)
const SALT_CAP_2025 = 10000;

// Itemized Deductions Validation
export function validateItemizedDeductions(deductions: ItemizedDeductions | undefined): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!deductions) return errors;

  const fields: Array<[keyof ItemizedDeductions, string]> = [
    ['medicalExpenses', 'Medical expenses'],
    ['stateTaxesPaid', 'State taxes paid'],
    ['localTaxesPaid', 'Local taxes paid'],
    ['realEstateTaxes', 'Real estate taxes'],
    ['personalPropertyTaxes', 'Personal property taxes'],
    ['homeMortgageInterest', 'Home mortgage interest'],
    ['investmentInterest', 'Investment interest'],
    ['charitableCash', 'Charitable cash contributions'],
    ['charitableNonCash', 'Charitable non-cash contributions'],
    ['casualtyLosses', 'Casualty and theft losses'],
    ['otherDeductions', 'Other deductions'],
  ];

  for (const [field, label] of fields) {
    const value = deductions[field];
    if (value !== undefined && value !== null && !isFiniteNumber(value)) {
      errors.push({
        field: `itemized-${field}`,
        message: `${label} must be a valid number`,
      });
    } else if (isFiniteNumber(value) && value < 0) {
      errors.push({
        field: `itemized-${field}`,
        message: `${label} cannot be negative`,
      });
    }
  }

  // SALT cap: state taxes + local taxes + real estate taxes + personal property taxes
  const saltComponents = [
    deductions.stateTaxesPaid,
    deductions.localTaxesPaid,
    deductions.realEstateTaxes,
    deductions.personalPropertyTaxes,
  ];
  const totalSALT = saltComponents.reduce<number>(
    (sum, v) => sum + (isFiniteNumber(v) && v > 0 ? v : 0),
    0,
  );
  if (totalSALT > SALT_CAP_2025) {
    errors.push({
      field: 'itemized-saltCap',
      message: `State and local tax (SALT) deductions total $${totalSALT.toLocaleString()}, which exceeds the $${SALT_CAP_2025.toLocaleString()} annual cap. Only $${SALT_CAP_2025.toLocaleString()} is deductible.`,
    });
  }

  return errors;
}
