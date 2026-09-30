import React, { useState } from 'react';
import { Mic, MicOff, Type, ArrowRight, Sparkles, Volume2, Globe, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { SignSequenceViewer } from './SignSequenceViewer';
import { useSpeechRecognition } from '@/modules/speech/useSpeechRecognition';
import { useISLGloss } from '@/modules/nlp/useISLGloss';

const SAMPLE_PROMPTS = [
  'What is your name?',
  'Hello, I need water please.',
  'Where is the hospital?',
  'Doctor, please help me.',
  'Thank you, see you tomorrow.',
];

interface CommunicationPanelProps {
  onSpeechTranscribed?: (text: string) => void;
  className?: string;
}

export const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  onSpeechTranscribed,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>('speech');
  const [typedText, setTypedText] = useState<string>('');

  // Speech Recognition Hook
  const {
    isListening,
    isSupported,
    locale,
    error: speechError,
    interimTranscript,
    finalTranscript,
    toggleListening,
    setLocale,
    clear: clearSpeech,
    supportedLocales,
  } = useSpeechRecognition((committedText) => {
    if (onSpeechTranscribed) {
      onSpeechTranscribed(committedText);
    }
    // Auto translate speech input to ISL gloss sequence
    translateGloss(committedText);
  });

  // ISL Gloss Hook
  const {
    result: glossResult,
    isLoading: isGlossLoading,
    error: glossError,
    translate: translateGloss,
  } = useISLGloss();

  const tabs: TabItem[] = [
    {
      id: 'speech',
      label: 'Speech Input',
      icon: <Mic className="w-3.5 h-3.5" />,
      badge: isListening ? 'Live' : undefined,
    },
    {
      id: 'text',
      label: 'Text → ISL',
      icon: <Type className="w-3.5 h-3.5" />,
      badge: glossResult?.tokens.length ? glossResult.tokens.length : undefined,
    },
  ];

  const handleManualTranslate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim()) return;
    translateGloss(typedText);
  };

  const handlePromptClick = (prompt: string) => {
    setTypedText(prompt);
    translateGloss(prompt);
  };

  return (
    <Card className={`flex flex-col h-full border-slate-800 ${className}`}>
      {/* Header with Tab Navigation */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Communication Hub</CardTitle>
            <span className="text-[11px] text-slate-400">Speech & Text to Sign Visualizer</span>
          </div>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-auto"
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ================= TAB A: SPEECH INPUT ================= */}
        {activeTab === 'speech' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Locale Selector & Controls */}
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-slate-400 font-medium">Input Microphone Locale</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  disabled={isListening}
                  aria-label="Select speech language locale"
                  className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                >
                  {supportedLocales.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big Microphone Recording Hero Widget */}
            <div className="relative p-6 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Radiating audio wave rings when active */}
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-rose-500/10 animate-ping pointer-events-none" />
                  <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-pulse pointer-events-none" />
                </>
              )}

              <button
                onClick={toggleListening}
                disabled={!isSupported}
                aria-label={isListening ? 'Stop listening to microphone' : 'Start microphone recording'}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/50 ring-4 ring-rose-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/40'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-9 h-9 animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>

              <div className="mt-4">
                <span className="text-sm font-bold text-slate-200 block">
                  {isListening ? 'Listening for speech...' : 'Tap to Speak'}
                </span>
                <span className="text-xs text-slate-400">
                  {isListening
                    ? 'Speak clearly in Indian English'
                    : 'Press button or hit Spacebar to start'}
                </span>
              </div>
            </div>

            {/* Speech Transcript Output Box */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 min-h-[90px] flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Speech-to-Text Live Transcript
                </span>
                <p className="text-sm leading-relaxed text-slate-100">
                  {finalTranscript || interimTranscript ? (
                    <>
                      <span>{finalTranscript}</span>
                      {interimTranscript && (
                        <span className="text-indigo-400 italic ml-1 font-medium">
                          {interimTranscript}...
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs italic">
                      Spoken words will transcribe live here and automatically render signs below.
                    </span>
                  )}
                </p>
              </div>

              {(finalTranscript || interimTranscript) && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{finalTranscript.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <button
                    onClick={clearSpeech}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {speechError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Render Sign Sequence for Spoken Sentence */}
            <div className="pt-2">
              <SignSequenceViewer
                translation={glossResult}
                isLoading={isGlossLoading}
              />
            </div>
          </div>
        )}

        {/* ================= TAB B: TEXT → ISL ================= */}
        {activeTab === 'text' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Input Form */}
            <form onSubmit={handleManualTranslate} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Type English Sentence
                </label>
                <textarea
                  rows={3}
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="e.g. Where is the hospital? What is your name?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {typedText.length} characters
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!typedText.trim() || isGlossLoading}
                  isLoading={isGlossLoading}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Translate to Signs
                </Button>
              </div>
            </form>

            {/* Quick Conversation Prompts */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Suggested Conversation Starters
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-[11px] text-slate-300 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Error notifications */}
            {glossError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{glossError}</span>
              </div>
            )}

            {/* Embedded Sign Sequence Viewer */}
            <SignSequenceViewer
              translation={glossResult}
              isLoading={isGlossLoading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
