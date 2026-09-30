import { Volume2, VolumeX, RotateCcw, Contrast, Type, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAccessibility, FontSizeOption } from '@/context/AccessibilityContext';

interface BottomToolbarProps {
  currentSentence: string;
  onClearConversation: () => void;
  onOpenShortcuts: () => void;
  className?: string;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  currentSentence,
  onClearConversation,
  onOpenShortcuts,
  className = '',
}) => {
  const {
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    volume,
    setVolume,
    speakText,
  } = useAccessibility();

  const handleSpeak = () => {
    if (currentSentence.trim()) {
      speakText(currentSentence);
    }
  };

  const handleFontSizeCycle = () => {
    const sequence: FontSizeOption[] = ['normal', 'large', 'xlarge'];
    const nextIdx = (sequence.indexOf(fontSize) + 1) % sequence.length;
    setFontSize(sequence[nextIdx]);
  };

  return (
    <footer className={`sticky bottom-0 z-30 w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 py-3 shadow-lg ${className}`}>
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        {/* Left Section: Speech Audio & Quick Readout */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleSpeak}
            disabled={!currentSentence.trim()}
            leftIcon={<Volume2 className="w-4 h-4" />}
            title="Read recognized sentence aloud (Shortcut: S)"
          >
            Speak Aloud
          </Button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              aria-label="Toggle mute"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Speech volume control"
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={onClearConversation}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            title="Clear all active conversation buffers"
          >
            Clear Conversation
          </Button>
        </div>

        {/* Right Section: Accessibility & Shortcuts */}
        <div className="flex items-center gap-2">
          {/* High Contrast Toggle */}
          <Button
            variant={highContrast ? 'accent' : 'secondary'}
            size="sm"
            onClick={() => setHighContrast(!highContrast)}
            leftIcon={<Contrast className="w-4 h-4" />}
            title="Toggle High-Contrast mode for visibility"
            aria-pressed={highContrast}
          >
            {highContrast ? 'High Contrast' : 'Contrast'}
          </Button>

          {/* Font Size Scaling */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFontSizeCycle}
            leftIcon={<Type className="w-4 h-4 text-indigo-400" />}
            title="Change text size (Normal, Large, Extra Large)"
          >
            Text: <span className="capitalize ml-1 font-bold">{fontSize}</span>
          </Button>

          {/* Keyboard Shortcuts Dialog Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenShortcuts}
            title="View Keyboard Shortcuts (Shortcut: ?)"
            aria-label="Keyboard Shortcuts"
            className="border border-slate-800 hover:border-slate-700"
          >
            <HelpCircle className="w-4 h-4 text-slate-300" />
          </Button>
        </div>
      </div>
    </footer>
  );
};
