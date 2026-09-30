import React, { useRef } from 'react';
import { useCamera } from '@/modules/camera/useCamera';
import { CameraView } from '@/modules/camera/CameraView';
import { useISLRecognition } from '@/modules/isl-recognition/useISLRecognition';
import { RecognitionStatusBadge } from '@/modules/isl-recognition/RecognitionStatusBadge';
import { SpeechInputPanel } from '@/modules/speech/SpeechInputPanel';
import { useISLGloss } from '@/modules/nlp/useISLGloss';
import { SignPlayer } from '@/modules/sign-output/SignPlayer';
import { Volume2, Delete, RotateCcw, ArrowLeftRight, User, Ear } from 'lucide-react';

export const TwoWayPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Deaf User / Sign side
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
    clearSentence,
    removeLastWord,
    speakSentence,
    classifierInfo,
  } = useISLRecognition({
    videoRef,
    canvasRef,
    isStreaming,
  });

  // Hearing User / Speech side
  const { result: glossResult, translate: translateToGloss } = useISLGloss();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Two-Way ISL Communication Bridge</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous real-time dialogue between a Deaf/Signing individual and a Spoken English speaker.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Signer (Camera)</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-slate-600" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Ear className="w-4 h-4 text-emerald-400" />
            <span>Speaker (Mic)</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* PANEL 1: Deaf User / Signing Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Side 1: ISL Signer → Speech / Text
            </h2>
            <span className="text-[11px] text-slate-400">Webcam continuous stream</span>
          </div>

          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreaming={isStreaming}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            isMirrored={isMirrored}
            error={cameraError}
            onStart={startCamera}
            onStop={stopCamera}
            onSwitchDevice={switchCamera}
            onToggleMirror={() => setIsMirrored(!isMirrored)}
          >
            {isStreaming && (
              <div className="absolute top-3 right-3 z-20 max-w-[260px]">
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

          {/* Recognized Output Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Recognized English Output
              </div>
              <div className="text-sm font-medium text-slate-100 min-h-[48px] flex flex-wrap gap-1.5">
                {recognizedSentence.length > 0 ? (
                  recognizedSentence.map((w, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No gestures recognized yet</span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={removeLastWord}
                  disabled={recognizedSentence.length === 0}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                  title="Delete last"
                >
                  <Delete className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={clearSentence}
                  disabled={recognizedSentence.length === 0}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                  title="Clear"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={speakSentence}
                disabled={recognizedSentence.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-40 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Speak for Signer
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 2: Hearing User / Speech to ISL Sign Player */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Side 2: Spoken Speech → ISL Visual Signs
            </h2>
            <span className="text-[11px] text-slate-400">Audio microphone</span>
          </div>

          {/* Speech Panel */}
          <SpeechInputPanel
            onTranscriptChange={(speechText) => {
              translateToGloss(speechText);
            }}
          />

          {/* Visual Sign Player Output */}
          <SignPlayer translationResult={glossResult} />
        </div>
      </div>
    </div>
  );
};
