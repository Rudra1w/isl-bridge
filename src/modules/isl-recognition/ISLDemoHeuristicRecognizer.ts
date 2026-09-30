import {
  ISLRecognizer,
  HandLandmarkFrame,
  TemporalSequenceFrame,
  Prediction,
  ModelType,
  ModelStatus,
  Point3D,
} from '@/types/recognition';

/**
 * ISL Geometric Demo Baseline Recognizer
 *
 * TRANSPARENCY NOTICE:
 * This is an uncalibrated geometric heuristic baseline designed as a fallback
 * when a trained TensorFlow.js neural checkpoint is not mounted in /public/models/isl-classifier/.
 *
 * It evaluates actual anatomical finger extension angles and hand proximity.
 * It is explicitly tagged with `modelType: 'demo-heuristic'` and `isFallback: true`.
 * It returns null for intermediate/resting hand poses to avoid false positive hallucination.
 */
export class ISLDemoHeuristicRecognizer implements ISLRecognizer {
  public readonly id = 'demo-heuristic-baseline-v1';
  public readonly name = 'ISL Geometric Demo Baseline (Uncalibrated)';
  public readonly version = '1.0.0-demo';
  public readonly modelType: ModelType = 'demo-heuristic';
  public status: ModelStatus = 'ready';

  public readonly supportedSigns: string[] = [
    'NAMASTE',
    'HELLO',
    'YES',
    'NO',
    'YOU',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'FIST',
  ];

  public get isReady(): boolean {
    return true;
  }

  public async initialize(): Promise<void> {
    this.status = 'ready';
  }

  public dispose(): void {
    // No-op for heuristic engine
  }

  public async predict(
    input: HandLandmarkFrame | TemporalSequenceFrame
  ): Promise<Prediction | null> {
    const frame: HandLandmarkFrame = 'frames' in input
      ? input.frames[input.frames.length - 1] // Take latest frame if sequence
      : input;

    const hands = frame.hands;
    if (!hands || hands.length === 0) {
      return null;
    }

    const now = frame.timestamp || Date.now();

    // 1. Two-Handed Gesture Check: NAMASTE
    if (hands.length === 2) {
      const leftWrist = hands.find((h) => h.handedness === 'Left')?.landmarks[0];
      const rightWrist = hands.find((h) => h.handedness === 'Right')?.landmarks[0];

      if (leftWrist && rightWrist) {
        const dist = this.euclideanDistance(leftWrist, rightWrist);
        // Palms aligned centrally in front of torso
        if (dist < 0.22 && Math.abs(leftWrist.y - rightWrist.y) < 0.12) {
          return {
            label: 'Namaste',
            gloss: 'NAMASTE',
            confidence: 0.88,
            timestamp: now,
            isFallback: true,
            modelType: 'demo-heuristic',
            notes: 'Two-handed heuristic: Palms touching/aligned centrally.',
          };
        }
      }
    }

    // 2. Single-Handed Gesture Analysis on primary hand
    const primaryHand = hands[0];
    const lm = primaryHand.landmarks;

    const thumbExtended = this.isThumbExtended(lm);
    const indexExtended = this.isFingerExtended(lm, 8, 6, 5);
    const middleExtended = this.isFingerExtended(lm, 12, 10, 9);
    const ringExtended = this.isFingerExtended(lm, 16, 14, 13);
    const pinkyExtended = this.isFingerExtended(lm, 20, 18, 17);

    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // A. Open Hand -> HELLO / FIVE
    if (extendedCount === 4 && thumbExtended) {
      return {
        label: 'Hello / Open Hand',
        gloss: 'HELLO',
        confidence: 0.85,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: All 5 digits extended outward.',
      };
    }

    // B. Pointing Index Finger -> YOU / ONE
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return {
        label: 'You / Pointing (1)',
        gloss: 'YOU',
        confidence: 0.83,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: Isolated index finger extended.',
      };
    }

    // C. Index + Middle -> TWO / PEACE
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return {
        label: 'Two / V-Sign',
        gloss: 'TWO',
        confidence: 0.81,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: Index and middle fingers extended.',
      };
    }

    // D. Three Fingers -> THREE
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      return {
        label: 'Three',
        gloss: 'THREE',
        confidence: 0.79,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: Three fingers extended.',
      };
    }

    // E. Four Fingers (Thumb folded) -> FOUR
    if (extendedCount === 4 && !thumbExtended) {
      return {
        label: 'Four',
        gloss: 'FOUR',
        confidence: 0.79,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: 4 fingers upright, thumb folded.',
      };
    }

    // F. Thumbs Up -> YES / GOOD
    if (thumbExtended && extendedCount === 0 && lm[4].y < lm[3].y && lm[3].y < lm[2].y) {
      return {
        label: 'Yes / Good',
        gloss: 'YES',
        confidence: 0.86,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: Vertical thumb elevation with closed fist.',
      };
    }

    // G. Closed Fist -> FIST / S-Handshape
    if (extendedCount === 0 && !thumbExtended) {
      return {
        label: 'Closed Fist',
        gloss: 'FIST',
        confidence: 0.77,
        timestamp: now,
        isFallback: true,
        modelType: 'demo-heuristic',
        notes: 'Single-hand heuristic: All digits curled into palm.',
      };
    }

    // Hand in transition / neutral pose: return null (do not hallucinate signs)
    return null;
  }

  private isFingerExtended(lm: Point3D[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
    const tip = lm[tipIdx];
    const pip = lm[pipIdx];
    const mcp = lm[mcpIdx];
    const wrist = lm[0];

    const distWristToTip = this.euclideanDistance(wrist, tip);
    const distWristToPip = this.euclideanDistance(wrist, pip);

    return distWristToTip > distWristToPip * 1.15 && tip.y < mcp.y + 0.05;
  }

  private isThumbExtended(lm: Point3D[]): boolean {
    const thumbTip = lm[4];
    const thumbIp = lm[3];
    const indexMcp = lm[5];

    const distTipToIndex = this.euclideanDistance(thumbTip, indexMcp);
    const distIpToIndex = this.euclideanDistance(thumbIp, indexMcp);

    return distTipToIndex > distIpToIndex * 1.1;
  }

  private euclideanDistance(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export const demoHeuristicRecognizer = new ISLDemoHeuristicRecognizer();
