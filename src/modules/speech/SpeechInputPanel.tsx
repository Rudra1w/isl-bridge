import React from 'react';
import { Mic, MicOff, RotateCcw, Globe, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from './useSpeechRecognition';

interface SpeechInputPanelProps {
  onTranscriptChange?: (fullText: string) => void;
  className?: string;
}

export const SpeechInputPanel: React.FC<SpeechInputPanelProps> = ({
  onTranscriptChange,
  className = '',
}) => {
  const {
    isListening,
    isSupported,
    locale,
    error,
    interimTranscript,
    finalTranscript,
    toggleListening,
    setLocale,
    clear,
    supportedLocales,
  } = useSpeechRecognition(onTranscriptChange);

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl ${className}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isListening ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Speech Input Engine</h3>
            <p className="text-xs text-slate-400">Microphone to Live Text (Indian English)</p>
          </div>
        </div>

        {/* Locale Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={isListening}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {supportedLocales.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Transcription Display Box */}
      <div className="relative min-h-[110px] p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
        {finalTranscript || interimTranscript ? (
          <div className="text-base leading-relaxed">
            <span className="text-slate-100 font-medium">{finalTranscript}</span>
            {interimTranscript && (
              <span className="text-indigo-400/90 italic ml-1.5 transition-all">
                {interimTranscript}...
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-slate-500 text-sm select-none">
            {isListening ? (
              <span className="flex items-center gap-2 text-rose-400 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Listening for speech in {supportedLocales.find((l) => l.code === locale)?.label || locale}...
              </span>
            ) : (
              <span>Click "Start Listening" to speak</span>
            )}
          </div>
        )}

        {/* Status indicator bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/40 pt-2">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
            {isListening ? 'Active Stream' : 'Microphone Inactive'}
          </span>
          {finalTranscript && (
            <span>{finalTranscript.trim().split(/\s+/).length} words spoken</span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!isSupported && (
        <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Web Speech API is not natively supported in this browser. For voice input, please use Google Chrome, Edge, or Safari.
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={clear}
          disabled={!finalTranscript && !interimTranscript}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>

        <button
          onClick={toggleListening}
          disabled={!isSupported}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Listening
            </>
          )}
        </button>
      </div>
    </div>
  );
};
