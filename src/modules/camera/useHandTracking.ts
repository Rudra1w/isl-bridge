import { useState, useEffect, useRef, useCallback } from 'react';
import { cameraManager, CameraDeviceInfo } from './CameraStream';
import { landmarkExtractor } from '@/modules/isl-recognition/LandmarkExtractor';
import { HandLandmarks, Handedness } from '@/types/recognition';

export interface UseHandTrackingReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoElement: HTMLVideoElement | null;
  landmarks: HandLandmarks[];
  handsDetected: number;
  handedness: Handedness[];
  confidence: number;
  fps: number;
  isRunning: boolean;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  error: string | null;
  debugMode: boolean;
  setDebugMode: (debug: boolean) => void;
  devices: CameraDeviceInfo[];
  selectedDeviceId: string;
  switchCamera: (deviceId: string) => Promise<void>;
  isMirrored: boolean;
  setIsMirrored: (mirrored: boolean) => void;
}

export function useHandTracking(autoStart = false): UseHandTrackingReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<HandLandmarks[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Performance telemetry refs
  const animationFrameId = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(Date.now());
  const isLoopRunningRef = useRef<boolean>(false);

  // Load available camera devices on mount
  useEffect(() => {
    cameraManager.getAvailableCameras().then((devs) => {
      setDevices(devs);
      if (devs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devs[0].deviceId);
      }
    });
  }, [selectedDeviceId]);

  // Initialize MediaPipe landmark extractor
  useEffect(() => {
    landmarkExtractor.initialize().catch((err) => {
      console.warn('Vision initialization note:', err);
    });
  }, []);

  const stopCamera = useCallback(() => {
    isLoopRunningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    cameraManager.stopStream();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setIsRunning(false);
    setLandmarks([]);
    setConfidence(0);
    setFps(0);
  }, []);

  const startCamera = useCallback(async (deviceIdOverride?: string) => {
    if (!videoRef.current) return;
    setError(null);

    try {
      const devId = deviceIdOverride || selectedDeviceId || undefined;
      await cameraManager.startStream(videoRef.current, devId, 640, 480);
      setIsRunning(true);

      // Ensure extractor is ready
      if (!landmarkExtractor.isReady()) {
        await landmarkExtractor.initialize();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(msg);
      setIsRunning(false);
    }
  }, [selectedDeviceId]);

  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isRunning) {
      await startCamera(deviceId);
    }
  }, [isRunning, startCamera]);

  // Main Detection Loop
  useEffect(() => {
    if (!isRunning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isLoopRunningRef.current = true;

    const loop = () => {
      if (!isLoopRunningRef.current) return;

      if (video.readyState >= 2) {
        // Sync canvas resolution with actual video stream resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const now = performance.now();
        const detectedHands = landmarkExtractor.detectHands(video, now);

        // Update FPS calculation once per second
        frameCountRef.current++;
        const currentWallTime = Date.now();
        if (currentWallTime - lastFpsTimestampRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimestampRef.current = currentWallTime;
        }

        // Draw skeletons and bounding boxes
        landmarkExtractor.drawLandmarks(ctx, detectedHands, canvas.width, canvas.height, true);

        if (detectedHands.length > 0) {
          setLandmarks(detectedHands);
          // Average score across detected hands
          const avgScore =
            detectedHands.reduce((acc, h) => acc + h.score, 0) / detectedHands.length;
          setConfidence(avgScore);
        } else {
          setLandmarks([]);
          setConfidence(0);
        }
      }

      if (isLoopRunningRef.current) {
        animationFrameId.current = requestAnimationFrame(loop);
      }
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      isLoopRunningRef.current = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isRunning]);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  const handsDetected = landmarks.length;
  const handedness = landmarks.map((h) => h.handedness);

  return {
    videoRef,
    canvasRef,
    videoElement: videoRef.current,
    landmarks,
    handsDetected,
    handedness,
    confidence,
    fps,
    isRunning,
    startCamera,
    stopCamera,
    error,
    debugMode,
    setDebugMode,
    devices,
    selectedDeviceId,
    switchCamera,
    isMirrored,
    setIsMirrored,
  };
}
