import React from 'react';
import {
  Hand,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  Video,
  BookOpen,
  LayoutDashboard,
  MessageSquareText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppConfig } from '@/types/config';
import { AppNavigationMode } from '@/types/conversation';

interface HeaderProps {
  config: AppConfig;
  activeMode: AppNavigationMode;
  onModeChange: (mode: AppNavigationMode) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenSystemStatus?: () => void;
  onOpenDemoMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeMode,
  onModeChange,
  onOpenSettings,
  onOpenShortcuts,
  onOpenSystemStatus,
  onOpenDemoMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/10 shrink-0">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                ISL Bridge
              </h1>
              <Badge variant="brand" size="sm" dot>
                Live Assist
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Indian Sign Language Communication Assistant
            </p>
          </div>
        </div>

        {/* Center: System & Engine Health Status (Clickable for full diagnostics) */}
        <button
          onClick={onOpenSystemStatus}
          title="Click to view live subsystem diagnostics"
          className="hidden lg:flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium group-hover:text-white">System Status</span>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <Badge
              variant={config.features.enableSignRecognition ? 'info' : 'neutral'}
              size="sm"
            >
              <Video className="w-3 h-3 mr-1" />
              Vision
            </Badge>

            <Badge
              variant={config.features.enableSpeechRecognition ? 'info' : 'neutral'}
              size="sm"
            >
              <Volume2 className="w-3 h-3 mr-1" />
              {config.speech.defaultLocale}
            </Badge>

            <Badge
              variant={config.gemini.apiKey ? 'brand' : 'warning'}
              size="sm"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {config.gemini.apiKey ? 'Gemini 2.5' : 'Local Heuristic'}
            </Badge>

            <Badge variant="success" size="sm">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Status
            </Badge>
          </div>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Flagship Navigation Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => onModeChange('conversation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'conversation'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Conversation</span>
            </button>
            <button
              onClick={() => onModeChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio</span>
            </button>
            <button
              onClick={() => onModeChange('dictionary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'dictionary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lexicon</span>
            </button>
          </div>

          {/* Hackathon Demo Mode Trigger */}
          {onOpenDemoMode && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenDemoMode}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-950/40 hover:border-amber-500/50"
              title="Launch interactive presentation simulation"
            >
              <span className="hidden sm:inline">Demo Mode</span>
              <span className="sm:hidden">Demo</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenShortcuts}
            className="hidden md:inline-flex text-slate-400 hover:text-slate-200 border border-slate-800"
            aria-label="Keyboard Shortcuts"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 mr-1.5">
              ?
            </kbd>
            Shortcuts
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onOpenSettings}
            leftIcon={<Settings className="w-4 h-4 text-indigo-400" />}
            className="border-slate-800 hover:border-slate-700"
            aria-label="Open System Settings"
          >
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};
