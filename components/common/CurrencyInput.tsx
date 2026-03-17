'use client';

import React, { forwardRef, useState, useCallback } from 'react';

/**
 * Centralized currency input with $ prefix and 2-decimal formatting.
 *
 * - On blur: formats displayed value to 2 decimal places (e.g. "1234.50")
 * - On focus: shows raw numeric value for easy editing
 * - Calls `onValueChange(number)` with the parsed numeric value
 *
 * CSS contract:
 * - Wrapper uses `currency-input` class (testable token)
 * - Prefix uses `currency-input-prefix` class
 * - Input gets `pl-8` for prefix spacing
 */

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Numeric value (controlled) */
  value?: number;
  /** Extra className for the <input> element */
  inputClassName?: string;
  /** Error state — adds red ring */
  hasError?: boolean;
  /** Show $ prefix (default: true) */
  showPrefix?: boolean;
  /** Called with the parsed numeric value on change */
  onValueChange?: (value: number) => void;
  /** Called on blur (in addition to internal formatting) */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/** Format a number to 2 decimal places for display */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return value.toFixed(2);
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ inputClassName = '', hasError, showPrefix = true, className, value, onValueChange, onBlur, placeholder = '0.00', ...inputProps }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(() => formatCurrency(value));
    const [isFocused, setIsFocused] = useState(false);

    const renderedValue = isFocused ? displayValue : formatCurrency(value);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDisplayValue(raw);
      const parsed = parseFloat(raw);
      onValueChange?.(isNaN(parsed) ? 0 : parsed);
    }, [onValueChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw value for easier editing (remove trailing zeros)
      if (value && value !== 0) {
        setDisplayValue(String(value));
      }
      inputProps.onFocus?.(e);
    }, [value, inputProps]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format to 2 decimals on blur
      const parsed = parseFloat(displayValue);
      if (!isNaN(parsed)) {
        setDisplayValue(parsed.toFixed(2));
        onValueChange?.(parsed);
      } else {
        setDisplayValue('0.00');
        onValueChange?.(0);
      }
      onBlur?.(e);
    }, [displayValue, onValueChange, onBlur]);

    const baseInput = `block w-full rounded-lg shadow-sm ${showPrefix ? 'pl-8' : ''} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
    }`;

    return (
      <div className={`currency-input relative ${className ?? ''}`}>
        {showPrefix && (
          <span className="currency-input-prefix absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none select-none">
            $
          </span>
        )}
        <input
          ref={ref}
          type="number"
          step="0.01"
          className={`${baseInput} ${inputClassName}`}
          value={renderedValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...inputProps}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = 'CurrencyInput';
export default CurrencyInput;
