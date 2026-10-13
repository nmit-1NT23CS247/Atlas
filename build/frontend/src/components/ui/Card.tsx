import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 ${
        hoverable ? 'hover:border-[#7C3AED]/30 hover:shadow-sm' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-semibold text-slate-800 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
