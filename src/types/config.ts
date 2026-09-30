export type PerformanceMode = 'high' | 'balanced' | 'low';

export interface FeatureFlags {
  enableGemini: boolean;
  enableSpeechRecognition: boolean;
  enableSignRecognition: boolean;
  enableSignOutput: boolean;
}

export interface VisionConfig {
  targetFps: number;
  confidenceThreshold: number;
  maxHands: number;
  performanceMode: PerformanceMode;
}

export interface PerformanceConfig {
  mode: PerformanceMode;
  cameraWidth: number;
  cameraHeight: number;
  inferenceThrottleMs: number;
  renderLandmarkEffects: boolean;
  enableFullAnimations: boolean;
}

export interface SpeechConfig {
  defaultLocale: string;
  continuous: boolean;
  interimResults: boolean;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface AppConfig {
  features: FeatureFlags;
  vision: VisionConfig;
  speech: SpeechConfig;
  gemini: GeminiConfig;
  performance: PerformanceConfig;
}
