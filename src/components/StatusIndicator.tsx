import React from 'react';

interface StatusIndicatorProps {
  label: string;
  isEnabled: boolean;
  isReady?: boolean;
  details?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  isEnabled,
  isReady = true,
  details,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
        !isEnabled
          ? 'bg-slate-900 text-slate-500 border-slate-800'
          : isReady
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      } ${className}`}
      title={details || label}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          !isEnabled ? 'bg-slate-600' : isReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
        }`}
      />
      <span>{label}</span>
      {details && <span className="opacity-60 text-[10px]">({details})</span>}
    </div>
  );
};
