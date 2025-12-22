
import React, { useState, useEffect, FocusEvent, ChangeEvent } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null;
  onValueChange: (val: number) => void;
}

export const NumberInput: React.FC<Props> = ({ value, onValueChange, className, ...props }) => {
  // Helper to format number with commas and up to 2 decimal places
  const format = (num: number | null, isFocused: boolean) => {
    // If null or 0, return empty string so the placeholder is visible
    if (num === null || num === 0) return '';
    
    // For focused state, we want the raw string for easier editing
    if (isFocused) return num.toString();

    // For blurred state, we want formatted string with commas
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };
  
  const [display, setDisplay] = useState(format(value, false));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(format(value, false));
    }
  }, [value, focused]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Remove commas to get raw string for processing
    const raw = e.target.value.replace(/,/g, '');
    
    // If the input is just a decimal point, a negative sign, or empty, 
    // we keep the display as is but treat the value as 0
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      setDisplay(raw);
      onValueChange(0);
      return;
    }

    // Regex to allow numbers with up to 2 decimal places
    if (/^-?\d*\.?\d{0,2}$/.test(raw)) {
      setDisplay(raw);
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        onValueChange(val);
      }
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    // On blur, format to add commas and remove trailing dots or invalid sequences
    setDisplay(format(value || 0, false));
    if (props.onBlur) props.onBlur(e);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    // On focus, show the numeric value or empty string for the placeholder
    setDisplay(value === 0 ? '' : (value?.toString() || ''));
    if (props.onFocus) props.onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder="0"
      className={`${className} placeholder-slate-400 dark:placeholder-slate-500`}
      {...props}
    />
  );
};
