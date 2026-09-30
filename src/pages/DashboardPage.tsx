import React, { useState, useEffect, useCallback } from 'react';
import { CameraPanel } from '@/components/dashboard/CameraPanel';
import { TranslationPanel, RecognitionHistoryItem } from '@/components/dashboard/TranslationPanel';
import { CommunicationPanel } from '@/components/dashboard/CommunicationPanel';
import { BottomToolbar } from '@/components/dashboard/BottomToolbar';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/dashboard/KeyboardShortcutsModal';
import { useHandTracking } from '@/modules/camera/useHandTracking';
import { useAccessibility } from '@/context/AccessibilityContext';
import { speechEngine } from '@/modules/speech/SpeechRecognitionEngine';
import { RecognitionState, SignPrediction } from '@/types/recognition';

interface DashboardPageProps {
  onOpenShortcuts: () => void;
  isSettingsOpen: boolean;
  isShortcutsOpen: boolean;
  onCloseSettings: () => void;
  onCloseShortcuts: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenShortcuts,
  isSettingsOpen,
  isShortcutsOpen,
  onCloseSettings,
  onCloseShortcuts,
}) => {
  const [recognitionHistory, setRecognitionHistory] = useState<RecognitionHistoryItem[]>([]);
  const [recognizedSentence, setRecognizedSentence] = useState<string[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const { speakText } = useAccessibility();

  // Hand Tracking & Computer Vision Hook
  const {
    videoRef,
    canvasRef,
    landmarks,
    handsDetected,
    handedness,
    confidence,
    fps,
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
    : 'tracking';

  // Live detection event update (real detection telemetry, no fake gesture hallucination)
  useEffect(() => {
    if (handsDetected > 0 && landmarks.length > 0) {
      const handsStr = handedness.join(' & ');
      const label = `${handsDetected} Hand${handsDetected > 1 ? 's' : ''} (${handsStr})`;
      const gloss = handsDetected === 2 ? 'BOTH-HANDS' : handedness[0] === 'Right' ? 'RIGHT-HAND' : 'LEFT-HAND';

      const prediction: SignPrediction = {
        signId: `detected-${handsDetected}-${Date.now()}`,
        label,
        gloss,
        confidence,
        timestamp: Date.now(),
        isFallback: false,
        notes: `MediaPipe Hands: 21 3D landmarks tracked for ${handsStr}`,
      };

      setCurrentPrediction(prediction);
    } else {
      setCurrentPrediction(null);
    }
  }, [handsDetected, handedness, confidence, landmarks.length]);

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
              isFallback={false}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={onCloseShortcuts}
      />
    </div>
  );
};
