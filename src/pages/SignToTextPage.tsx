import React, { useRef, useState } from 'react';
import { useCamera } from '@/modules/camera/useCamera';
import { CameraView } from '@/modules/camera/CameraView';
import { useISLRecognition } from '@/modules/isl-recognition/useISLRecognition';
import { RecognitionStatusBadge } from '@/modules/isl-recognition/RecognitionStatusBadge';
import { Volume2, Copy, Check, Delete, RotateCcw, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { StorageService } from '@/services/storageService';

export const SignToTextPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const {
    videoRef,
    isStreaming,
    devices,
    selectedDeviceId,
    isMirrored,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    setIsMirrored,
  } = useCamera(false);

  const {
    recognitionState,
    activeHands,
    currentPrediction,
    recognizedSentence,
    confidence,
    fps,
    error: recognitionError,
    clearSentence,
    removeLastWord,
    speakSentence,
    classifierInfo,
  } = useISLRecognition({
    videoRef,
    canvasRef,
    isStreaming,
  });

  const fullSentence = recognizedSentence.join(' ');

  const handleCopy = () => {
    if (!fullSentence) return;
    navigator.clipboard.writeText(fullSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);

    StorageService.addHistory({
      type: 'sign-to-text',
      input: `${recognizedSentence.length} signs`,
      output: fullSentence,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Live ISL Sign → Text Recognition
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform Indian Sign Language gestures in front of the webcam. Landmarks are tracked in 3D and translated to text.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Feed & Landmarks */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreaming={isStreaming}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            isMirrored={isMirrored}
            error={cameraError || recognitionError}
            onStart={startCamera}
            onStop={stopCamera}
            onSwitchDevice={switchCamera}
            onToggleMirror={() => setIsMirrored(!isMirrored)}
          >
            {/* Top Right Live Overlay Pill */}
            {isStreaming && (
              <div className="absolute top-4 right-4 z-20 max-w-xs">
                <RecognitionStatusBadge
                  state={recognitionState}
                  handsCount={activeHands.length}
                  prediction={currentPrediction}
                  confidence={confidence}
                  fps={fps}
                  isFallback={classifierInfo.isFallback}
                />
              </div>
            )}
          </CameraView>

          {/* Model Integrity Note */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Classifier Architecture: </span>
              {classifierInfo.name} ({classifierInfo.version}). Operating via 21 3D hand landmarks. Plug-and-play architecture ready for user-trained deep learning checkpoints.
            </div>
          </div>
        </div>

        {/* Right Column: Sentence Accumulator & Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Main Sentence Accumulator Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-sm text-slate-100">Recognized Translation</h2>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {recognizedSentence.length} word{recognizedSentence.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Text Display Canvas */}
              <div className="min-h-[140px] p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-start content-start gap-2">
                {recognizedSentence.length > 0 ? (
                  recognizedSentence.map((word, idx) => (
                    <span
                      key={`${word}-${idx}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-base font-medium animate-in fade-in zoom-in-95 duration-150"
                    >
                      {word}
                    </span>
                  ))
                ) : (
                  <div className="w-full h-28 flex flex-col items-center justify-center text-slate-600 text-xs text-center select-none">
                    <span>Signs performed in front of camera will accumulate here</span>
                    <span className="text-[10px] text-slate-500 mt-1">Try signing: "Hello", "Namaste", or counting "One, Two"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={removeLastWord}
                    disabled={recognizedSentence.length === 0}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Delete last word"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearSentence}
                    disabled={recognizedSentence.length === 0}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    title="Clear sentence"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={speakSentence}
                    disabled={!fullSentence}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    Speak
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!fullSentence}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-xs text-slate-400 space-y-2">
            <h3 className="font-semibold text-slate-200">Tips for Best Hand Recognition</h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Keep hands within the upper center of the camera frame.</li>
              <li>Ensure good lighting without harsh glare or backlighting.</li>
              <li>Hold each gesture steadily for ~0.3s to avoid accidental triggering.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
