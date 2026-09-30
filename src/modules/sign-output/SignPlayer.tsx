import React, { useState, useEffect, useRef } from 'react';
import { GlossTranslationResult } from '@/types/isl';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Info, Sparkles } from 'lucide-react';
import { FingerspellCard } from './FingerspellCard';

interface SignPlayerProps {
  translationResult: GlossTranslationResult | null;
  className?: string;
}

export const SignPlayer: React.FC<SignPlayerProps> = ({
  translationResult,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tokens = translationResult?.tokens || [];
  const activeToken = tokens[currentIndex] || null;

  // Auto reset on new translation
  useEffect(() => {
    setCurrentIndex(0);
    if (tokens.length > 0) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [translationResult]);

  // Sequential playback loop
  useEffect(() => {
    if (!isPlaying || tokens.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = Math.round(1400 / playbackSpeed);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= tokens.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, tokens.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentIndex >= tokens.length - 1 && !isPlaying) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(tokens.length - 1, prev + 1));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  if (!translationResult || tokens.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center min-h-[360px] ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">Visual ISL Sign Player</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Speak via microphone or type a sentence to generate an ISL gloss and watch the sequenced sign animation.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            ISL Sign Player
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {currentIndex + 1} of {tokens.length} signs
          </span>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
            translationResult.source === 'gemini'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {translationResult.source === 'gemini' ? 'Gemini ISL Model' : 'Local ISL Heuristic'}
          </span>
        </div>
      </div>

      {/* Main Sign Display Screen */}
      <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        {activeToken?.matchedAsset?.url ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={activeToken.matchedAsset.url}
              alt={`ISL Sign for ${activeToken.gloss}`}
              className="max-h-full max-w-full object-contain filter drop-shadow-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-7xl font-mono font-black text-indigo-400 mb-2">
              {activeToken?.gloss || '?'}
            </span>
            <span className="text-xs text-slate-400">Two-Handed Fingerspelling Representation</span>
          </div>
        )}

        {/* Active Sign Floating Info Overlay */}
        {activeToken && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100 font-mono">
                  {activeToken.gloss}
                </span>
                {activeToken.isFingerspelled && (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Fingerspelled
                  </span>
                )}
                {activeToken.matchedAsset?.category && (
                  <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full capitalize">
                    {activeToken.matchedAsset.category}
                  </span>
                )}
              </div>
              {activeToken.matchedAsset?.description && (
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {activeToken.matchedAsset.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            title="Replay sequence"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            title="Previous sign"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= tokens.length - 1}
            title="Next sign"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Speed:</span>
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {[0.5, 0.75, 1.0, 1.25].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Gloss Tokens Scroll Strip */}
      <div className="p-4 bg-slate-900 border-t border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
          <span>ISL Gloss Sequence</span>
          <span className="text-slate-500 font-normal">Click any sign to jump</span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {tokens.map((token, idx) => (
            <FingerspellCard
              key={token.id}
              token={token}
              isActive={idx === currentIndex}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(idx);
              }}
            />
          ))}
        </div>
      </div>

      {/* Linguistic Notes Drawer */}
      {translationResult.linguisticNotes.length > 0 && (
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Linguistic Analysis & Grammar Structure</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400/90 pl-1">
            {translationResult.linguisticNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
