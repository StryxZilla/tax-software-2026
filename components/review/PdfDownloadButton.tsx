'use client';

import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { TaxReturn } from '../../types/tax-types';
import { generateAllForms } from '../../lib/engine/pdf/pdf-generator';
import { validateSSN } from '../../lib/validation/form-validation';

interface PdfDownloadButtonProps {
  taxReturn: TaxReturn;
}

export default function PdfDownloadButton({ taxReturn }: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    // Prevent multiple clicks during generation
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Pre-validation check
      if (!taxReturn.personalInfo.firstName || !taxReturn.personalInfo.lastName || !taxReturn.personalInfo.ssn) {
        throw new Error('required:Personal information incomplete. Please fill out all required fields.');
      }

      if (!validateSSN(taxReturn.personalInfo.ssn)) {
        throw new Error('format:Please enter a valid SSN (XXX-XX-XXXX) before downloading.');
      }

      // Generate the PDF with a timeout
      const pdfPromise = generateAllForms(taxReturn);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout:PDF generation timed out. Please try again.')), 30000)
      );

      const pdfBytes = await Promise.race([pdfPromise, timeoutPromise]);

      // Create a blob from the PDF bytes
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Create filename with taxpayer name and year
      const fileName = `Tax_Return_2026_${taxReturn.personalInfo.lastName}_${taxReturn.personalInfo.firstName}.pdf`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      // Handle errors with more specific feedback
      let errorMessage = '';

      if (err instanceof Error) {
        const [errorType, ...details] = err.message.split(':');
        const errorDetails = details.join(':');

        switch (errorType) {
          case 'required':
            errorMessage = errorDetails;
            break;
          case 'timeout':
            errorMessage = 'PDF generation timed out. Please try again.';
            break;
          case 'memory':
            errorMessage = 'Your return is too large. Try simplifying entries or contact support.';
            break;
          case 'format':
            errorMessage = 'Invalid data format. Please review your entries and correct any errors.';
            break;
          default:
            errorMessage = 'Please check that all required fields are filled correctly and try again.';
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('PDF Generation Error:', {
            type: errorType,
            message: err.message,
            stack: err.stack
          });
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again or contact support.';
      }

      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Download Button - Premium Design */}
      <div className="card-premium overflow-hidden">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className={`
            w-full flex items-center justify-center gap-4 px-8 py-6 font-bold text-xl
            transition-all duration-300 relative overflow-hidden
            ${isGenerating 
              ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white shadow-lg hover:shadow-2xl active:scale-[0.98]'
            }
          `}
        >
          {/* Animated background shimmer (only when not generating) */}
          {!isGenerating && (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
            </div>
          )}
          
          <div className="relative flex items-center gap-4">
            {isGenerating ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                <span>Generating Your Tax Forms...</span>
              </>
            ) : (
              <>
                <Download className="w-7 h-7" />
                <span>Download Complete Tax Return (PDF)</span>
              </>
            )}
          </div>
        </button>
      </div>

      {success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <img
              src="/brand/zoey-celebrate.png"
              alt="Zoey celebrating successful download"
              className="h-14 w-14 rounded-xl border border-green-200 bg-white object-cover object-top flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Tax Forms Generated Successfully!</p>
              </div>
              <p className="text-sm text-green-800">Your PDF has been downloaded. Please review before filing.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <img
              src="/brand/zoey-embarrassed.png"
              alt="Zoey helping with a recoverable download error"
              className="h-14 w-14 rounded-xl border border-red-200 bg-white object-cover object-top flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-red-900">Error Generating PDF</p>
              </div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer - Professional */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 shadow-sm">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold text-amber-900 text-sm uppercase tracking-wide">
              Important Disclaimer
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              This PDF is generated <strong>for informational purposes only</strong>. 
              Please verify all data before filing with the IRS. This software does not constitute 
              tax advice. Consult with a qualified tax professional if you have questions.
            </p>
          </div>
        </div>
      </div>

      {/* What's Included - Premium Info Box */}
      <div className="card-premium p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 rounded-lg p-2">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900 mb-3 text-lg">
              📋 What&apos;s Included in Your Download
            </p>
            <p className="text-sm text-blue-800 mb-4">
              Your PDF package contains Form 1040 and all applicable schedules based on your tax situation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-900">Form 1040 - Individual Tax Return</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-900">Schedule 1 - Additional Income</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-900">Schedule 2 - Additional Taxes</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-900">Schedule 3 - Credits & Payments</span>
              </div>
              {taxReturn.itemizedDeductions && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Schedule A - Itemized Deductions</span>
                </div>
              )}
              {taxReturn.selfEmployment && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Schedule C - Business Income</span>
                </div>
              )}
              {taxReturn.capitalGains.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Schedule D - Capital Gains</span>
                </div>
              )}
              {taxReturn.rentalProperties.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Schedule E - Rental Income</span>
                </div>
              )}
              {taxReturn.form8606 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Form 8606 - Nondeductible IRAs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
