import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GlossTranslationResult } from '@/types/isl';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Info,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Video,
  ShieldCheck,
} from 'lucide-react';
import { signAssetResolver } from './SignAssetResolver';
import { useSignSequencePlayer } from './useSignSequencePlayer';
import { ResolvedSign } from './types';
import { SignDictionaryModal } from '@/components/dashboard/SignDictionaryModal';

interface SignPlayerProps {
  translationResult: GlossTranslationResult | null;
  className?: string;
}

export const SignPlayer: React.FC<SignPlayerProps> = ({
  translationResult,
  className = '',
}) => {
  const [isDictionaryOpen, setIsDictionaryOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Resolve tokens to local verified sign assets or fingerspelling
  const resolvedSigns: ResolvedSign[] = useMemo(() => {
    if (!translationResult || !translationResult.tokens || translationResult.tokens.length === 0) {
      return [];
    }
    const tokenStrings = translationResult.tokens.map((t) => t.gloss || t.originalWord || '');
    return signAssetResolver.resolveSequence(tokenStrings);
  }, [translationResult]);

  const {
    currentIndex,
    totalCount,
    playbackSpeed,
    isPlaying,
    currentSign,
    progressPercent,
    restart,
    togglePlayPause,
    next,
    previous,
    seek,
    setPlaybackSpeed,
    onVideoEnded,
    onAssetError,
  } = useSignSequencePlayer(resolvedSigns, 1.0, true);

  // Sync video element playback if current sign is video
  useEffect(() => {
    if (currentSign?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn('Sign video auto-play interrupted:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, currentSign, isPlaying, playbackSpeed]);

  if (!translationResult || resolvedSigns.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center min-h-[360px] ${className}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">Visual ISL Sign Player</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
          Speak via microphone or type a sentence to generate an ISL gloss and watch the sequenced sign animation.
        </p>
        <button
          onClick={() => setIsDictionaryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Browse Sign Dictionary</span>
        </button>

        <SignDictionaryModal
          isOpen={isDictionaryOpen}
          onClose={() => setIsDictionaryOpen(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            ISL Sign Player
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {currentIndex + 1} of {totalCount} signs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Dictionary</span>
          </button>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              translationResult.source === 'gemini'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {translationResult.source === 'gemini' ? 'Gemini ISL Model' : 'Local ISL Heuristic'}
          </span>
        </div>
      </div>

      {/* Sequence Flow Breadcrumbs (e.g. TOMORROW → I → GO → SCHOOL) */}
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

      {/* Main Sign Display Screen */}
      <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        {currentSign ? (
          <>
            {/* Video Format */}
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
            ) : /* Image / SVG / GIF Format */
            currentSign.isAvailable && currentSign.src ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  key={currentSign.id}
                  src={currentSign.src}
                  alt={`ISL Sign for ${currentSign.label}`}
                  onError={onAssetError}
                  className="max-h-full max-w-full object-contain filter drop-shadow-lg animate-in fade-in duration-200"
                />
              </div>
            ) : /* Fingerspelling */
            currentSign.isFingerspelled ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-7xl font-mono font-black text-indigo-400 mb-2">
                  {currentSign.label}
                </span>
                <span className="text-xs text-slate-400">Two-Handed Fingerspelling Representation</span>
              </div>
            ) : (
              /* Missing-sign fallback */
              <div className="flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <span className="text-3xl font-mono font-black text-slate-200 mb-1">
                  {currentSign.token}
                </span>
                <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 mb-2">
                  Sign asset unavailable
                </span>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  No verified ISL sign asset found in local dictionary. Contributor asset needed.
                </p>
              </div>
            )}

            {/* Active Sign Floating Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    {currentSign.token}
                  </span>
                  <span className="text-xs text-slate-300">
                    {currentSign.label}
                  </span>
                  {currentSign.isFingerspelled && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      Fingerspelled
                    </span>
                  )}
                  {currentSign.category && (
                    <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full capitalize">
                      {currentSign.category}
                    </span>
                  )}
                </div>
                {currentSign.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {currentSign.description}
                  </p>
                )}
              </div>

              {currentSign.source && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{currentSign.source}</span>
                </div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Controls Bar */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={restart}
            title="Replay sequence"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={previous}
            disabled={currentIndex === 0}
            title="Previous sign"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlayPause}
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
            onClick={next}
            disabled={currentIndex >= totalCount - 1}
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
            {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
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
          {resolvedSigns.map((sign, idx) => (
            <button
              key={sign.id}
              onClick={() => seek(idx)}
              className={`cursor-pointer group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all duration-200 select-none min-w-[70px] ${
                idx === currentIndex
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/30 scale-105'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80">
                {sign.isAvailable && sign.src ? (
                  <img
                    src={sign.src}
                    alt={sign.label}
                    className="w-full h-full object-contain p-1"
                  />
                ) : sign.type === 'video' ? (
                  <Video className="w-5 h-5 text-purple-400" />
                ) : (
                  <span className="text-base font-bold font-mono text-indigo-400">
                    {sign.token.slice(0, 3)}
                  </span>
                )}
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs font-bold font-mono text-slate-100 block truncate max-w-[65px]">
                  {sign.token}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  #{idx + 1}
                </span>
              </div>
            </button>
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

      {/* Dictionary Modal */}
      <SignDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
};
