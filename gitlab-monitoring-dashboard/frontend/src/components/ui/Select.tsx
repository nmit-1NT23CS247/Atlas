import React, { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          {icon}
        </div>
      )}
      <select
        className={`w-full appearance-none text-sm bg-white/90 border border-slate-200/90 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
          icon ? 'pl-9' : 'pl-3'
        } pr-8 py-2 cursor-pointer shadow-2xs ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-slate-400">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};
