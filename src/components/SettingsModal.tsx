import React, { useState, useEffect } from 'react';
import { X, Key, Sliders, Volume2, Video, Eye, EyeOff, RotateCcw, Check, Sparkles } from 'lucide-react';
import { configManager } from '@/config/appConfig';
import { AppConfig } from '@/types/config';
import { SUPPORTED_LOCALES } from '@/modules/speech/SpeechRecognitionEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig());
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(configManager.getConfig());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    configManager.updateConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    configManager.resetToDefaults();
    setConfig(configManager.getConfig());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">System Configuration</h2>
              <p className="text-xs text-slate-400">Manage feature flags, API keys, and engine preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Feature Flags Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Module Feature Flags
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <span className="text-xs font-medium text-slate-200">Sign Recognition (CV)</span>
                <input
                  type="checkbox"
                  checked={config.features.enableSignRecognition}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      features: { ...config.features, enableSignRecognition: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <span className="text-xs font-medium text-slate-200">Speech Recognition (Audio)</span>
                <input
                  type="checkbox"
                  checked={config.features.enableSpeechRecognition}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      features: { ...config.features, enableSpeechRecognition: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <span className="text-xs font-medium text-slate-200">Sign Visual Output</span>
                <input
                  type="checkbox"
                  checked={config.features.enableSignOutput}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      features: { ...config.features, enableSignOutput: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <span className="text-xs font-medium text-slate-200">Gemini ISL Model</span>
                <input
                  type="checkbox"
                  checked={config.features.enableGemini}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      features: { ...config.features, enableGemini: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>

          {/* Gemini NLP Settings */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Google Gemini NLP Layer (Optional)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              When configured, Gemini handles advanced ISL grammatical reordering (SOV, temporal fronting, and WH-movement). If left empty, the application runs 100% locally with rule-based heuristics.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.gemini.apiKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        gemini: { ...config.gemini, apiKey: e.target.value },
                      })
                    }
                    placeholder="AIzaSy... (Leave blank to use local heuristic)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gemini Model
                </label>
                <input
                  type="text"
                  value={config.gemini.model}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      gemini: { ...config.gemini, model: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Speech Settings */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              Speech Recognition Settings
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Speech Locale
              </label>
              <select
                value={config.speech.defaultLocale}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    speech: { ...config.speech, defaultLocale: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {SUPPORTED_LOCALES.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.label} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vision Settings */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-sky-400" />
              Vision & Landmark Parameters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target FPS ({config.vision.targetFps} FPS)
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={config.vision.targetFps}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      vision: { ...config.vision, targetFps: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Min Confidence ({Math.round(config.vision.confidenceThreshold * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="0.95"
                  step="0.05"
                  value={config.vision.confidenceThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      vision: { ...config.vision, confidenceThreshold: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
