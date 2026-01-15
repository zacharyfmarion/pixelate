import type { InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
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
  className = '',
  disabled = false,
  ...props
}: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm text-gray-300">{label}</label>
        {showValue && <span className="text-sm text-gray-400">{valueFormatter(value)}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500 ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        {...props}
      />
    </div>
  );
}
