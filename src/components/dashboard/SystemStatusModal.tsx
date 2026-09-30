import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Camera,
  Hand,
  Cpu,
  Volume2,
  Sparkles,
  Layers,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { systemStatusService, SystemStatusSnapshot } from '@/services/systemStatusService';
import { tfjsISLRecognizer } from '@/modules/isl-recognition/TensorFlowISLRecognizer';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [status, setStatus] = useState<SystemStatusSnapshot>(systemStatusService.getSnapshot());

  useEffect(() => {
    if (!isOpen) return;
    const unsub = systemStatusService.subscribe(setStatus);
    return () => unsub();
  }, [isOpen]);

  const tfMemory = tfjsISLRecognizer.getMemoryInfo();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System Diagnostics & Hardware Status"
      description="Live status telemetry for all computer vision, speech, neural inference, and NLP subsystems."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Offline / Online Connectivity Banner */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border ${
            status.network === 'ONLINE'
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            {status.network === 'ONLINE' ? (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                Network: {status.network === 'ONLINE' ? 'Online' : 'Offline Mode'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                {status.network === 'ONLINE'
                  ? 'All services including cloud speech and Gemini NLP are available.'
                  : 'Operating 100% offline. Hand tracking, gesture recognition, local signs, and rule heuristics work without internet.'}
              </p>
            </div>
          </div>
          <Badge variant={status.network === 'ONLINE' ? 'success' : 'warning'} size="sm">
            {status.network}
          </Badge>
        </div>

        {/* Core Subsystem Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Camera */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Camera</h4>
                  <span className="text-[10px] text-slate-400">WebRTC Video Feed</span>
                </div>
              </div>
              <Badge
                variant={
                  status.camera === 'ACTIVE'
                    ? 'success'
                    : status.camera === 'READY'
                    ? 'info'
                    : status.camera === 'ERROR'
                    ? 'danger'
                    : 'neutral'
                }
                size="sm"
              >
                {status.camera}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {status.cameraDetail}
            </p>
          </div>

          {/* 2. Hand Tracking */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Hand className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Hand Tracking</h4>
                  <span className="text-[10px] text-slate-400">MediaPipe Tasks Vision</span>
                </div>
              </div>
              <Badge
                variant={
                  status.handTracking === 'ACTIVE'
                    ? 'success'
                    : status.handTracking === 'READY'
                    ? 'info'
                    : 'danger'
                }
                size="sm"
              >
                {status.handTracking}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              21 3D landmarks per hand via WebAssembly SIMD
            </p>
          </div>

          {/* 3. ISL Model */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">ISL Model</h4>
                  <span className="text-[10px] text-slate-400">Classifier Engine</span>
                </div>
              </div>
              <Badge
                variant={status.islModel === 'READY' ? 'success' : 'warning'}
                size="sm"
              >
                {status.islModel}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {status.islModelDetail}
            </p>
          </div>

          {/* 4. Speech Recognition */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Speech Recognition</h4>
                  <span className="text-[10px] text-slate-400">Web Speech API (en-IN)</span>
                </div>
              </div>
              <Badge
                variant={
                  status.speechRecognition === 'LISTENING'
                    ? 'success'
                    : status.speechRecognition === 'READY'
                    ? 'info'
                    : 'danger'
                }
                size="sm"
              >
                {status.speechRecognition}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {status.speechRecognition === 'UNSUPPORTED'
                ? 'Desktop Chrome/Edge required for Web Speech API'
                : 'Native browser speech recognition active'}
            </p>
          </div>

          {/* 5. Gemini NLP */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Gemini NLP</h4>
                  <span className="text-[10px] text-slate-400">ISL Gloss Translator</span>
                </div>
              </div>
              <Badge
                variant={
                  status.gemini === 'CONNECTED'
                    ? 'brand'
                    : status.gemini === 'LOCAL FALLBACK'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {status.gemini}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {status.geminiDetail}
            </p>
          </div>

          {/* 6. Sign Assets */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Sign Assets</h4>
                  <span className="text-[10px] text-slate-400">Local Verified Library</span>
                </div>
              </div>
              <Badge variant="success" size="sm">
                {status.signAssetsCount} Available
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {status.signAssetsDetail}
            </p>
          </div>
        </div>

        {/* Hardware & Low-Spec Telemetry Card */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
            <span>Performance Profile: <strong className="text-indigo-400 capitalize">{status.performanceMode}</strong></span>
            <span>Active Tensors: <strong className="text-emerald-400">{tfMemory.numTensors}</strong></span>
            <span>Memory: <strong className="text-slate-400">{(tfMemory.numBytes / 1024).toFixed(1)} KB</strong></span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">
            Updated in real time &bull; Press ESC to close
          </span>
          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              Open Settings & Configuration &rarr;
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
