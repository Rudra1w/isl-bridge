import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Type,
  ArrowRight,
  Sparkles,
  Volume2,
  Square,
  Globe,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { SignSequenceViewer } from './SignSequenceViewer';
import { useSpeechRecognition, useSpeechSynthesis } from '@/modules/speech/hooks';
import { SpeechRecognitionService } from '@/modules/speech/SpeechRecognitionService';
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
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // ISL Gloss / Translation Hook (Shared pipeline)
  const {
    result: glossResult,
    isLoading: isGlossLoading,
    error: glossError,
    translate: translateGloss,
  } = useISLGloss();

  // Speech Recognition Hook
  const {
    status: recognitionStatus,
    isListening,
    isSupported: isSpeechSupported,
    locale,
    errorMessage: speechError,
    interimTranscript,
    finalTranscript,
    confidence,
    toggleListening,
    setLocale,
    clear: clearSpeech,
    requestPermission,
    supportedLocales,
  } = useSpeechRecognition((rawFinal, normalizedFinal) => {
    if (onSpeechTranscribed) {
      onSpeechTranscribed(normalizedFinal || rawFinal);
    }
    // Shared pipeline: speech -> text -> normalization -> ISL translation -> sign output
    translateGloss(normalizedFinal || rawFinal);
  });

  // Speech Synthesis Hook (Text -> Speech)
  const {
    isSupported: isTtsSupported,
    isSpeaking,
    isPaused,
    availableVoices,
    selectedVoiceURI,
    rate,
    pitch,
    volume,
    speak,
    pause,
    resume,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  } = useSpeechSynthesis();

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
    const normalized = SpeechRecognitionService.normalizeTranscript(typedText);
    translateGloss(normalized);
  };

  const handlePromptClick = (prompt: string) => {
    setTypedText(prompt);
    const normalized = SpeechRecognitionService.normalizeTranscript(prompt);
    translateGloss(normalized);
  };

  // Speak currently available text (from speech transcript or typed text)
  const handleSpeakText = (textToSpeak: string) => {
    const clean = textToSpeak.trim();
    if (!clean) return;

    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(clean);
    }
  };

  // Render Status Badge for Speech Recognition
  const renderRecognitionBadge = () => {
    switch (recognitionStatus) {
      case 'listening':
        return (
          <Badge variant="success" pulse>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
            Listening
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="info" pulse>
            <Radio className="w-3 h-3 mr-1 inline-block animate-spin" />
            Processing
          </Badge>
        );
      case 'recognized':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
            Recognized ({Math.round(confidence * 100)}%)
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="danger">
            <ShieldAlert className="w-3 h-3 mr-1 inline-block" />
            Microphone Blocked
          </Badge>
        );
      case 'service-unavailable':
        return (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3 mr-1 inline-block" />
            Speech Service Unavailable
          </Badge>
        );
      case 'unsupported':
        return (
          <Badge variant="danger">
            <AlertCircle className="w-3 h-3 mr-1 inline-block" />
            Browser Unsupported
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="danger">
            <AlertCircle className="w-3 h-3 mr-1 inline-block" />
            Recognition Error
          </Badge>
        );
      case 'ready':
      default:
        return (
          <Badge variant="neutral">
            Ready
          </Badge>
        );
    }
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
            {/* Locale Selector & Status Readout */}
            <div className="flex items-center justify-between text-xs pb-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Status:</span>
                {renderRecognitionBadge()}
              </div>

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

            {/* Browser Unsupported Callout */}
            {!isSpeechSupported && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-0.5">Browser Unsupported</strong>
                  <span>
                    Your current browser does not support the Web Speech Recognition API.
                    Please open <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or use the <strong>Text → ISL</strong> tab to type your input directly.
                  </span>
                </div>
              </div>
            )}

            {/* Microphone Permission Blocked Callout */}
            {recognitionStatus === 'blocked' && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Microphone Blocked</strong>
                    <span>
                      Access was denied. Please allow microphone permissions in your browser address bar to use live speech recognition.
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={requestPermission}
                  className="shrink-0 text-xs py-1 px-2.5"
                >
                  Grant Access
                </Button>
              </div>
            )}

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
                disabled={!isSpeechSupported}
                aria-label={isListening ? 'Stop listening to microphone' : 'Start microphone recording'}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 ${
                  !isSpeechSupported
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isListening
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
                    ? 'Speak naturally in Indian English (en-IN)'
                    : 'Press button or hit Spacebar to start'}
                </span>
              </div>
            </div>

            {/* Speech Transcript Output Box */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 min-h-[90px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Speech-to-Text Live Transcript
                  </span>
                  {finalTranscript && (
                    <span className="text-[10px] text-emerald-400/90 font-medium">
                      Normalized & Pipeline Ready
                    </span>
                  )}
                </div>

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
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {finalTranscript.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Speak Output Action */}
                    {isTtsSupported && (
                      <button
                        onClick={() => handleSpeakText(finalTranscript || interimTranscript)}
                        title="Read transcript aloud via Text-to-Speech"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 transition-colors text-xs"
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3 h-3 text-rose-400" />
                            Stop Audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-indigo-400" />
                            Speak Output
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={clearSpeech}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {speechError && recognitionStatus !== 'blocked' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Voice Synthesis Controls Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                {showVoiceSettings ? 'Hide Voice Settings' : 'Configure Text-to-Speech Voice'}
              </button>

              {showVoiceSettings && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3 text-xs">
                  {/* Voice Selection */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Synthesized Voice
                    </label>
                    <select
                      value={selectedVoiceURI || ''}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang}) {v.isIndianEnglish ? '★ en-IN' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sliders: Rate, Pitch, Volume */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Speed</span>
                        <span>{rate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Pitch</span>
                        <span>{pitch.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Volume</span>
                        <span>{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Render Sign Sequence for Spoken Sentence */}
            <div className="pt-2">
              <SignSequenceViewer
                translation={glossResult}
                isLoading={isGlossLoading}
                onRetry={() => {
                  const targetText = finalTranscript || interimTranscript;
                  if (targetText) translateGloss(targetText);
                }}
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

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {typedText.length} characters
                </span>

                <div className="flex items-center gap-2">
                  {/* Speak Output Action for Typed Text */}
                  {typedText.trim() && isTtsSupported && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSpeakText(typedText)}
                      leftIcon={isSpeaking ? <Square className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                    >
                      {isSpeaking ? 'Stop Audio' : 'Speak Text'}
                    </Button>
                  )}

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
              onRetry={() => {
                if (typedText.trim()) translateGloss(typedText);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
