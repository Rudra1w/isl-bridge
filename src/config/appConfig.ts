import { AppConfig } from '@/types/config';

const STORAGE_KEY = 'isl_bridge_config_v1';

export const DEFAULT_CONFIG: AppConfig = {
  features: {
    enableGemini: import.meta.env.VITE_ENABLE_GEMINI !== 'false',
    enableSpeechRecognition: import.meta.env.VITE_ENABLE_SPEECH_RECOGNITION !== 'false',
    enableSignRecognition: import.meta.env.VITE_ENABLE_SIGN_RECOGNITION !== 'false',
    enableSignOutput: import.meta.env.VITE_ENABLE_SIGN_OUTPUT !== 'false',
  },
  vision: {
    targetFps: Number(import.meta.env.VITE_VISION_TARGET_FPS) || 30,
    confidenceThreshold: Number(import.meta.env.VITE_VISION_CONFIDENCE_THRESHOLD) || 0.65,
    maxHands: 2,
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
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          features: { ...DEFAULT_CONFIG.features, ...parsed.features },
          vision: { ...DEFAULT_CONFIG.vision, ...parsed.vision },
          speech: { ...DEFAULT_CONFIG.speech, ...parsed.speech },
          gemini: { ...DEFAULT_CONFIG.gemini, ...parsed.gemini },
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
    this.currentConfig = {
      ...this.currentConfig,
      ...partial,
      features: partial.features ? { ...this.currentConfig.features, ...partial.features } : this.currentConfig.features,
      vision: partial.vision ? { ...this.currentConfig.vision, ...partial.vision } : this.currentConfig.vision,
      speech: partial.speech ? { ...this.currentConfig.speech, ...partial.speech } : this.currentConfig.speech,
      gemini: partial.gemini ? { ...this.currentConfig.gemini, ...partial.gemini } : this.currentConfig.gemini,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
    } catch {
      // Storage quota exceeded or disabled
    }

    this.notify();
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
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentConfig));
  }
}

export const configManager = ConfigManager.getInstance();
