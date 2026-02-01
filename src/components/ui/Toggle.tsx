interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, className = '', disabled = false }: ToggleProps) {
  return (
    <label className={`flex items-center justify-between ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}>
      <span className="text-sm text-[#b8b4a9] uppercase tracking-wider">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-12 items-center border-2 transition-all ${
          checked
            ? 'bg-[#5c4a8a] border-[#a89cc8]'
            : 'bg-[#1a1a2e] border-[#3d3d5c]'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform bg-[#e8e4d9] border border-[#a89cc8] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
