export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export class CameraStreamManager {
  private stream: MediaStream | null = null;
  private currentDeviceId: string | null = null;

  public async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
    } catch (err) {
      console.warn('Unable to enumerate camera devices:', err);
      return [];
    }
  }

  public async startStream(
    videoElement: HTMLVideoElement,
    deviceId?: string,
    width = 640,
    height = 480
  ): Promise<MediaStream> {
    this.stopStream();

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: width }, height: { ideal: height } }
        : { facingMode: 'user', width: { ideal: width }, height: { ideal: height } },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.currentDeviceId = deviceId || null;

      videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(() => resolve()).catch(() => resolve());
        };
      });

      return stream;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera access was denied. Please allow camera permissions in your browser.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on your device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      }
      throw new Error(`Failed to access camera: ${error.message || 'Unknown error'}`);
    }
  }

  public stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  public getActiveStream(): MediaStream | null {
    return this.stream;
  }

  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }
}

export const cameraManager = new CameraStreamManager();
