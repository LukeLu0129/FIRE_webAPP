
import React, { useState, useEffect, FocusEvent, ChangeEvent } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null;
  onValueChange: (val: number) => void;
}

export const NumberInput: React.FC<Props> = ({ value, onValueChange, className, ...props }) => {
  // Helper to format number with commas
  const format = (num: number | null) => {
    if (num === null || num === 0) return '';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  const [display, setDisplay] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(format(value));
    }
  }, [value, focused]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Remove commas to get raw string
    const raw = e.target.value.replace(/,/g, '');
    
    // Handle empty or invalid input
    if (raw === '' || raw === '-') {
      setDisplay(raw);
      onValueChange(0);
      return;
    }

    // If valid number, update state
    if (!isNaN(Number(raw))) {
      setDisplay(raw);
      onValueChange(Number(raw));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    // On blur, re-format to add commas
    setDisplay(format(value || 0));
    if (props.onBlur) props.onBlur(e);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    // On focus, strip commas for editing
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
      className={className}
      {...props}
    />
  );
};
