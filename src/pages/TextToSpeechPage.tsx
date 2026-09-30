import React, { useState, useEffect } from 'react';
import { speechSynthesisService } from '@/modules/speech/SpeechSynthesisService';
import { SpeechSynthesisVoiceOption } from '@/modules/speech/types';
import { conversationService } from '@/services/conversationService';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Send,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TextToSpeechPageProps {
  onNavigateToConversation?: () => void;
}

export const TextToSpeechPage: React.FC<TextToSpeechPageProps> = ({
  onNavigateToConversation,
}) => {
  const [text, setText] = useState<string>('Hello! Welcome to ISL Bridge assistive communication.');
  const [voices, setVoices] = useState<SpeechSynthesisVoiceOption[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  // Subscribe to service state and available voices
  useEffect(() => {
    const unsub = speechSynthesisService.subscribe((state) => {
      setVoices(state.availableVoices);
      setIsSpeaking(state.isSpeaking);
      if (state.availableVoices.length > 0 && !selectedVoiceUri) {
        const inVoice = state.availableVoices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en'));
        setSelectedVoiceUri(inVoice ? inVoice.voiceURI : state.availableVoices[0].voiceURI);
      }
    });

    return () => unsub();
  }, [selectedVoiceUri]);

  // Handle play / speak
  const handleSpeak = async () => {
    if (!text.trim()) return;
    setIsSpeaking(true);

    try {
      await speechSynthesisService.speak(text, {
        voiceURI: selectedVoiceUri,
        rate,
        pitch,
        volume,
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    speechSynthesisService.cancel();
    setIsSpeaking(false);
  };

  const handleSendToConversation = () => {
    if (!text.trim()) return;
    conversationService.addMessage(
      'hearing',
      'Hearing Speaker',
      'typed',
      text,
      text.toUpperCase().split(/\s+/),
      0.98
    );
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 2000);
    if (onNavigateToConversation) {
      setTimeout(() => onNavigateToConversation(), 500);
    }
  };

  const PRESETS = [
    'Hello! How can I help you today?',
    'I am communicating using Indian Sign Language.',
    'Where is the hospital? I need assistance.',
    'Thank you very much. Have a great day!',
    'Please wait one moment while I complete my sign.',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Text → Speech Synthesis
          </h1>
          <Badge variant="brand" size="sm">
            Assistive Audio
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          High-clarity browser voice synthesis with pitch, rate, and multilingual accent controls for spoken output.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Text Canvas & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sentence to Speak
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {text.length} characters
                </span>
              </div>

              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to speak aloud..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              {/* Quick Presets */}
              <div className="pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Assistive Phrases:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setText(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Playback Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSpeak}
                  disabled={!text.trim()}
                  leftIcon={
                    isSpeaking ? (
                      <Volume2 className="w-4 h-4 animate-bounce text-emerald-300" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )
                  }
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isSpeaking ? 'Speaking...' : 'Speak Aloud'}
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleStop}
                  disabled={!isSpeaking}
                  leftIcon={<VolumeX className="w-4 h-4 text-rose-400" />}
                >
                  Stop
                </Button>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={handleSendToConversation}
                disabled={!text.trim()}
                leftIcon={
                  sentSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Send className="w-4 h-4 text-indigo-400" />
                  )
                }
              >
                {sentSuccess ? 'Added to Conversation!' : 'Send to Conversation'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Audio & Voice Parameters */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Acoustic Parameters</h3>
            </div>

            {/* Voice Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Voice Persona</label>
              <select
                value={selectedVoiceUri}
                onChange={(e) => setSelectedVoiceUri(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Speech Rate</span>
                <span className="font-mono text-indigo-400 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Voice Pitch</span>
                <span className="font-mono text-indigo-400 font-bold">{pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            {/* Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Output Volume</span>
                <span className="font-mono text-indigo-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            {/* Reset Defaults */}
            <div className="pt-2 border-t border-slate-800/80">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-400"
                onClick={() => {
                  setRate(1.0);
                  setPitch(1.0);
                  setVolume(1.0);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Default Audio Parameters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
