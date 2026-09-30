import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GlossTranslationResult } from '@/types/isl';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Loader2,
  Info,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Video,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { signAssetResolver } from '@/modules/sign-output/SignAssetResolver';
import { useSignSequencePlayer } from '@/modules/sign-output/useSignSequencePlayer';
import { SignDictionaryModal } from './SignDictionaryModal';
import { ResolvedSign } from '@/modules/sign-output/types';

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
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Resolve translation tokens through local verified dictionary and fallback rules
  const resolvedSigns: ResolvedSign[] = useMemo(() => {
    if (!translation || !translation.tokens || translation.tokens.length === 0) {
      return [];
    }
    const tokenStrings = translation.tokens.map((t) => t.gloss || t.originalWord || '');
    return signAssetResolver.resolveSequence(tokenStrings);
  }, [translation]);

  // Hook into playback controller
  const {
    currentIndex,
    totalCount,
    playbackSpeed,
    isPlaying,
    currentSign,
    progressPercent,
    togglePlayPause,
    restart,
    next,
    previous,
    seek,
    setPlaybackSpeed,
    onVideoEnded,
    onAssetError,
  } = useSignSequencePlayer(resolvedSigns, 1.0, true);

  // Play video whenever active sign changes and it is a video
  useEffect(() => {
    if (currentSign?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn('Video auto-play interrupted:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, currentSign, isPlaying, playbackSpeed]);

  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center min-h-[320px] ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <h4 className="text-sm font-bold text-slate-200">Translating to ISL Sequence...</h4>
        <p className="text-xs text-slate-400 mt-1">
          Resolving vocabulary from verified Indian Sign Language dictionary
        </p>
      </div>
    );
  }

  if (!translation || resolvedSigns.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center min-h-[300px] ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">Visual Sign Sequence Ready</h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
          Speak through microphone or enter English text above to see sequenced ISL sign gestures.
        </p>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
          onClick={() => setIsDictionaryOpen(true)}
        >
          Browse Sign Dictionary
        </Button>

        <SignDictionaryModal
          isOpen={isDictionaryOpen}
          onClose={() => setIsDictionaryOpen(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl ${className}`}
    >
      {/* Top Banner & Metadata */}
      {translation.isFallback && translation.fallbackReason && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between text-xs text-amber-200">
          <span className="truncate pr-2">⚠️ {translation.fallbackReason}</span>
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

      {/* Control Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            Sign #{currentIndex + 1} of {totalCount}
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
        </div>

        <div className="flex items-center gap-2">
          {/* Dictionary Viewer Button */}
          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
            title="Open Verified ISL Sign Dictionary"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Dictionary</span>
          </button>

          {/* Speed Controls */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[10px] text-slate-500 hidden sm:inline">Speed:</span>
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
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
      </div>

      {/* Visual Sequence Breadcrumb Ribbon (e.g. TOMORROW → I → GO → SCHOOL) */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/60 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center gap-1.5 min-w-max text-xs font-mono">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 tracking-wider">
            Flow:
          </span>
          {resolvedSigns.map((sign, idx) => {
            const isActive = idx === currentIndex;
            const isPast = idx < currentIndex;
            return (
              <React.Fragment key={sign.id}>
                <button
                  onClick={() => seek(idx)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-xs ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40 scale-105'
                      : isPast
                      ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {sign.token}
                </button>
                {idx < resolvedSigns.length - 1 && (
                  <ArrowRight
                    className={`w-3 h-3 ${
                      isPast ? 'text-indigo-500/70' : 'text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Sign Visual Viewport */}
      <div className="relative aspect-video sm:aspect-[16/10] w-full bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        {currentSign ? (
          <>
            {/* 1. Video Sign Asset */}
            {currentSign.type === 'video' && currentSign.src ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={currentSign.src}
                  playsInline
                  autoPlay={isPlaying}
                  onEnded={onVideoEnded}
                  onError={onAssetError}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md rounded-lg"
                />
              </div>
            ) : /* 2. Static Image / SVG / GIF Asset */
            currentSign.isAvailable && currentSign.src ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  key={currentSign.id}
                  src={currentSign.src}
                  alt={`ISL Sign for ${currentSign.label}`}
                  onError={onAssetError}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md animate-in fade-in duration-200"
                />
              </div>
            ) : /* 3. Manual Alphabet Fingerspelling */
            currentSign.isFingerspelled ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <span className="text-6xl sm:text-7xl font-black font-mono text-indigo-400 mb-2">
                  {currentSign.label}
                </span>
                <Badge variant="warning" size="sm">
                  Two-Handed Fingerspell
                </Badge>
                <p className="text-[11px] text-slate-400 mt-2 max-w-xs">
                  {currentSign.description || 'Indian manual alphabet fingerspelling handshape.'}
                </p>
              </div>
            ) : (
              /* 4. Missing-sign fallback (NO RANDOM INTERNET SCRAPING) */
              <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800/80 max-w-md">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black font-mono text-slate-200 mb-1">
                  {currentSign.token}
                </span>
                <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 mb-2">
                  Sign asset unavailable
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                  No verified visual recording exists for this sign in the local dictionary. Contributor asset can be placed in <code className="text-indigo-300">public/signs/</code>.
                </p>
              </div>
            )}

            {/* Active Word Floating Info Card */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                  {currentSign.token}
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {currentSign.label}
                </span>
                {currentSign.category && (
                  <span className="text-[10px] text-slate-400 capitalize hidden sm:inline">
                    • {currentSign.category}
                  </span>
                )}
              </div>

              {currentSign.source && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{currentSign.source}</span>
                </div>
              )}
            </div>

            {/* Bottom Linear Progress Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Playback Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            title="Restart sequence"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Restart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={previous}
            disabled={currentIndex === 0}
            title="Previous sign"
            leftIcon={<SkipBack className="w-3.5 h-3.5" />}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={togglePlayPause}
            leftIcon={
              isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />
            }
          >
            {isPlaying ? 'Pause' : 'Auto Play'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={currentIndex >= totalCount - 1}
            title="Next sign"
            leftIcon={<SkipForward className="w-3.5 h-3.5" />}
          />
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Sign {currentIndex + 1} of {totalCount} ({progressPercent}%)
        </span>
      </div>

      {/* Sequenced Sign Cards Horizontal Ribbon */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Sign Sequence Cards</span>
          <span className="text-slate-500 font-normal">Click card to jump</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {resolvedSigns.map((sign, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={sign.id}
                onClick={() => seek(idx)}
                className={`group shrink-0 flex flex-col items-center p-2 rounded-xl border transition-all text-left select-none ${
                  isActive
                    ? 'bg-indigo-600/25 border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Number Badge & Type */}
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                  <span>#{idx + 1}</span>
                  {sign.type === 'video' ? (
                    <Video className="w-2.5 h-2.5 text-purple-400" />
                  ) : sign.isFingerspelled ? (
                    <span className="text-amber-400 font-bold">FS</span>
                  ) : !sign.isAvailable ? (
                    <span className="text-amber-500 font-bold">!</span>
                  ) : null}
                </div>

                {/* Handshape / Media Preview thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/60 mb-1.5">
                  {sign.isAvailable && sign.src ? (
                    <img
                      src={sign.src}
                      alt={sign.label}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-indigo-400">
                      {sign.token.slice(0, 3)}
                    </span>
                  )}
                </div>

                {/* Word Label */}
                <span className="text-[11px] font-bold font-mono text-slate-200 truncate max-w-[64px]">
                  {sign.token}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linguistic Notes Drawer */}
      {translation.linguisticNotes.length > 0 && (
        <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="text-slate-300 font-semibold">Linguistic Transformation: </span>
            {translation.linguisticNotes.join(' ')}
          </div>
        </div>
      )}

      {/* Sign Dictionary Viewer Modal */}
      <SignDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
};
