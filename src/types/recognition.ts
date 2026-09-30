export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right';

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
}

export interface HandLandmarks {
  handIndex: number;
  handedness: Handedness;
  landmarks: Point3D[]; // 21 standard MediaPipe landmarks (image-relative 0-1)
  normalizedLandmarks: Point3D[]; // Position & scale invariant coordinates (wrist-centered, scale-normalized)
  boundingBox: BoundingBox;
  score: number;
  timestamp: number;
}

export type RecognitionState =
  | 'idle'
  | 'starting'
  | 'tracking'
  | 'recognizing'
  | 'no_hands'
  | 'error'
  | 'fallback_mode';

export interface SignPrediction {
  signId: string;
  label: string;
  gloss: string;
  confidence: number;
  timestamp: number;
  isFallback: boolean;
  notes?: string;
}

export interface ISLClassifier {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly isReady: boolean;
  readonly isFallbackClassifier: boolean;
  initialize(): Promise<void>;
  classify(hands: HandLandmarks[]): Promise<SignPrediction | null>;
  dispose(): void;
}
