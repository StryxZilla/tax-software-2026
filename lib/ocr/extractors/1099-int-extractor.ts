// 1099-INT Form Data Extractor
import { extractText, OCRExtractionError } from '../ocr-engine';
import type { Interest1099INT } from '@/types/tax-types';

/**
 * Extract 1099-INT data from an image
 */
export async function extract1099INTData(imageFile: File): Promise<Partial<Interest1099INT>> {
  const { text } = await extractText(imageFile);

  const cleanText = text.replace(/\s+/g, ' ').trim();

  const extracted: Partial<Interest1099INT> = {
    payer: extractPayer(cleanText),
    amount: extractInterestIncome(cleanText),
    earlyWithdrawalPenalty: 0,
    usSavingsBondInterest: 0,
    taxExemptInterest: 0,
    investmentExpenses: 0,
    foreignTaxPaid: 0,
  };

  if (!extracted.payer && !extracted.amount) {
    throw new OCRExtractionError(
      'We could not find 1099-INT fields (payer name / Box 1 interest). Please upload a clearer image or enter values manually.',
      'OCR_PROCESSING_FAILED'
    );
  }

  return extracted;
}

function extractPayer(text: string): string {
  const patterns = [
    /PAYER'?S?\s+name[:\s]+([A-Za-z0-9\s,\.&-]+?)(?=\s+PAYER|Street|$)/i,
    /(?:CORRECTED|VOID)?\s+1099-INT[:\s]+([A-Za-z0-9\s,\.&-]+?)(?=\s+Street|Address|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function extractInterestIncome(text: string): number {
  const patterns = [
    /(?:Box\s+)?1[:\s]+Interest\s+income[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /Interest\s+income[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /(?:Box\s+)?1[:\s]+\$?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!Number.isNaN(amount)) return amount;
    }
  }

  return 0;
}
