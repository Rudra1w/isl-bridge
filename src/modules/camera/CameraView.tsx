import React, { RefObject } from 'react';
import { Camera, CameraOff, FlipHorizontal, AlertTriangle, RefreshCw } from 'lucide-react';
import { CameraDeviceInfo } from './CameraStream';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef?: RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  devices: CameraDeviceInfo[];
  selectedDeviceId: string;
  isMirrored: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onSwitchDevice: (deviceId: string) => void;
  onToggleMirror: () => void;
  className?: string;
  children?: React.ReactNode; // For badges/overlays
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isStreaming,
  devices,
  selectedDeviceId,
  isMirrored,
  error,
  onStart,
  onStop,
  onSwitchDevice,
  onToggleMirror,
  className = '',
  children,
}) => {
  return (
    <div className={`relative flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl ${className}`}>
      {/* Top bar controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {isStreaming ? 'Continuous Camera Stream' : 'Camera Standby'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSwitchDevice(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onToggleMirror}
            title={isMirrored ? 'Disable Mirror' : 'Enable Mirror'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isMirrored
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Display Area */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* HTML5 Video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          } ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Hand Landmark Overlay Canvas */}
        {canvasRef && (
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transition-transform duration-200 ${
              isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
            }`}
          />
        )}

        {/* Inactive Standby Screen */}
        {!isStreaming && !error && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Camera is off</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Start your webcam to begin real-time hand detection and continuous Indian Sign Language recognition.
            </p>
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Camera className="w-4 h-4" />
              Enable Camera
            </button>
          </div>
        )}

        {/* Error Screen */}
        {error && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-rose-300 mb-1">Camera Access Issue</h3>
            <p className="text-xs text-rose-200/70 mb-4 leading-relaxed">{error}</p>
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Injected Overlay (Status badge, bounding boxes, predictions) */}
        {children}
      </div>

      {/* Bottom controls bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-t border-slate-800/80">
        <span className="text-xs text-slate-500">
          {isStreaming ? 'WebRTC stream active (640x480 @ 30fps)' : 'Stream disconnected'}
        </span>

        {isStreaming && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
          >
            <CameraOff className="w-3.5 h-3.5" />
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
};
