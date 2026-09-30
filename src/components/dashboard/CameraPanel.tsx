import React, { useRef, useState } from 'react';
import { Camera, CameraOff, Maximize2, Minimize2, FlipHorizontal, Activity, Hand, AlertCircle, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatConfidence } from '@/utils/formatters';
import { RecognitionState, SignPrediction, HandLandmarks } from '@/types/recognition';
import { CameraDeviceInfo } from '@/modules/camera/CameraStream';

interface CameraPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  devices: CameraDeviceInfo[];
  selectedDeviceId: string;
  isMirrored: boolean;
  error: string | null;
  recognitionState: RecognitionState;
  activeHands: HandLandmarks[];
  currentPrediction: SignPrediction | null;
  confidence: number;
  fps: number;
  isFallback: boolean;
  onStart: () => void;
  onStop: () => void;
  onSwitchDevice: (deviceId: string) => void;
  onToggleMirror: () => void;
  className?: string;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  videoRef,
  canvasRef,
  isStreaming,
  devices,
  selectedDeviceId,
  isMirrored,
  error,
  recognitionState,
  activeHands,
  currentPrediction,
  confidence,
  fps,
  isFallback,
  onStart,
  onStop,
  onSwitchDevice,
  onToggleMirror,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  return (
    <Card ref={containerRef} className={`flex flex-col h-full border-slate-800 ${className}`}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Live ISL Camera Feed</CardTitle>
            <span className="text-[11px] text-slate-400">Continuous 3D Hand Landmarks</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSwitchDevice(e.target.value)}
              aria-label="Select camera device"
              className="bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
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
            title={isMirrored ? 'Disable Mirroring' : 'Enable Mirroring'}
            aria-label="Toggle camera mirroring"
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isMirrored
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle fullscreen video mode"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      {/* Main Video Viewport */}
      <div className="relative aspect-[4/3] sm:aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
        {/* Native Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          } ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* MediaPipe Skeletal Landmark Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* State: Camera Off */}
        {!isStreaming && !error && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-xs animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-xl">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Webcam Inactive</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Start your webcam to extract hand landmarks and recognize Indian Sign Language.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={onStart}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Start Camera
            </Button>
          </div>
        )}

        {/* State: Camera Error */}
        {error && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-rose-300 mb-1">Camera Notice</h4>
            <p className="text-xs text-rose-200/80 mb-4 leading-relaxed">{error}</p>
            <Button variant="secondary" size="sm" onClick={onStart}>
              Retry Camera
            </Button>
          </div>
        )}

        {/* State Overlays when Camera is Streaming */}
        {isStreaming && (
          <>
            {/* Top-Left Telemetry Pill */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300">
                <Activity className="w-3 h-3 text-indigo-400" />
                {fps} FPS
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300">
                <Hand className="w-3 h-3 text-emerald-400" />
                {activeHands.length} Hand{activeHands.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Top-Right Status Badge */}
            <div className="absolute top-3 right-3 z-20">
              {recognitionState === 'starting' && (
                <Badge variant="warning" size="sm" dot pulse>
                  Starting Vision...
                </Badge>
              )}
              {recognitionState === 'recognizing' && (
                <Badge variant="success" size="sm" dot>
                  Sign Recognized
                </Badge>
              )}
              {recognitionState === 'tracking' && (
                <Badge variant="info" size="sm" dot pulse>
                  Detecting...
                </Badge>
              )}
              {recognitionState === 'no_hands' && (
                <Badge variant="neutral" size="sm" dot>
                  No hand detected
                </Badge>
              )}
            </div>

            {/* Center Overlay if NO hands are detected */}
            {recognitionState === 'no_hands' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-slate-950/20 backdrop-blur-[1px]">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center shadow-xl">
                  <Eye className="w-5 h-5 text-slate-400 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-200">No hands detected</p>
                  <p className="text-[10px] text-slate-400">Position hands inside camera frame</p>
                </div>
              </div>
            )}

            {/* Bottom Floating Recognition Card */}
            {currentPrediction && (
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800/90 shadow-2xl">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Recognized Sign
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-extrabold text-white font-mono">
                      {currentPrediction.label}
                    </span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">
                      [{currentPrediction.gloss}]
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatConfidence(confidence)}
                  </span>
                  <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                      style={{ width: `${Math.round(confidence * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Controls & Model Provenance */}
      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Button
              variant="danger"
              size="md"
              onClick={onStop}
              leftIcon={<CameraOff className="w-4 h-4" />}
            >
              Stop Camera
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onStart}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Start Camera
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 flex-1">
          <div className="flex items-center gap-1.5">
            {isFallback ? (
              <span className="flex items-center gap-1 text-amber-400/90 text-[11px] font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Geometric Landmark Heuristic
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Active Classifier
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            MediaPipe Hands
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};
