import React from 'react';
import {
  MessageSquareText,
  Hand,
  Mic,
  ArrowRightLeft,
  Volume2,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import { AppNavigationMode } from '@/types/conversation';

interface ModeNavigationProps {
  activeMode: AppNavigationMode;
  onModeChange: (mode: AppNavigationMode) => void;
}

const MODES: {
  id: AppNavigationMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  highlight?: boolean;
}[] = [
  {
    id: 'conversation',
    label: 'Conversation Mode',
    shortLabel: 'Conversation',
    icon: MessageSquareText,
    tag: '2-Way Live',
    highlight: true,
  },
  {
    id: 'sign-to-text',
    label: 'Sign → Text',
    shortLabel: 'Sign → Text',
    icon: Hand,
  },
  {
    id: 'speech-to-text',
    label: 'Speech → Text',
    shortLabel: 'Speech → Text',
    icon: Mic,
  },
  {
    id: 'text-to-sign',
    label: 'Text → Sign',
    shortLabel: 'Text → Sign',
    icon: ArrowRightLeft,
  },
  {
    id: 'text-to-speech',
    label: 'Text → Speech',
    shortLabel: 'Text → Speech',
    icon: Volume2,
  },
  {
    id: 'dashboard',
    label: 'Studio Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'dictionary',
    label: 'Sign Lexicon',
    shortLabel: 'Lexicon',
    icon: BookOpen,
  },
];

export const ModeNavigation: React.FC<ModeNavigationProps> = ({
  activeMode,
  onModeChange,
}) => {
  return (
    <nav
      aria-label="Communication Modes"
      className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-2"
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none ${
                  isActive
                    ? mode.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{mode.label}</span>
                <span className="inline md:hidden">{mode.shortLabel}</span>

                {mode.tag && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {mode.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0 font-medium pl-2 border-l border-slate-800/80">
          <span>Mode:</span>
          <span className="text-slate-300 font-semibold capitalize">
            {activeMode.replace(/-/g, ' ')}
          </span>
        </div>
      </div>
    </nav>
  );
};
