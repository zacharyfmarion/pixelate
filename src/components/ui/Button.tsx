import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium border-2 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider';

    const variants = {
      primary:
        'bg-[#5c4a8a] hover:bg-[#7c6f9b] border-[#a89cc8] hover:border-[#c4b8e8] text-[#e8e4d9] shadow-[2px_2px_0_#2d2d44] hover:shadow-[1px_1px_0_#2d2d44] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      secondary:
        'bg-[#2d2d44] hover:bg-[#3d3d5c] border-[#4a4a6a] hover:border-[#5c5c8a] text-[#b8b4a9] shadow-[2px_2px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      ghost:
        'bg-transparent hover:bg-[#2d2d44] border-transparent hover:border-[#4a4a6a] text-[#8a8a9a]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
