import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, leftIcon, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          className={`w-full h-9 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#8E54E9] focus:ring-2 focus:ring-[#8E54E9]/20 transition-all appearance-none cursor-pointer pr-8 ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
