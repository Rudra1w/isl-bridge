import React, { useState, useEffect, useCallback } from 'react';
import { CameraPanel } from '@/components/dashboard/CameraPanel';
import { TranslationPanel, RecognitionHistoryItem } from '@/components/dashboard/TranslationPanel';
import { CommunicationPanel } from '@/components/dashboard/CommunicationPanel';
import { BottomToolbar } from '@/components/dashboard/BottomToolbar';
import { useHandTracking } from '@/modules/camera/useHandTracking';
import { useAccessibility } from '@/context/AccessibilityContext';
import { speechEngine } from '@/modules/speech/SpeechRecognitionEngine';
import { tfjsISLRecognizer } from '@/modules/isl-recognition/TensorFlowISLRecognizer';
import { TemporalSmoother } from '@/modules/isl-recognition/TemporalSmoother';
import { LandmarkRecorderModal } from '@/components/dashboard/LandmarkRecorderModal';
import { RecognitionState, SignPrediction } from '@/types/recognition';

interface DashboardPageProps {
  onOpenShortcuts: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenShortcuts,
}) => {
  const [recognitionHistory, setRecognitionHistory] = useState<RecognitionHistoryItem[]>([]);
  const [recognizedSentence, setRecognizedSentence] = useState<string[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<string>('uninitialized');
  const { speakText } = useAccessibility();

  // Smoother instance and inference concurrency lock
  const smootherRef = React.useRef(new TemporalSmoother({
    confidenceThreshold: 0.70,
    requiredConsecutiveFrames: 6,
    cooldownMs: 1200,
  }));
  const isPredictingRef = React.useRef<boolean>(false);

  // Initialize TensorFlow.js ISL Classifier on mount
  useEffect(() => {
    let isMounted = true;
    tfjsISLRecognizer.initialize().then(() => {
      if (isMounted) {
        setModelStatus(tfjsISLRecognizer.status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Hand Tracking & Computer Vision Hook
  const {
    videoRef,
    canvasRef,
    landmarks,
    handsDetected,
    handedness: _handedness,
    confidence,
    fps,
    inferenceFps,
    inferenceLatencyMs,
    isRunning,
    startCamera,
    stopCamera,
    error: cameraError,
    debugMode,
    setDebugMode,
    devices,
    selectedDeviceId,
    switchCamera,
    isMirrored,
    setIsMirrored,
  } = useHandTracking(false);

  // Derive detection / recognition state without fake AI claims
  const recognitionState: RecognitionState = !isRunning
    ? 'idle'
    : cameraError
    ? 'error'
    : handsDetected === 0
    ? 'no_hands'
    : currentPrediction
    ? 'recognizing'
    : 'tracking';

  // Run feature extraction and classification whenever new landmarks arrive
  useEffect(() => {
    if (landmarks.length === 0) {
      smootherRef.current.process(null);
      setCurrentPrediction(null);
      return;
    }

    let isMounted = true;

    const runRecognition = async () => {
      if (isPredictingRef.current) return;
      isPredictingRef.current = true;

      try {
        const rawPred = await tfjsISLRecognizer.predict({
          hands: landmarks,
          timestamp: Date.now(),
        });

        if (!isMounted) return;

        const { stablePrediction, shouldCommit, committedWord } = smootherRef.current.process(rawPred);

        if (stablePrediction) {
          setCurrentPrediction({
            signId: `sign-${stablePrediction.label}-${stablePrediction.timestamp}`,
            label: stablePrediction.label,
            gloss: stablePrediction.gloss,
            confidence: stablePrediction.confidence,
            timestamp: stablePrediction.timestamp,
            isFallback: stablePrediction.isFallback,
            modelType: stablePrediction.modelType,
            notes: stablePrediction.notes,
          });
        } else {
          setCurrentPrediction(null);
        }

        if (shouldCommit && committedWord) {
          setRecognizedSentence((prev) => [...prev, committedWord]);
          setRecognitionHistory((prev) => [
            {
              id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              signId: `sign-${committedWord}`,
              label: committedWord,
              gloss: committedWord.toUpperCase().replace(/\s+/g, '-'),
              confidence: stablePrediction ? stablePrediction.confidence : 0.85,
              timestamp: new Date(),
            },
            ...prev.slice(0, 49),
          ]);
        }
      } catch (err) {
        console.warn('[ISL Recognition] Inference frame exception:', err);
      } finally {
        isPredictingRef.current = false;
      }
    };

    runRecognition();

    return () => {
      isMounted = false;
    };
  }, [landmarks]);

  const clearSentence = useCallback(() => {
    setRecognizedSentence([]);
  }, []);

  const removeLastWord = useCallback(() => {
    setRecognizedSentence((prev) => prev.slice(0, -1));
  }, []);

  const currentSentenceString = recognizedSentence.join(' ');

  const speakSentence = useCallback(() => {
    if (currentSentenceString) {
      speakText(currentSentenceString);
    }
  }, [currentSentenceString, speakText]);

  const handleClearAllConversation = useCallback(() => {
    clearSentence();
    speechEngine.clear();
    setRecognitionHistory([]);
    setCurrentPrediction(null);
  }, [clearSentence]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if user is typing into input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key;

      if (key === 'c' || key === 'C') {
        e.preventDefault();
        if (isRunning) stopCamera();
        else startCamera();
      } else if (key === ' ') {
        e.preventDefault();
        const state = speechEngine.getState();
        if (state.isListening) speechEngine.stop();
        else speechEngine.start();
      } else if (key === 's' || key === 'S') {
        e.preventDefault();
        if (currentSentenceString) {
          speakText(currentSentenceString);
        }
      } else if (key === 'z' || key === 'Z') {
        e.preventDefault();
        removeLastWord();
      } else if (key === 'x' || key === 'X') {
        e.preventDefault();
        clearSentence();
      } else if (key === '?') {
        e.preventDefault();
        onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isRunning,
    startCamera,
    stopCamera,
    currentSentenceString,
    speakText,
    removeLastWord,
    clearSentence,
    onOpenShortcuts,
  ]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between">
      {/* Main 3-Column / Modular Grid */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: LIVE CAMERA PANEL (4 cols) ================= */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
            <CameraPanel
              videoRef={videoRef}
              canvasRef={canvasRef}
              isStreaming={isRunning}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              isMirrored={isMirrored}
              error={cameraError}
              recognitionState={recognitionState}
              activeHands={landmarks}
              currentPrediction={currentPrediction}
              confidence={confidence}
              fps={fps}
              inferenceFps={inferenceFps}
              inferenceLatencyMs={inferenceLatencyMs}
              isFallback={currentPrediction?.isFallback ?? false}
              modelStatus={
                modelStatus === 'ready'
                  ? 'TF.js Neural Model (Active)'
                  : modelStatus === 'loading'
                  ? 'Loading Model...'
                  : 'Demo Geometric Heuristic'
              }
              onOpenRecorder={() => setIsRecorderOpen(true)}
              debugMode={debugMode}
              onToggleDebug={() => setDebugMode(!debugMode)}
              onStart={startCamera}
              onStop={stopCamera}
              onSwitchDevice={switchCamera}
              onToggleMirror={() => setIsMirrored(!isMirrored)}
            />
          </div>

          {/* ================= CENTER COLUMN: TRANSLATION PANEL (4 cols) ================= */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
            <TranslationPanel
              currentSign={currentPrediction}
              recognizedSentence={recognizedSentence}
              recognitionHistory={recognitionHistory}
              onClear={clearSentence}
              onUndo={removeLastWord}
              onSpeak={speakSentence}
            />
          </div>

          {/* ================= RIGHT COLUMN: COMMUNICATION PANEL (4 cols) ================= */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
            <CommunicationPanel />
          </div>
        </div>
      </div>

      {/* Bottom Accessible Toolbar */}
      <BottomToolbar
        currentSentence={currentSentenceString}
        onClearConversation={handleClearAllConversation}
        onOpenShortcuts={onOpenShortcuts}
      />

      {/* Landmark Recorder Modal for Dataset Collection */}
      <LandmarkRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        activeHands={landmarks}
      />
    </div>
  );
};
