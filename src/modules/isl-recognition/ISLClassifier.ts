import { HandLandmarks, SignPrediction } from '@/types/recognition';

export interface IISLClassifier {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly isReady: boolean;
  readonly isFallbackClassifier: boolean;

  initialize(): Promise<void>;
  classify(hands: HandLandmarks[]): Promise<SignPrediction | null>;
  dispose(): void;
}
