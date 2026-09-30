import React, { useState, useEffect } from 'react';
import { Gauge, Cpu, Zap, Activity } from 'lucide-react';
import { PerformanceMode } from '@/types/config';
import { configManager } from '@/config/appConfig';
import { tfjsISLRecognizer } from '@/modules/isl-recognition/TensorFlowISLRecognizer';

interface PerformanceIndicatorWidgetProps {
  cameraFps: number;
  inferenceFps?: number;
  inferenceLatencyMs?: number;
  className?: string;
  compact?: boolean;
}

export const PerformanceIndicatorWidget: React.FC<PerformanceIndicatorWidgetProps> = ({
  cameraFps,
  inferenceFps,
  inferenceLatencyMs = 0,
  className = '',
  compact = false,
}) => {
  const [config, setConfig] = useState(() => configManager.getConfig());
  const [tensorCount, setTensorCount] = useState<number>(0);

  useEffect(() => {
    const unsub = configManager.subscribe(setConfig);
    return () => unsub();
  }, []);

  // Poll TF.js active tensors count every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const mem = tfjsISLRecognizer.getMemoryInfo();
      setTensorCount(mem.numTensors);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentMode = config.performance?.mode || 'balanced';

  const handleModeChange = (mode: PerformanceMode) => {
    configManager.setPerformanceMode(mode);
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] ${className}`}
      >
        <span className="flex items-center gap-1 text-slate-300 font-mono font-bold">
          <Activity className="w-3 h-3 text-emerald-400" />
          {cameraFps} FPS
        </span>
        {inferenceLatencyMs > 0 && (
          <span className="text-slate-400 font-mono border-l border-slate-800 pl-1.5">
            {inferenceLatencyMs}ms
          </span>
        )}
        <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
          {(['high', 'balanced', 'low'] as PerformanceMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-1 rounded text-[9px] font-semibold uppercase ${
                currentMode === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {m[0]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Camera & Inference FPS */}
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400">Stream:</span>
          <span className="text-xs font-mono font-bold text-white">{cameraFps} FPS</span>
          {typeof inferenceFps === 'number' && (
            <span className="text-[10px] font-mono text-indigo-400">
              ({inferenceFps} inf/s)
            </span>
          )}
        </div>

        {/* Inference Latency */}
        <div className="flex items-center gap-1 text-[11px] border-l border-slate-800/80 pl-3">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Latency:</span>
          <span className="font-mono font-semibold text-slate-200">
            {inferenceLatencyMs > 0 ? `${inferenceLatencyMs}ms` : '<10ms'}
          </span>
        </div>

        {/* Active Memory Tensors */}
        {tensorCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono border-l border-slate-800/80 pl-3">
            <span>Tensors:</span>
            <span className="text-slate-400 font-bold">{tensorCount}</span>
          </div>
        )}
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 flex items-center gap-0.5">
          <Zap className="w-3 h-3 text-amber-400" />
          Mode:
        </span>
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
          {(['high', 'balanced', 'low'] as PerformanceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all ${
                currentMode === mode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
