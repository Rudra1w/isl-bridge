import React from 'react';

interface ModuleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl bg-slate-900 border border-slate-800/90 shadow-xl overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </div>
  );
};
