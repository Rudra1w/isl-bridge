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
  modelType?: 'tensorflow' | 'demo-heuristic' | 'placeholder';
  notes?: string;
}

export type ModelType = 'tensorflow' | 'demo-heuristic' | 'placeholder';
export type ModelStatus = 'uninitialized' | 'loading' | 'ready' | 'model_not_found' | 'demo_fallback' | 'error';

/**
 * Single-frame input for static sign recognition
 */
export interface HandLandmarkFrame {
  hands: HandLandmarks[];
  timestamp: number;
}

/**
 * Sliding temporal sequence of frames for dynamic / motion-based signs
 */
export interface TemporalSequenceFrame {
  frames: HandLandmarkFrame[];
  windowSize: number; // e.g. 30 frames
  durationMs: number;
}

/**
 * Standard prediction result
 */
export interface Prediction {
  label: string;
  gloss: string;
  confidence: number;
  timestamp: number;
  isFallback: boolean;
  modelType: ModelType;
  isDynamic?: boolean;
  notes?: string;
}

/**
 * Pluggable ISL Recognizer Model Interface
 */
export interface ISLRecognizer {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly isReady: boolean;
  readonly modelType: ModelType;
  readonly status: ModelStatus;
  readonly supportedSigns: string[];

  initialize(): Promise<void>;
  predict(input: HandLandmarkFrame | TemporalSequenceFrame): Promise<Prediction | null>;
  dispose(): void;
}

/**
 * Legacy classifier interface kept for backwards-compatibility
 */
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

/**
 * Recorded sign sample for dataset collection tool
 */
export interface RecordedSignSample {
  id: string;
  label: string;
  type: 'static' | 'dynamic';
  timestamp: number;
  frames: {
    timestamp: number;
    hands: {
      handedness: Handedness;
      landmarks: Point3D[];
      normalizedLandmarks: Point3D[];
      boundingBox: BoundingBox;
      score: number;
    }[];
  }[];
}

export interface RecordedDataset {
  name: string;
  version: string;
  createdAt: string;
  author?: string;
  classes: string[];
  totalSamples: number;
  samples: RecordedSignSample[];
}
