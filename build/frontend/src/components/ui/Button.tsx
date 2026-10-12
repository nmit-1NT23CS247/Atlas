import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      tooltip,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[#8E54E9]/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    };

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-[#8E54E9] to-[#B66DFF] text-white shadow-sm hover:opacity-95 hover:shadow active:scale-[0.99] border-0',
      secondary:
        'bg-[#F4F1FA] text-slate-700 hover:bg-[#EBE5F7] border border-slate-200/60 active:scale-[0.99]',
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99]',
      danger:
        'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-[0.99]',
      ghost:
        'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 active:scale-[0.99]',
    };

    const buttonElement = (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        title={tooltip}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );

    if (tooltip && disabled) {
      return (
        <span className="inline-block" title={tooltip}>
          {buttonElement}
        </span>
      );
    }

    return buttonElement;
  }
);

Button.displayName = 'Button';
