import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { landmarkExtractor } from './LandmarkExtractor';
import { fallbackClassifier } from './RuleBasedClassifierFallback';
import { IISLClassifier } from './ISLClassifier';
import { RecognitionState, SignPrediction, HandLandmarks } from '@/types/recognition';
import { isFeatureEnabled } from '@/config/featureFlags';

interface UseISLRecognitionProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  activeClassifier?: IISLClassifier;
}

export function useISLRecognition({
  videoRef,
  canvasRef,
  isStreaming,
  activeClassifier = fallbackClassifier,
}: UseISLRecognitionProps) {
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [activeHands, setActiveHands] = useState<HandLandmarks[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [recognizedSentence, setRecognizedSentence] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Debouncing / stability refs
  const candidateRef = useRef<{ sign: SignPrediction; count: number } | null>(null);
  const lastCommittedSignRef = useRef<string | null>(null);
  const lastCommitTimeRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(Date.now());

  // Initialize MediaPipe landmark extractor
  useEffect(() => {
    let isCancelled = false;

    if (isFeatureEnabled('enableSignRecognition')) {
      setRecognitionState('starting');
      landmarkExtractor
        .initialize()
        .then(() => {
          if (!isCancelled) {
            setRecognitionState('idle');
            setError(null);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.warn('MediaPipe initialization notice:', err);
            // Even if GPU/WASM fails, state is set so user knows
            setRecognitionState('error');
            setError(err instanceof Error ? err.message : 'Failed to initialize vision engine');
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Main Recognition & Drawing Loop
  useEffect(() => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      setActiveHands([]);
      setCurrentPrediction(null);
      setConfidence(0);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning) return;

      if (video.readyState >= 2 && ctx) {
        // Sync canvas internal resolution with video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const now = performance.now();
        const detectedHands = landmarkExtractor.detectHands(video, now);

        // Update FPS counter
        frameCountRef.current++;
        const currentWallTime = Date.now();
        if (currentWallTime - lastFpsTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = currentWallTime;
        }

        // Draw skeletons on canvas
        landmarkExtractor.drawLandmarks(ctx, detectedHands, canvas.width, canvas.height);
        setActiveHands(detectedHands);

        if (detectedHands.length === 0) {
          setRecognitionState('no_hands');
          setCurrentPrediction(null);
          setConfidence(0);
          candidateRef.current = null;
        } else {
          setRecognitionState('tracking');

          // Run classification on detected landmarks
          const prediction = await activeClassifier.classify(detectedHands);

          if (prediction) {
            setRecognitionState('recognizing');
            setCurrentPrediction(prediction);
            setConfidence(prediction.confidence);

            // Stability check: sign must be held for 5 consecutive frame cycles (~150ms)
            if (candidateRef.current && candidateRef.current.sign.signId === prediction.signId) {
              candidateRef.current.count++;

              // Commit if held stably and not immediately repeated within 1.2 seconds
              if (
                candidateRef.current.count >= 6 &&
                (lastCommittedSignRef.current !== prediction.signId ||
                  Date.now() - lastCommitTimeRef.current > 1200)
              ) {
                setRecognizedSentence((prev) => [...prev, prediction.label]);
                lastCommittedSignRef.current = prediction.signId;
                lastCommitTimeRef.current = Date.now();
                candidateRef.current = null;
              }
            } else {
              candidateRef.current = { sign: prediction, count: 1 };
            }
          } else {
            setCurrentPrediction(null);
            setConfidence(0);
            candidateRef.current = null;
          }
        }
      }

      if (isRunning) {
        animationFrameId.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isStreaming, videoRef, canvasRef, activeClassifier]);

  const clearSentence = useCallback(() => {
    setRecognizedSentence([]);
    lastCommittedSignRef.current = null;
  }, []);

  const removeLastWord = useCallback(() => {
    setRecognizedSentence((prev) => prev.slice(0, -1));
  }, []);

  const speakSentence = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    const text = recognizedSentence.join(' ');
    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [recognizedSentence]);

  return {
    recognitionState,
    activeHands,
    currentPrediction,
    recognizedSentence,
    confidence,
    fps,
    error,
    clearSentence,
    removeLastWord,
    speakSentence,
    classifierInfo: {
      id: activeClassifier.id,
      name: activeClassifier.name,
      version: activeClassifier.version,
      isFallback: activeClassifier.isFallbackClassifier,
    },
  };
}
