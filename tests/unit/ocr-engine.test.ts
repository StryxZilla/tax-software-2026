import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { recognize, getDocument, getTextContent, render } = vi.hoisted(() => {
  const recognize = vi.fn();
  const getTextContent = vi.fn();
  const render = vi.fn();

  const getPage = vi.fn(() => ({
    getTextContent,
    getViewport: () => ({ width: 400, height: 300 }),
    render,
  }));

  const getDocument = vi.fn(() => ({
    promise: Promise.resolve({ numPages: 1, getPage }),
  }));

  return { recognize, getDocument, getTextContent, render };
});

vi.mock('tesseract.js', () => ({
  default: {
    recognize,
    createWorker: vi.fn(),
  },
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument,
}));

import { extractText } from '@/lib/ocr/ocr-engine';

describe('ocr-engine', () => {
  beforeEach(() => {
    recognize.mockReset();
    getDocument.mockClear();
    getTextContent.mockReset();
    render.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts embedded text for PDF uploads when available', async () => {
    const pdfFile = new File(['%PDF'], 'w2.pdf', { type: 'application/pdf' });

    getTextContent.mockResolvedValueOnce({
      items: [{ str: 'Form W-2 Employer ACME Corp Box 1 wages 55000.00' }],
    });

    const result = await extractText(pdfFile);

    expect(result).toEqual({
      text: 'Form W-2 Employer ACME Corp Box 1 wages 55000.00',
      confidence: 100,
    });
    expect(recognize).not.toHaveBeenCalled();
  });

  it('falls back to OCR when PDF has no embedded text', async () => {
    const pdfFile = new File(['%PDF'], 'scan.pdf', { type: 'application/pdf' });

    getTextContent.mockResolvedValueOnce({ items: [] });
    render.mockReturnValueOnce({ promise: Promise.resolve() });
    recognize.mockResolvedValueOnce({ data: { text: 'scanned text', confidence: 88 } });

    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn(), getImageData: vi.fn(), putImageData: vi.fn() }),
        toBlob: (cb: BlobCallback) => cb(new Blob(['x'], { type: 'image/png' })),
      }),
    });

    const result = await extractText(pdfFile);

    expect(result).toEqual({ text: 'scanned text', confidence: 88 });
    expect(recognize).toHaveBeenCalledTimes(1);
  });

  it('returns clear error for unsupported file types', async () => {
    const txtFile = new File(['x'], 'notes.txt', { type: 'text/plain' });

    await expect(extractText(txtFile)).rejects.toMatchObject({
      name: 'OCRExtractionError',
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });

  it('maps OCR worker/language load failures to actionable error', async () => {
    recognize.mockRejectedValueOnce(new Error('Failed to fetch traineddata from worker'));
    const imageFile = new File(['x'], 'w2.png', { type: 'image/png' });

    await expect(extractText(imageFile)).rejects.toMatchObject({
      name: 'OCRExtractionError',
      code: 'OCR_ASSET_LOAD_FAILED',
    });
  });

  it('extracts text for valid image files', async () => {
    recognize.mockResolvedValueOnce({ data: { text: 'ok', confidence: 99 } });
    const imageFile = new File(['x'], 'w2.png', { type: 'image/png' });

    const result = await extractText(imageFile);
    expect(result).toEqual({ text: 'ok', confidence: 99 });
  });
});
