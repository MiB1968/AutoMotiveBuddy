import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// Utility
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Button
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand to-brand-dark text-white shadow-[0_4px_15px_var(--color-brand-glow)] hover:shadow-[0_8px_25px_var(--color-brand-glow)] hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:border-slate-600",
  ghost:
    "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50",
  outline:
    "bg-transparent border border-brand/50 text-brand hover:bg-brand/10 hover:border-brand",
  danger:
    "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_25px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]",
  success:
    "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-xs gap-1",
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
  icon: "p-2 aspect-square",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          buttonSizes[size],
          buttonVariants[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

// ============================================================================
// Spinner
// ============================================================================

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      "inline-block rounded-full border-current border-t-transparent animate-spin",
      spinnerSizes[size],
      className
    )}
  />
);

// ============================================================================
// Card (with sub-components for composition)
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const cardPadding = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable, glow, padding = 'none', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-xl",
        cardPadding[padding],
        hoverable && "transition-all duration-300 hover:border-brand/30 hover:bg-slate-900/70 hover:-translate-y-0.5",
        glow && "shadow-[0_0_30px_var(--color-brand-glow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-1.5 p-6 pb-4 border-b border-white/5", className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn("text-lg font-semibold text-white tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn("text-sm text-slate-400", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn("flex items-center p-6 pt-4 border-t border-white/5", className)}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// Badge
// ============================================================================

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  brand: "bg-brand/10 text-brand border-brand/20",
};

const badgeSizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-blue-400",
  neutral: "bg-slate-400",
  brand: "bg-brand",
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = "info",
  size = "md",
  dot = false,
  pulse = false,
  ...props
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold border uppercase tracking-wider",
      badgeVariants[variant],
      badgeSizes[size],
      className
    )}
    {...props}
  >
    {dot && (
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              dotColors[variant]
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", dotColors[variant])} />
      </span>
    )}
    {children}
  </span>
);

// ============================================================================
// ProgressBar
// ============================================================================

interface ProgressBarProps {
  progress: number;
  className?: string;
  variant?: 'brand' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  striped?: boolean;
  indeterminate?: boolean;
}

const progressVariants = {
  brand: "bg-brand shadow-[0_0_10px_var(--color-brand-glow)]",
  success: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  warning: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  error: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
};

const progressSizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  variant = 'brand',
  size = 'md',
  showLabel = false,
  label,
  striped = false,
  indeterminate = false,
}) => {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400">
          <span>{label ?? "Progress"}</span>
          {showLabel && !indeterminate && <span className="font-mono">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full bg-[#0A1224] border border-white/10 rounded-full overflow-hidden shadow-inner",
          progressSizes[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressVariants[variant],
            striped && "bg-stripes",
            indeterminate && "animate-progress-indeterminate w-1/3"
          )}
          style={{ width: indeterminate ? undefined : `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Input
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block mb-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "w-full rounded-lg bg-slate-900/50 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

// ============================================================================
// Skeleton (loading placeholder)
// ============================================================================

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 bg-[length:200%_100%]",
      className
    )}
    {...props}
  />
);

// ============================================================================
// Alert
// ============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const alertVariants: Record<AlertVariant, string> = {
  info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  error: "bg-red-500/10 border-red-500/30 text-red-300",
};

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  icon,
  onClose,
  children,
  ...props
}) => (
  <div
    role="alert"
    className={cn(
      "relative flex gap-3 rounded-lg border p-4 backdrop-blur-sm",
      alertVariants[variant],
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
    <div className="flex-1 min-w-0">
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        aria-label="Close alert"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    )}
  </div>
);

// ============================================================================
// Tooltip (lightweight, CSS-only)
// ============================================================================

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={cn(
          "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 border border-white/10 rounded-md shadow-lg whitespace-nowrap",
          "opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200",
          sideClasses[side]
        )}
      >
        {content}
      </span>
    </span>
  );
};

// ============================================================================
// Divider
// ============================================================================

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  className,
  orientation = 'horizontal',
  label,
  ...props
}) => {
  if (label && orientation === 'horizontal') {
    return (
      <div className={cn("flex items-center gap-3 my-4", className)} {...props}>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  }
  return (
    <div
      role="separator"
      className={cn(
        orientation === 'horizontal' ? "w-full h-px my-4" : "h-full w-px mx-4",
        "bg-white/10",
        className
      )}
      {...props}
    />
  );
};
