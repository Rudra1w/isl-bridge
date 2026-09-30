import React from 'react';
import { RecognitionState, SignPrediction } from '@/types/recognition';
import { formatConfidence } from '@/utils/formatters';
import { ShieldAlert, Activity, CheckCircle2, Eye, Hand } from 'lucide-react';

interface RecognitionStatusBadgeProps {
  state: RecognitionState;
  handsCount: number;
  prediction: SignPrediction | null;
  confidence: number;
  fps: number;
  isFallback: boolean;
  className?: string;
}

export const RecognitionStatusBadge: React.FC<RecognitionStatusBadgeProps> = ({
  state,
  handsCount,
  prediction,
  confidence,
  fps,
  isFallback,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (state) {
      case 'starting':
        return {
          label: 'Vision Model Initializing...',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'tracking':
        return {
          label: `Tracking ${handsCount} Hand${handsCount > 1 ? 's' : ''}`,
          color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400 animate-ping',
        };
      case 'recognizing':
        return {
          label: 'Sign Detected',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'no_hands':
        return {
          label: 'Position Hands in View',
          color: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
          dot: 'bg-slate-500',
        };
      case 'error':
        return {
          label: 'Vision Engine Error',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: 'Standby',
          color: 'bg-slate-800/60 text-slate-400 border-slate-700/40',
          dot: 'bg-slate-600',
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/95 border border-slate-800/90 shadow-xl backdrop-blur-md ${className}`}>
      {/* Top row status */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className="font-medium">{status.label}</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            {fps} FPS
          </span>
          <span className="flex items-center gap-1">
            <Hand className="w-3.5 h-3.5 text-slate-500" />
            {handsCount}
          </span>
        </div>
      </div>

      {/* Prediction & Confidence meter */}
      {prediction ? (
        <div className="mt-1 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-sm tracking-wide border border-indigo-500/30">
                {prediction.label}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">({prediction.gloss})</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400">
              {formatConfidence(confidence)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span>Show signs clearly to webcam for recognition</span>
        </div>
      )}

      {/* Model Integrity Tag */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1.5 mt-0.5">
        <span className="flex items-center gap-1">
          {isFallback ? (
            <>
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span className="text-amber-400/90 font-medium">Heuristic Landmark Fallback</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-400">Trained ISL Model</span>
            </>
          )}
        </span>
        <span>21 Landmark 3D</span>
      </div>
    </div>
  );
};
