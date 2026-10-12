import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 select-none whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    xs: 'text-xs px-2 py-1 gap-1.5',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:bg-blue-800',
    secondary:
      'bg-white/80 hover:bg-blue-50/80 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-blue-200 active:bg-slate-100',
    outline:
      'bg-transparent hover:bg-blue-50 text-slate-700 border border-slate-300 hover:border-blue-400 active:bg-blue-100/50',
    ghost:
      'bg-transparent hover:bg-slate-100/80 text-slate-700 active:bg-slate-200/80',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:bg-rose-800',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
