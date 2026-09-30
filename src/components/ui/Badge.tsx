import React from 'react';
import { cn } from '@/utils/classNames';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    neutral: {
      container: 'bg-slate-800 text-slate-300 border-slate-700/80',
      dot: 'bg-slate-400',
    },
    success: {
      container: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    warning: {
      container: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    danger: {
      container: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    info: {
      container: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
      dot: 'bg-sky-400',
    },
    brand: {
      container: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const current = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors select-none',
        current.container,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            current.dot,
            pulse && 'animate-ping'
          )}
        />
      )}
      {children}
    </span>
  );
};
