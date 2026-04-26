import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-orange-500/50",
          variant === 'primary' && "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:from-orange-400 hover:to-orange-500",
          variant === 'secondary' && "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700",
          variant === 'ghost' && "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-xl", className)} {...props}>
    {children}
  </div>
);

export const Badge = ({ className, children, variant = "info", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'success' | 'warning' | 'error' | 'info' }) => {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider", variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => (
  <div className={cn("w-full bg-slate-800 rounded-full h-2.5 overflow-hidden", className)}>
    <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}></div>
  </div>
);
