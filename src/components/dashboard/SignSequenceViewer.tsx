import React, { useState, useEffect, useRef } from 'react';
import { GlossTranslationResult, GlossToken } from '@/types/isl';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Sparkles, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SignSequenceViewerProps {
  translation: GlossTranslationResult | null;
  isLoading?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const SignSequenceViewer: React.FC<SignSequenceViewerProps> = ({
  translation,
  isLoading = false,
  onRetry,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [assetLoading, setAssetLoading] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tokens = translation?.tokens || [];
  const currentToken: GlossToken | null = tokens[currentIndex] || null;

  // Reset index when a new translation arrives
  useEffect(() => {
    setCurrentIndex(0);
    if (tokens.length > 0) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [translation]);

  // Handle asset loading transition
  useEffect(() => {
    if (currentToken?.matchedAsset?.url) {
      setAssetLoading(true);
      const img = new Image();
      img.src = currentToken.matchedAsset.url;
      img.onload = () => setAssetLoading(false);
      img.onerror = () => setAssetLoading(false);
    } else {
      setAssetLoading(false);
    }
  }, [currentIndex, currentToken]);

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

  const handleReplay = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center min-h-[300px] ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <h4 className="text-sm font-bold text-slate-200">Translating to ISL Gloss...</h4>
        <p className="text-xs text-slate-400 mt-1">Applying Indian Sign Language spatial and SOV grammar</p>
      </div>
    );
  }

  if (!translation || tokens.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center min-h-[280px] ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">Visual Sign Sequence Ready</h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Speak through microphone or enter English text above to see sequenced ISL sign gestures.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl ${className}`}>
      {/* Fallback notification banner if Gemini failed */}
      {translation.isFallback && translation.fallbackReason && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between text-xs text-amber-200">
          <span className="truncate pr-2">
            ⚠️ {translation.fallbackReason}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[11px] font-semibold underline text-amber-300 hover:text-amber-100 shrink-0"
            >
              Retry AI
            </button>
          )}
        </div>
      )}

      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            Sign #{currentIndex + 1} of {tokens.length}
          </span>
          <Badge
            variant={
              translation.source === 'gemini'
                ? 'brand'
                : translation.source === 'phrase-dictionary'
                ? 'info'
                : 'warning'
            }
            size="sm"
          >
            {translation.source === 'gemini'
              ? 'Gemini ISL Model'
              : translation.source === 'phrase-dictionary'
              ? 'ISL Phrase Dictionary'
              : 'Local ISL Grammar'}
          </Badge>
          {translation.confidence > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({Math.round(translation.confidence * 100)}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Speed:</span>
          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            {[0.5, 0.75, 1.0, 1.25].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="relative aspect-video sm:aspect-[16/10] w-full bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
        {assetLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
            <span className="text-xs">Loading sign asset...</span>
          </div>
        ) : currentToken?.matchedAsset?.url ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentToken.matchedAsset.url}
              alt={`ISL Sign for ${currentToken.gloss}`}
              className="max-h-full max-w-full object-contain filter drop-shadow-md select-none"
            />
          </div>
        ) : (
          /* Missing-sign fallback: Two-handed Fingerspelling Representation */
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-5xl sm:text-6xl font-black font-mono text-indigo-400 mb-2">
              {currentToken?.gloss || '?'}
            </span>
            <Badge variant="warning" size="sm">
              Fingerspelling Fallback
            </Badge>
            <p className="text-[11px] text-slate-400 mt-2 max-w-xs">
              No lexical sign token found. Displaying Indian fingerspelling handshape.
            </p>
          </div>
        )}

        {/* Floating Active Word Info */}
        {currentToken && (
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                {currentToken.gloss}
              </span>
              {currentToken.isFingerspelled && (
                <span className="text-[10px] text-amber-400 font-medium">
                  Two-Handed Fingerspell
                </span>
              )}
            </div>
            {currentToken.matchedAsset?.category && (
              <span className="text-[10px] text-slate-400 capitalize">
                {currentToken.matchedAsset.category}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Playback Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplay}
            title="Replay sequence"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Replay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            title="Previous sign"
            leftIcon={<SkipBack className="w-3.5 h-3.5" />}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlayPause}
            leftIcon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isPlaying ? 'Pause' : 'Auto Play'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= tokens.length - 1}
            title="Next sign"
            leftIcon={<SkipForward className="w-3.5 h-3.5" />}
          />
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Token {currentIndex + 1}/{tokens.length}
        </span>
      </div>

      {/* Sequenced Sign Cards Ribbon */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Sign Sequence Cards</span>
          <span className="text-slate-500 font-normal">Click card to jump</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {tokens.map((token, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={token.id}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`group shrink-0 flex flex-col items-center p-2 rounded-xl border transition-all text-left select-none ${
                  isActive
                    ? 'bg-indigo-600/25 border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Number Badge */}
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                  <span>#{idx + 1}</span>
                  {token.isFingerspelled && (
                    <span className="text-amber-400 font-bold">FS</span>
                  )}
                </div>

                {/* Handshape thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/60 mb-1.5">
                  {token.matchedAsset?.url ? (
                    <img
                      src={token.matchedAsset.url}
                      alt={token.gloss}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-indigo-400">
                      {token.gloss}
                    </span>
                  )}
                </div>

                {/* Word Label */}
                <span className="text-[11px] font-bold font-mono text-slate-200 truncate max-w-[64px]">
                  {token.gloss}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linguistic Notes Collapsible */}
      {translation.linguisticNotes.length > 0 && (
        <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="text-slate-300 font-semibold">Linguistic Transformation: </span>
            {translation.linguisticNotes.join(' ')}
          </div>
        </div>
      )}
    </div>
  );
};
