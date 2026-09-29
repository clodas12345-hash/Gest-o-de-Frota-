import React, { useState, useEffect, useRef } from 'react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined | null;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
}

export const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val) || val <= 0) {
    return '';
  }
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  disabled = false,
  required = false,
  autoFocus = false,
  id,
  name,
  ...rest
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => formatCurrency(value));
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Extrai apenas dígitos
    const digits = raw.replace(/\D/g, '');

    if (!digits || parseInt(digits, 10) === 0) {
      isInternalChange.current = true;
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseInt(digits, 10) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    isInternalChange.current = true;
    setDisplayValue(formatted);
    onChange(numericValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    let clean = pasted.trim().replace(/^R\$\s*/i, '');
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) {
      const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      isInternalChange.current = true;
      setDisplayValue(formatted);
      onChange(num);
    } else {
      const digits = pasted.replace(/\D/g, '');
      if (digits) {
        const n = parseInt(digits, 10) / 100;
        if (n > 0) {
          const formatted = n.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          isInternalChange.current = true;
          setDisplayValue(formatted);
          onChange(n);
        }
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onPaste={handlePaste}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      id={id}
      name={name}
      {...rest}
    />
  );
};

export default CurrencyInput;
