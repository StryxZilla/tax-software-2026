// OCR Engine using Tesseract.js
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export class OCRExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'UNSUPPORTED_FILE_TYPE'
      | 'OCR_ASSET_LOAD_FAILED'
      | 'OCR_PROCESSING_FAILED'
  ) {
    super(message);
    this.name = 'OCRExtractionError';
  }
}

function getFriendlyOCRError(error: unknown): OCRExtractionError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('worker') || lower.includes('traineddata') || lower.includes('fetch')) {
    return new OCRExtractionError(
      'Could not load OCR language assets. Please refresh and try again. If it keeps failing, upload a clear JPG/PNG screenshot of your form instead of a PDF.',
      'OCR_ASSET_LOAD_FAILED'
    );
  }

  return new OCRExtractionError(
    'Could not read text from this file. Try a sharper, well-lit image where all form boxes are visible.',
    'OCR_PROCESSING_FAILED'
  );
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runOCR(file: Blob): Promise<OCRResult> {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => console.log(m),
  });

  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
}

async function preprocessImageForOCR(imageFile: File): Promise<Blob> {
  if (typeof document === 'undefined') {
    return imageFile;
  }

  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(imageFile);
    const image = new Image();

    image.onload = () => {
      try {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(image.width * scale));
        canvas.height = Math.max(1, Math.floor(image.height * scale));

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(imageFile);
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Light-weight enhancement: grayscale + contrast boost to improve OCR reliability.
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
          data[i] = contrasted;
          data[i + 1] = contrasted;
          data[i + 2] = contrasted;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob ?? imageFile);
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for OCR preprocessing'));
    };

    image.src = url;
  });
}

async function extractTextFromPdf(file: File): Promise<OCRResult> {
  const pdfBuffer = await file.arrayBuffer();

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer), disableWorker: true } as any);
  const pdf = await loadingTask.promise;

  const textSegments: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();

    if (pageText) {
      textSegments.push(pageText);
    }
  }

  const embeddedText = normalizeExtractedText(textSegments.join('\n'));

  // If PDF has embedded selectable text, prefer it over OCR for quality and speed.
  if (embeddedText.length >= 40) {
    return {
      text: embeddedText,
      confidence: 100,
    };
  }

  // Fallback for scanned/image-only PDFs: render first page and OCR it.
  const firstPage = await pdf.getPage(1);
  const viewport = firstPage.getViewport({ scale: 2 });

  if (typeof document === 'undefined') {
    throw new Error('PDF OCR fallback requires browser canvas support');
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to initialize canvas for PDF OCR fallback');
  }

  await firstPage.render({ canvasContext: ctx as any, viewport } as any).promise;

  const renderedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to render PDF page for OCR'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });

  return runOCR(renderedBlob);
}

/**
 * Extract text from an image or PDF using OCR / text extraction
 */
export async function extractText(file: File): Promise<OCRResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new OCRExtractionError(
      `Unsupported file type: ${file.type || 'unknown'}. Please upload a PDF, JPG, PNG, or WebP image.`,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  try {
    if (isPdf) {
      return await extractTextFromPdf(file);
    }

    const preprocessed = await preprocessImageForOCR(file);
    return await runOCR(preprocessed);
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw getFriendlyOCRError(error);
  }
}

/**
 * Extract text from a specific region of an image
 * Useful for targeting specific fields on a form
 */
export async function extractTextFromRegion(
  imageFile: File,
  region: { left: number; top: number; width: number; height: number }
): Promise<OCRResult> {
  let worker: Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;

  try {
    worker = await Tesseract.createWorker('eng', undefined, {
      logger: (m) => console.log(m),
    });

    const result = await worker.recognize(imageFile, {
      rectangle: region,
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw getFriendlyOCRError(error);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
