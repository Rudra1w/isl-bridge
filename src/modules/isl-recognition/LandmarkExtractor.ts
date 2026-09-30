import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks, Point3D, BoundingBox, Handedness } from '@/types/recognition';

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
  private lastVideoTime = -1;
  private lastProcessedTimestamp = 0;

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

  /**
   * Normalizes hand coordinates:
   * 1. Translates wrist (P0) to (0,0,0)
   * 2. Scales relative to palm scale (distance from wrist P0 to middle finger MCP P9)
   * This yields position- and scale-invariant coordinates.
   */
  public normalizeLandmarks(rawPoints: Point3D[]): Point3D[] {
    if (rawPoints.length < 21) return rawPoints;

    const wrist = rawPoints[0];
    const middleMcp = rawPoints[9];

    // Reference scale: distance between wrist and middle MCP
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    const dz = middleMcp.z - wrist.z;
    const palmScale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;

    return rawPoints.map((pt) => ({
      x: (pt.x - wrist.x) / palmScale,
      y: (pt.y - wrist.y) / palmScale,
      z: (pt.z - wrist.z) / palmScale,
    }));
  }

  /**
   * Calculates hand bounding box with padding
   */
  public computeBoundingBox(rawPoints: Point3D[]): BoundingBox {
    let xMin = 1.0;
    let yMin = 1.0;
    let xMax = 0.0;
    let yMax = 0.0;

    for (let i = 0; i < rawPoints.length; i++) {
      const pt = rawPoints[i];
      if (pt.x < xMin) xMin = pt.x;
      if (pt.x > xMax) xMax = pt.x;
      if (pt.y < yMin) yMin = pt.y;
      if (pt.y > yMax) yMax = pt.y;
    }

    // Add 8% margin
    const padX = (xMax - xMin) * 0.08;
    const padY = (yMax - yMin) * 0.08;

    xMin = Math.max(0, xMin - padX);
    yMin = Math.max(0, yMin - padY);
    xMax = Math.min(1, xMax + padX);
    yMax = Math.min(1, yMax + padY);

    return {
      xMin,
      yMin,
      xMax,
      yMax,
      width: xMax - xMin,
      height: yMax - yMin,
    };
  }

  /**
   * Processes a video frame and extracts 21 3D landmarks for up to 2 hands.
   */
  public detectHands(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarks[] {
    if (!this.handLandmarker) return [];
    if (videoElement.readyState < 2) return [];

    // Ensure timestamp is strictly increasing for MediaPipe VIDEO mode
    const now = Math.max(timestampMs, this.lastProcessedTimestamp + 1);
    this.lastProcessedTimestamp = now;

    // Skip redundant inference if video frame has not changed
    if (videoElement.currentTime === this.lastVideoTime) {
      return [];
    }
    this.lastVideoTime = videoElement.currentTime;

    try {
      const results = this.handLandmarker.detectForVideo(videoElement, now);
      if (!results.landmarks || results.landmarks.length === 0) {
        return [];
      }

      return results.landmarks.map((landmarkList, idx) => {
        const handednessCategory = results.handednesses?.[idx]?.[0];
        const handednessStr = handednessCategory?.categoryName || 'Right';
        const handedness: Handedness = handednessStr.toLowerCase().includes('left') ? 'Left' : 'Right';
        const score = handednessCategory?.score ?? 0.85;

        const points: Point3D[] = landmarkList.map((pt) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z ?? 0,
        }));

        const normalizedLandmarks = this.normalizeLandmarks(points);
        const boundingBox = this.computeBoundingBox(points);

        return {
          handIndex: idx,
          handedness,
          landmarks: points,
          normalizedLandmarks,
          boundingBox,
          score,
          timestamp: Date.now(),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Draws hand skeletons, keypoints, bounding boxes, and handedness labels on the overlay canvas.
   */
  public drawLandmarks(
    ctx: CanvasRenderingContext2D,
    hands: HandLandmarks[],
    width: number,
    height: number,
    drawBoundingBox = true
  ): void {
    ctx.clearRect(0, 0, width, height);

    for (const hand of hands) {
      const isRight = hand.handedness === 'Right';
      const primaryColor = isRight ? '#6366f1' : '#10b981'; // Indigo for Right, Emerald for Left
      const boneColor = isRight ? 'rgba(99, 102, 241, 0.75)' : 'rgba(16, 185, 129, 0.75)';

      // 1. Draw Bounding Box and Handedness Label
      if (drawBoundingBox && hand.boundingBox) {
        const bb = hand.boundingBox;
        const bx = bb.xMin * width;
        const by = bb.yMin * height;
        const bw = bb.width * width;
        const bh = bb.height * height;

        ctx.strokeStyle = isRight ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.setLineDash([]);

        // Label Tag
        const label = `${hand.handedness} Hand (${Math.round(hand.score * 100)}%)`;
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = isRight ? 'rgba(99, 102, 241, 0.85)' : 'rgba(16, 185, 129, 0.85)';
        ctx.beginPath();
        const tagY = Math.max(16, by - 6);
        ctx.roundRect ? ctx.roundRect(bx, tagY - 14, textWidth + 12, 18, 4) : ctx.rect(bx, tagY - 14, textWidth + 12, 18);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, bx + 6, tagY);
      }

      // 2. Draw Skeletal Connections (Bones)
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

      // 3. Draw Joints (Landmarks)
      for (let i = 0; i < hand.landmarks.length; i++) {
        const pt = hand.landmarks[i];
        const cx = pt.x * width;
        const cy = pt.y * height;
        const isFingertip = [4, 8, 12, 16, 20].includes(i);
        const isWrist = i === 0;

        ctx.beginPath();
        ctx.arc(cx, cy, isFingertip ? 5.5 : isWrist ? 6 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = isFingertip ? '#facc15' : isWrist ? '#ffffff' : primaryColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#090d16';
        ctx.stroke();
      }
    }
  }

  public dispose(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // ignore
      }
      this.handLandmarker = null;
    }
    this.lastVideoTime = -1;
  }
}

export const landmarkExtractor = new LandmarkExtractor();
