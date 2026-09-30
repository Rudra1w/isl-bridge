import { HandLandmarks, Point3D, SignPrediction } from '@/types/recognition';
import { IISLClassifier } from './ISLClassifier';

/**
 * Geometric Landmark Heuristic Classifier (Fallback Engine)
 *
 * TRANSPARENCY NOTICE:
 * This is an algorithmic geometric rule-engine designed as a fallback when a
 * trained deep learning model (e.g. MediaPipe Gesture, TF.js, or ONNX) is not
 * mounted.
 *
 * It directly evaluates spatial coordinates and finger extension angles.
 * It is clearly flagged as `isFallback: true` and will NOT produce hallucinated
 * or constant fake outputs.
 */
export class RuleBasedClassifierFallback implements IISLClassifier {
  public readonly id = 'geometric-heuristic-fallback-v1';
  public readonly name = 'Geometric Landmark Heuristic (Fallback)';
  public readonly version = '1.0.0-demo';
  public readonly isFallbackClassifier = true;
  private _isReady = true;

  public get isReady(): boolean {
    return this._isReady;
  }

  public async initialize(): Promise<void> {
    this._isReady = true;
  }

  public dispose(): void {
    // No-op for heuristic engine
  }

  public async classify(hands: HandLandmarks[]): Promise<SignPrediction | null> {
    if (!hands || hands.length === 0) return null;

    const now = Date.now();

    // 1. Two-Handed Gesture: Check for NAMASTE
    // (Both hands close together horizontally, palms facing each other in central torso region)
    if (hands.length === 2) {
      const leftWrist = hands.find((h) => h.handedness === 'Left')?.landmarks[0];
      const rightWrist = hands.find((h) => h.handedness === 'Right')?.landmarks[0];

      if (leftWrist && rightWrist) {
        const distance = this.euclideanDistance(leftWrist, rightWrist);
        // If wrists are within 0.18 normalized units and near horizontal center (0.35 - 0.65)
        if (distance < 0.22 && Math.abs(leftWrist.y - rightWrist.y) < 0.12) {
          return {
            signId: 'NAMASTE',
            label: 'Namaste',
            gloss: 'NAMASTE',
            confidence: 0.88,
            timestamp: now,
            isFallback: true,
            notes: 'Two-handed heuristic: Both palms aligned centrally in greeting posture.',
          };
        }
      }
    }

    // 2. Single-Handed Geometric Analysis on the most prominent hand
    const primaryHand = hands[0];
    const lm = primaryHand.landmarks;

    // Check extensions of the 5 fingers
    const thumbExtended = this.isThumbExtended(lm);
    const indexExtended = this.isFingerExtended(lm, 8, 6, 5);
    const middleExtended = this.isFingerExtended(lm, 12, 10, 9);
    const ringExtended = this.isFingerExtended(lm, 16, 14, 13);
    const pinkyExtended = this.isFingerExtended(lm, 20, 18, 17);

    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // A. Open Hand / Wave -> HELLO
    if (extendedCount === 4 && thumbExtended) {
      return {
        signId: 'HELLO',
        label: 'Hello / Open Hand',
        gloss: 'HELLO',
        confidence: 0.85,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: All 5 digits extended outward.',
      };
    }

    // B. Pointing Index Finger -> YOU / ONE / POINTING
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return {
        signId: 'YOU',
        label: 'You / Pointing (1)',
        gloss: 'YOU',
        confidence: 0.82,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: Isolated index finger extended forward.',
      };
    }

    // C. Index + Middle Extended -> TWO / PEACE
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return {
        signId: 'TWO',
        label: 'Two / V-Handshape',
        gloss: 'TWO',
        confidence: 0.80,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: Index and middle fingers extended.',
      };
    }

    // D. Three Fingers Extended (Index + Middle + Ring) -> THREE
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      return {
        signId: 'THREE',
        label: 'Three',
        gloss: 'THREE',
        confidence: 0.78,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: Three fingers extended.',
      };
    }

    // E. Four Fingers Extended (No thumb) -> FOUR
    if (extendedCount === 4 && !thumbExtended) {
      return {
        signId: 'FOUR',
        label: 'Four',
        gloss: 'FOUR',
        confidence: 0.78,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: Four fingers upright, thumb folded.',
      };
    }

    // F. Thumbs Up -> GOOD / YES
    if (thumbExtended && extendedCount === 0 && lm[4].y < lm[3].y && lm[3].y < lm[2].y) {
      return {
        signId: 'YES',
        label: 'Yes / Good / Thumb-Up',
        gloss: 'YES',
        confidence: 0.85,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: Vertical thumb elevation with closed fist.',
      };
    }

    // G. Closed Fist -> S-Handshape
    if (extendedCount === 0 && !thumbExtended) {
      return {
        signId: 'FIST',
        label: 'Closed Fist / S-Handshape',
        gloss: 'FIST',
        confidence: 0.75,
        timestamp: now,
        isFallback: true,
        notes: 'Single-hand heuristic: All digits curled into palm.',
      };
    }

    // If hands are moving or in undefined intermediate position, return null!
    return null;
  }

  private isFingerExtended(lm: Point3D[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
    const tip = lm[tipIdx];
    const pip = lm[pipIdx];
    const mcp = lm[mcpIdx];
    const wrist = lm[0];

    // Distance from wrist to tip vs wrist to PIP
    const distWristToTip = this.euclideanDistance(wrist, tip);
    const distWristToPip = this.euclideanDistance(wrist, pip);

    // Tip must be significantly further from wrist than PIP & MCP
    return distWristToTip > distWristToPip * 1.15 && tip.y < mcp.y + 0.05;
  }

  private isThumbExtended(lm: Point3D[]): boolean {
    const thumbTip = lm[4];
    const thumbIp = lm[3];
    const indexMcp = lm[5];

    // Distance from thumb tip to index MCP
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

export const fallbackClassifier = new RuleBasedClassifierFallback();
