import { useRef, useState, useEffect, useCallback } from 'react';
import { cameraManager, CameraDeviceInfo } from './CameraStream';

export function useCamera(autoStart = false) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Load available cameras
  useEffect(() => {
    cameraManager.getAvailableCameras().then((devs) => {
      setDevices(devs);
      if (devs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devs[0].deviceId);
      }
    });
  }, [selectedDeviceId]);

  const startCamera = useCallback(async (deviceIdOverride?: string) => {
    if (!videoRef.current) return;
    setError(null);
    try {
      const devId = deviceIdOverride || selectedDeviceId || undefined;
      await cameraManager.startStream(videoRef.current, devId);
      setIsStreaming(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera failed to start';
      setError(msg);
      setIsStreaming(false);
    }
  }, [selectedDeviceId]);

  const stopCamera = useCallback(() => {
    cameraManager.stopStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isStreaming) {
      await startCamera(deviceId);
    }
  }, [isStreaming, startCamera]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    videoRef,
    isStreaming,
    devices,
    selectedDeviceId,
    error,
    isMirrored,
    setIsMirrored,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
