import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks, Point3D } from '@/types/recognition';

// MediaPipe 21 Hand Landmark skeletal connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base cross-links
  [5, 9], [9, 13], [13, 17]
];

export class LandmarkExtractor {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private initializationError: string | null = null;

  public async initialize(): Promise<void> {
    if (this.handLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    this.initializationError = null;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (err: unknown) {
      console.warn('GPU delegate failed or CDN unreachable, attempting CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch (cpuErr: unknown) {
        const msg = cpuErr instanceof Error ? cpuErr.message : 'Failed to initialize MediaPipe HandLandmarker';
        this.initializationError = msg;
        throw new Error(msg);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  public isReady(): boolean {
    return this.handLandmarker !== null;
  }

  public getError(): string | null {
    return this.initializationError;
  }

  public detectHands(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarks[] {
    if (!this.handLandmarker) return [];
    if (videoElement.readyState < 2) return [];

    try {
      const results = this.handLandmarker.detectForVideo(videoElement, timestampMs);
      if (!results.landmarks || results.landmarks.length === 0) {
        return [];
      }

      return results.landmarks.map((landmarkList, idx) => {
        const handednessStr = results.handednesses?.[idx]?.[0]?.categoryName || 'Right';
        const handedness = handednessStr.toLowerCase().includes('left') ? 'Left' : 'Right';
        const score = results.handednesses?.[idx]?.[0]?.score ?? 0.8;

        const points: Point3D[] = landmarkList.map((pt) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z ?? 0,
        }));

        return {
          handedness,
          landmarks: points,
          score,
        };
      });
    } catch (err) {
      // In video stream mode, timestamp must be monotonically increasing
      return [];
    }
  }

  public drawLandmarks(
    ctx: CanvasRenderingContext2D,
    hands: HandLandmarks[],
    width: number,
    height: number
  ): void {
    ctx.clearRect(0, 0, width, height);

    for (const hand of hands) {
      const isRight = hand.handedness === 'Right';
      const jointColor = isRight ? '#6366f1' : '#ec4899';
      const boneColor = isRight ? 'rgba(99, 102, 241, 0.7)' : 'rgba(236, 72, 153, 0.7)';

      // Draw bones (connections)
      ctx.lineWidth = 3;
      ctx.strokeStyle = boneColor;

      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const p1 = hand.landmarks[startIdx];
        const p2 = hand.landmarks[endIdx];

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }

      // Draw joints (landmarks)
      for (let i = 0; i < hand.landmarks.length; i++) {
        const pt = hand.landmarks[i];
        const cx = pt.x * width;
        const cy = pt.y * height;
        const isFingertip = [4, 8, 12, 16, 20].includes(i);

        ctx.beginPath();
        ctx.arc(cx, cy, isFingertip ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isFingertip ? '#facc15' : jointColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }
  }

  public dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}

export const landmarkExtractor = new LandmarkExtractor();
