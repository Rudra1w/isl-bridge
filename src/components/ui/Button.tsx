import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-600/40 border border-indigo-500/30',
      secondary:
        'bg-slate-800 text-slate-100 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 shadow-sm',
      outline:
        'bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700 hover:border-slate-600',
      ghost:
        'bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white',
      danger:
        'bg-rose-600/15 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white shadow-sm shadow-rose-900/20',
      success:
        'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 border border-emerald-500/30',
      accent:
        'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/30',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[40px]',
      lg: 'text-sm sm:text-base px-5 py-3 gap-2.5 min-h-[48px]',
      icon: 'p-2.5 w-10 h-10 min-h-[40px] min-w-[40px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
