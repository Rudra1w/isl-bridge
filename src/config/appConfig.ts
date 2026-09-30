import { AppConfig, PerformanceMode, PerformanceConfig } from '@/types/config';

const STORAGE_KEY = 'isl_bridge_config_v2';

export const PERFORMANCE_PROFILES: Record<PerformanceMode, PerformanceConfig> = {
  high: {
    mode: 'high',
    cameraWidth: 640,
    cameraHeight: 480,
    inferenceThrottleMs: 33, // ~30 FPS
    renderLandmarkEffects: true,
    enableFullAnimations: true,
  },
  balanced: {
    mode: 'balanced',
    cameraWidth: 640,
    cameraHeight: 480,
    inferenceThrottleMs: 65, // ~15 FPS
    renderLandmarkEffects: true,
    enableFullAnimations: true,
  },
  low: {
    mode: 'low',
    cameraWidth: 480,
    cameraHeight: 360,
    inferenceThrottleMs: 110, // ~9-10 FPS
    renderLandmarkEffects: false,
    enableFullAnimations: false,
  },
};

const defaultPerfMode: PerformanceMode =
  (import.meta.env.VITE_PERFORMANCE_MODE as PerformanceMode) || 'balanced';

export const DEFAULT_CONFIG: AppConfig = {
  features: {
    enableGemini: import.meta.env.VITE_ENABLE_GEMINI !== 'false',
    enableSpeechRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION !== 'false',
    enableSignRecognition: import.meta.env.VITE_ENABLE_SIGN_RECOGNITION !== 'false',
    enableSignOutput: import.meta.env.VITE_ENABLE_SIGN_OUTPUT !== 'false',
  },
  vision: {
    targetFps: Number(import.meta.env.VITE_VISION_TARGET_FPS) || 24,
    confidenceThreshold: Number(import.meta.env.VITE_VISION_CONFIDENCE_THRESHOLD) || 0.65,
    maxHands: 2,
    performanceMode: defaultPerfMode,
  },
  speech: {
    defaultLocale: import.meta.env.VITE_SPEECH_DEFAULT_LOCALE || 'en-IN',
    continuous: true,
    interimResults: true,
  },
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env.GEMINI_API_KEY as string) || '',
    model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
  },
  performance: PERFORMANCE_PROFILES[defaultPerfMode],
};

export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: AppConfig;
  private listeners: Set<(config: AppConfig) => void> = new Set();

  private constructor() {
    this.currentConfig = this.loadStoredConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadStoredConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const mode: PerformanceMode = parsed.performance?.mode || parsed.vision?.performanceMode || 'balanced';
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          features: { ...DEFAULT_CONFIG.features, ...parsed.features },
          vision: { ...DEFAULT_CONFIG.vision, ...parsed.vision, performanceMode: mode },
          speech: { ...DEFAULT_CONFIG.speech, ...parsed.speech },
          gemini: { ...DEFAULT_CONFIG.gemini, ...parsed.gemini },
          performance: { ...PERFORMANCE_PROFILES[mode], ...(parsed.performance || {}) },
        };
      }
    } catch {
      // LocalStorage might be disabled or parse error
    }
    return { ...DEFAULT_CONFIG };
  }

  public getConfig(): AppConfig {
    return this.currentConfig;
  }

  public updateConfig(partial: Partial<AppConfig>): void {
    const updated = {
      ...this.currentConfig,
      ...partial,
      features: partial.features ? { ...this.currentConfig.features, ...partial.features } : this.currentConfig.features,
      vision: partial.vision ? { ...this.currentConfig.vision, ...partial.vision } : this.currentConfig.vision,
      speech: partial.speech ? { ...this.currentConfig.speech, ...partial.speech } : this.currentConfig.speech,
      gemini: partial.gemini ? { ...this.currentConfig.gemini, ...partial.gemini } : this.currentConfig.gemini,
      performance: partial.performance ? { ...this.currentConfig.performance, ...partial.performance } : this.currentConfig.performance,
    };

    // Keep performance mode in sync
    if (partial.vision?.performanceMode && partial.vision.performanceMode !== this.currentConfig.performance.mode) {
      updated.performance = PERFORMANCE_PROFILES[partial.vision.performanceMode];
    } else if (partial.performance?.mode && partial.performance.mode !== this.currentConfig.vision.performanceMode) {
      updated.vision.performanceMode = partial.performance.mode;
    }

    this.currentConfig = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
    } catch {
      // Storage quota exceeded or disabled
    }

    this.notify();
  }

  public setPerformanceMode(mode: PerformanceMode): void {
    this.updateConfig({
      vision: {
        ...this.currentConfig.vision,
        performanceMode: mode,
      },
      performance: PERFORMANCE_PROFILES[mode],
    });
  }

  public resetToDefaults(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.currentConfig = { ...DEFAULT_CONFIG };
    this.notify();
  }

  public subscribe(listener: (config: AppConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentConfig);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentConfig));
  }
}

export const configManager = ConfigManager.getInstance();
