import React, { useState } from 'react';
import { SpeechInputPanel } from '@/modules/speech/SpeechInputPanel';
import { conversationService } from '@/services/conversationService';
import {
  Mic,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Send,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAccessibility } from '@/context/AccessibilityContext';

interface SpeechToTextPageProps {
  onNavigateToConversation?: () => void;
}

export const SpeechToTextPage: React.FC<SpeechToTextPageProps> = ({
  onNavigateToConversation,
}) => {
  const [accumulatedText, setAccumulatedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);
  const { speakText } = useAccessibility();

  const handleTranscriptChange = (finalText: string) => {
    if (!finalText.trim()) return;
    setAccumulatedText((prev) => (prev ? `${prev} ${finalText}` : finalText));
  };

  const handleCopy = () => {
    if (!accumulatedText) return;
    navigator.clipboard.writeText(accumulatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSpeak = () => {
    if (accumulatedText) {
      speakText(accumulatedText);
    }
  };

  const handleSendToConversation = () => {
    if (!accumulatedText.trim()) return;
    conversationService.addMessage(
      'hearing',
      'Hearing User',
      'speech',
      accumulatedText,
      accumulatedText.toUpperCase().split(/\s+/),
      0.95
    );
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 2000);
    if (onNavigateToConversation) {
      setTimeout(() => onNavigateToConversation(), 500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Speech → Text Recognition
          </h1>
          <Badge variant="brand" size="sm">
            Indian English (en-IN)
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Real-time speech-to-text with interim and final transcript processing, microphone permission handling, and fallback support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Microphone Control */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <SpeechInputPanel onTranscriptChange={handleTranscriptChange} />

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Voice Recognition Capabilities</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Configured specifically for English (India) speech patterns: <code className="text-indigo-300">en-IN</code>.</li>
              <li>Live interim recognition displays partial words before speech concludes.</li>
              <li>Network errors or permission blocks are detected and gracefully handled with user diagnostics.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Sentence Accumulator & Actions */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Recognized Sentence Stream
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {accumulatedText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* Text display */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-h-[180px]">
                {accumulatedText ? (
                  <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                    {accumulatedText}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center text-slate-600 text-xs">
                    <Mic className="w-6 h-6 mb-2 opacity-40 text-emerald-400" />
                    <span>Click "Start Speaking" on the microphone to transcribe speech</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAccumulatedText('')}
                  disabled={!accumulatedText}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  title="Clear text"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeak}
                  disabled={!accumulatedText}
                  leftIcon={<Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                >
                  Speak
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!accumulatedText}
                  leftIcon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSendToConversation}
                disabled={!accumulatedText.trim()}
                leftIcon={
                  sentSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {sentSuccess ? 'Sent to Conversation!' : 'Send to Conversation'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
