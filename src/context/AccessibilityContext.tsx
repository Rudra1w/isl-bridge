import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSizeOption = 'normal' | 'large' | 'xlarge';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: FontSizeOption;
  reducedMotion: boolean;
  soundFeedback: boolean;
  volume: number; // 0 to 1
}

interface AccessibilityContextType extends AccessibilitySettings {
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: FontSizeOption) => void;
  setReducedMotion: (enabled: boolean) => void;
  setSoundFeedback: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  speakText: (text: string) => void;
}

const STORAGE_KEY = 'isl_accessibility_settings_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
  soundFeedback: true,
  volume: 0.9,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

import { speechSynthesisService } from '@/modules/speech/SpeechSynthesisService';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable
    }

    // Apply document-level classes for accessibility
    const root = document.documentElement;
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  const speakText = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    speechSynthesisService.speak(clean, { volume: settings.volume, rate: 0.95 });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setHighContrast: (highContrast) => setSettings((s) => ({ ...s, highContrast })),
        setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
        setReducedMotion: (reducedMotion) => setSettings((s) => ({ ...s, reducedMotion })),
        setSoundFeedback: (soundFeedback) => setSettings((s) => ({ ...s, soundFeedback })),
        setVolume: (volume) => setSettings((s) => ({ ...s, volume })),
        speakText,
      }}
    >
      <div
        className={`${
          settings.fontSize === 'large'
            ? 'text-[1.075rem]'
            : settings.fontSize === 'xlarge'
            ? 'text-[1.175rem]'
            : 'text-base'
        } ${settings.highContrast ? 'contrast-125' : ''}`}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
