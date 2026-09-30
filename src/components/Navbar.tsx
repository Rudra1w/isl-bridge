import { Settings, Hand, Mic, ArrowLeftRight, BookOpen } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { AppConfig } from '@/types/config';

export type ActivePage = 'two-way' | 'sign-to-text' | 'speech-to-sign' | 'dictionary';

interface NavbarProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onOpenSettings: () => void;
  config: AppConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onPageChange,
  onOpenSettings,
  config,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  ISL Bridge
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Indian Sign Language ↔ Speech Communication System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onPageChange('two-way')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePage === 'two-way'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Two-Way Bridge
            </button>

            <button
              onClick={() => onPageChange('sign-to-text')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePage === 'sign-to-text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              Sign → Text
            </button>

            <button
              onClick={() => onPageChange('speech-to-sign')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePage === 'speech-to-sign'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Speech → Sign
            </button>

            <button
              onClick={() => onPageChange('dictionary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePage === 'dictionary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Sign Lexicon
            </button>
          </nav>

          {/* Right Action Icons & Status */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5">
              <StatusIndicator
                label="Gemini"
                isEnabled={config.features.enableGemini}
                isReady={Boolean(config.gemini.apiKey)}
                details={config.gemini.apiKey ? 'Ready' : 'Local Fallback'}
              />
              <StatusIndicator
                label="Speech"
                isEnabled={config.features.enableSpeechRecognition}
                isReady={true}
                details={config.speech.defaultLocale}
              />
              <StatusIndicator
                label="Vision"
                isEnabled={config.features.enableSignRecognition}
                isReady={true}
              />
            </div>

            <button
              onClick={onOpenSettings}
              title="System Configuration"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => onPageChange('two-way')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              activePage === 'two-way' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Two-Way
          </button>
          <button
            onClick={() => onPageChange('sign-to-text')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              activePage === 'sign-to-text' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Hand className="w-4 h-4" />
            Sign → Text
          </button>
          <button
            onClick={() => onPageChange('speech-to-sign')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              activePage === 'speech-to-sign' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            Speech → Sign
          </button>
          <button
            onClick={() => onPageChange('dictionary')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              activePage === 'dictionary' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Lexicon
          </button>
        </div>
      </div>
    </header>
  );
};
