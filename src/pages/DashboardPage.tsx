import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraPanel } from '@/components/dashboard/CameraPanel';
import { TranslationPanel, RecognitionHistoryItem } from '@/components/dashboard/TranslationPanel';
import { CommunicationPanel } from '@/components/dashboard/CommunicationPanel';
import { BottomToolbar } from '@/components/dashboard/BottomToolbar';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/dashboard/KeyboardShortcutsModal';
import { useCamera } from '@/modules/camera/useCamera';
import { useISLRecognition } from '@/modules/isl-recognition/useISLRecognition';
import { useAccessibility } from '@/context/AccessibilityContext';
import { speechEngine } from '@/modules/speech/SpeechRecognitionEngine';

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recognitionHistory, setRecognitionHistory] = useState<RecognitionHistoryItem[]>([]);
  const { speakText } = useAccessibility();

  // Camera Hook
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

  // ISL Recognition Hook
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

  // Track historical recognition events
  useEffect(() => {
    if (currentPrediction) {
      setRecognitionHistory((prev) => {
        // Prevent duplicate consecutive entries with identical sign within 1.5 seconds
        const last = prev[0];
        if (last && last.signId === currentPrediction.signId && Date.now() - last.timestamp.getTime() < 1500) {
          return prev;
        }
        const item: RecognitionHistoryItem = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          signId: currentPrediction.signId,
          label: currentPrediction.label,
          gloss: currentPrediction.gloss,
          confidence: currentPrediction.confidence,
          timestamp: new Date(),
        };
        return [item, ...prev].slice(0, 30);
      });
    }
  }, [currentPrediction]);

  const currentSentenceString = recognizedSentence.join(' ');

  const handleClearAllConversation = useCallback(() => {
    clearSentence();
    speechEngine.clear();
    setRecognitionHistory([]);
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
        if (isStreaming) stopCamera();
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
    isStreaming,
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
              isStreaming={isStreaming}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              isMirrored={isMirrored}
              error={cameraError || recognitionError}
              recognitionState={recognitionState}
              activeHands={activeHands}
              currentPrediction={currentPrediction}
              confidence={confidence}
              fps={fps}
              isFallback={classifierInfo.isFallback}
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
