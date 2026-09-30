export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right';

export interface HandLandmarks {
  handedness: Handedness;
  landmarks: Point3D[]; // 21 standard MediaPipe landmarks
  score: number;
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
