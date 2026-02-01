import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function Select({ label, value, options, onChange, className = '', disabled = false, ...props }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-50' : ''} ${className}`}>
      <label className="text-sm text-[#b8b4a9] uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-[#1a1a2e] border-2 border-[#3d3d5c] text-[#e8e4d9] text-sm focus:outline-none focus:border-[#a89cc8] ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#1a1a2e]">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
