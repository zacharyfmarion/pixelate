import { useState, useEffect, type InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  valueParser?: (formatted: string) => number;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showValue = true,
  valueFormatter = (v) => String(v),
  valueParser,
  className = '',
  disabled = false,
  ...props
}: SliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Update input value when external value changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(valueFormatter(value));
    }
  }, [value, valueFormatter, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    
    // Parse the input value
    let parsed: number;
    if (valueParser) {
      parsed = valueParser(inputValue);
    } else {
      // Default parser: extract number from string (handles "10px", "45°", "+5", etc.)
      const match = inputValue.match(/-?\d+\.?\d*/);
      parsed = match ? parseFloat(match[0]) : value;
    }

    // Clamp to min/max and round to step
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      const stepped = Math.round(clamped / step) * step;
      // Round to avoid floating point issues
      const rounded = Math.round(stepped * 1000) / 1000;
      onChange(rounded);
    }
    
    // Reset input to formatted value
    setInputValue(valueFormatter(value));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(valueFormatter(value));
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    // Select all text on focus for easy replacement
    setInputValue(valueFormatter(value));
  };

  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm text-[#b8b4a9] uppercase tracking-wider">{label}</label>
        {showValue && (
          <input
            type="text"
            value={isEditing ? inputValue : valueFormatter(value)}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            className={`w-16 text-sm text-[#7c6f9b] bg-[#1a1a2e] px-2 py-0.5 border border-[#3d3d5c] text-right focus:outline-none focus:border-[#a89cc8] ${
              disabled ? 'cursor-not-allowed' : 'cursor-text'
            }`}
          />
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        {...props}
      />
    </div>
  );
}
