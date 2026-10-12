import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'subtle';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    glass:
      'bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_2px_10px_rgba(37,99,235,0.04)]',
    solid:
      'bg-white border border-slate-200 shadow-xs',
    subtle:
      'bg-slate-50/70 border border-slate-200/70',
  }[variant];

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] hover:border-blue-200 hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-xl ${variantStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
