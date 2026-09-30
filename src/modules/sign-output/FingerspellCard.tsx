import React from 'react';
import { GlossToken } from '@/types/isl';
import { Sparkles } from 'lucide-react';

interface FingerspellCardProps {
  token: GlossToken;
  isActive: boolean;
  onClick?: () => void;
}

export const FingerspellCard: React.FC<FingerspellCardProps> = ({
  token,
  isActive,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all duration-200 select-none ${
        isActive
          ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/30 scale-105'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Handshape Image / SVG */}
      <div className="w-16 h-16 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80">
        {token.matchedAsset?.url ? (
          <img
            src={token.matchedAsset.url}
            alt={`Sign ${token.gloss}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xl font-bold font-mono text-indigo-400">
            {token.gloss}
          </span>
        )}
      </div>

      {/* Label and Badge */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold font-mono text-slate-100">
          {token.gloss}
        </div>
        {token.isFingerspelled && (
          <span className="text-[9px] text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            FS
          </span>
        )}
      </div>
    </div>
  );
};
